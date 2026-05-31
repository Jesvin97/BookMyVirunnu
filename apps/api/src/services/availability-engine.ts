import { Types, type ClientSession } from "mongoose";
import { AvailabilityRuleModel, type AvailabilityRuleDocument } from "../models/AvailabilityRule";
import { BookingSlotModel, type BookingSlotDocument } from "../models/BookingSlot";
import type { EventDocument } from "../models/Event";
import type { AvailabilitySlot, SlotConflict } from "@bookmyvirunnu/shared";
import {
  addMinutes,
  compareDatesAsc,
  formatDateKey,
  parseDateKey,
  toUtcFromDateKeyAndTime
} from "../utils/timezone";

interface Interval {
  start: Date;
  end: Date;
  ruleIds: Types.ObjectId[];
  blocked: boolean;
  capacityOverride?: number;
}

interface BuildRange {
  event: EventDocument;
  rangeStart: Date;
  rangeEnd: Date;
  rules: AvailabilityRuleDocument[];
  session?: ClientSession;
}

export class AvailabilityEngine {
  async listRules(eventId: Types.ObjectId, session?: ClientSession): Promise<AvailabilityRuleDocument[]> {
    const query = AvailabilityRuleModel.find({ eventId }).sort({ priority: -1, createdAt: 1 });
    if (session) query.session(session);
    return query.exec();
  }

  async previewSlots(input: BuildRange): Promise<AvailabilitySlot[]> {
    return this.buildSlots(input);
  }

  async syncSlotsForRange(input: BuildRange): Promise<void> {
    const slots = this.buildSlots(input);
    const { event, rangeStart, rangeEnd } = input;

    const existingQuery = BookingSlotModel.find({
      eventId: event._id,
      startAt: { $gte: rangeStart },
      endAt: { $lte: rangeEnd }
    });
    if (input.session) existingQuery.session(input.session);
    const existing = await existingQuery.exec();

    const existingMap = new Map<string, BookingSlotDocument>();
    for (const slot of existing) {
      existingMap.set(this.slotKey(event._id, slot.startAt, slot.endAt), slot);
    }

    const expectedKeys = new Set<string>();
    const upserts = slots.map((slot) => {
      const key = this.slotKey(event._id, slot.startAt, slot.endAt);
      expectedKeys.add(key);
      const prior = existingMap.get(key);
      const reservedCount = prior?.reservedCount ?? 0;
      const confirmedCount = prior?.confirmedCount ?? 0;
      const status: "open" | "locked" =
        prior?.status === "locked" && reservedCount === 0 && confirmedCount === 0
          ? "locked"
          : reservedCount >= slot.capacity
            ? "locked"
            : "open";
      return {
        updateOne: {
          filter: { eventId: event._id, startAt: slot.startAt, endAt: slot.endAt },
          update: {
            $set: {
              eventId: event._id,
              dateKey: slot.dateKey,
              startAt: slot.startAt,
              endAt: slot.endAt,
              occupiedStartAt: slot.occupiedStartAt,
              occupiedEndAt: slot.occupiedEndAt,
              capacity: slot.capacity,
              status,
              sourceRuleIds: slot.sourceRuleIds.map((id) => new Types.ObjectId(id))
            },
            $setOnInsert: {
              reservedCount,
              confirmedCount
            }
          },
          upsert: true
        }
      };
    });

    const blockedOrLocked = existing
      .filter((slot) => !expectedKeys.has(this.slotKey(event._id, slot.startAt, slot.endAt)))
      .map((slot) => {
        if (slot.reservedCount > 0 || slot.confirmedCount > 0) {
          const lockedStatus: "locked" = "locked";
          return {
            updateOne: {
              filter: { _id: slot._id },
              update: { $set: { status: lockedStatus } }
            }
          };
        }
        const blockedStatus: "blocked" = "blocked";
        return {
          updateOne: {
            filter: { _id: slot._id, status: { $ne: "blocked" as any } },
            update: { $set: { status: blockedStatus } }
          }
        };
      });

    const operations = [...upserts, ...blockedOrLocked];
    if (operations.length > 0) {
      await BookingSlotModel.bulkWrite(operations, { ordered: false, session: input.session });
    }
  }

  async ensureSlotExists(input: {
    event: EventDocument;
    startAt: Date;
    endAt: Date;
    session?: ClientSession;
  }): Promise<BookingSlotDocument | null> {
    const slotQuery = BookingSlotModel.findOne({
      eventId: input.event._id,
      startAt: input.startAt,
      endAt: input.endAt
    });
    if (input.session) slotQuery.session(input.session);
    const slot = await slotQuery.exec();

    if (slot) return slot;

    const timezone = input.event.timezone;
    const dateKey = formatDateKey(input.startAt, timezone);
    const dayStart = toUtcFromDateKeyAndTime(dateKey, "00:00", timezone);
    const dayEnd = toUtcFromDateKeyAndTime(dateKey, "23:59", timezone);

    await this.syncSlotsForRange({
      event: input.event,
      rangeStart: dayStart,
      rangeEnd: dayEnd,
      rules: await this.listRules(input.event._id, input.session),
      session: input.session
    });

    const refreshedQuery = BookingSlotModel.findOne({
      eventId: input.event._id,
      startAt: input.startAt,
      endAt: input.endAt
    });
    if (input.session) refreshedQuery.session(input.session);
    return refreshedQuery.exec();
  }

  validateRequestedSlot(input: {
    event: EventDocument;
    rules: AvailabilityRuleDocument[];
    slot: BookingSlotDocument;
    partySize: number;
    requestedStartAt: Date;
    requestedEndAt: Date;
    now?: Date;
  }): SlotConflict | null {
    const { event, rules, slot, partySize, requestedStartAt, requestedEndAt } = input;
    const now = input.now ?? new Date();

    if (event.status !== "published") {
      return { code: "event_not_published", message: "This event is not accepting bookings right now." };
    }

    if (requestedStartAt.getTime() !== slot.startAt.getTime() || requestedEndAt.getTime() !== slot.endAt.getTime()) {
      return {
        code: "outside_event_window",
        message: "The requested time does not match an available booking slot."
      };
    }

    if (requestedStartAt.getTime() < addMinutes(now, event.bookingRules.minLeadMinutes).getTime()) {
      return { code: "lead_time_violation", message: "This slot is too close to the current time to book." };
    }

    if (requestedStartAt.getTime() < event.startDate.getTime() || requestedEndAt.getTime() > event.endDate.getTime()) {
      return {
        code: "outside_event_window",
        message: "The requested time falls outside the event window."
      };
    }

    if (slot.status === "blocked") {
      return { code: "blackout_rule", message: "This slot is blocked by host availability rules." };
    }

    if (slot.status === "locked" && slot.reservedCount < slot.capacity) {
      return { code: "slot_locked", message: "This slot is locked by the host." };
    }

    if (slot.status === "locked" && slot.reservedCount >= slot.capacity) {
      return { code: "capacity_limit", message: "This slot is already full." };
    }

    const blockedMatch = rules.find((rule) => {
      if (!rule.isBlocked) return false;
      return (
        this.ruleAppliesToDate(rule, requestedStartAt, event.timezone) &&
        this.intervalsOverlap(
          { start: slot.occupiedStartAt, end: slot.occupiedEndAt },
          {
            start: toUtcFromDateKeyAndTime(formatDateKey(requestedStartAt, event.timezone), rule.startTime, event.timezone),
            end: toUtcFromDateKeyAndTime(formatDateKey(requestedStartAt, event.timezone), rule.endTime, event.timezone)
          }
        )
      );
    });

    if (blockedMatch) {
      return {
        code: blockedMatch.ruleType === "manual_hold" ? "manual_hold" : "blackout_rule",
        message: blockedMatch.reason ?? "This time is blocked by host rules.",
        details: { ruleId: blockedMatch._id.toString() }
      };
    }

    const allowedRuleExists = rules.some((rule) => {
      if (rule.isBlocked) return false;
      if (!this.ruleAppliesToDate(rule, requestedStartAt, event.timezone)) return false;
      const ruleInterval = {
        start: toUtcFromDateKeyAndTime(formatDateKey(requestedStartAt, event.timezone), rule.startTime, event.timezone),
        end: toUtcFromDateKeyAndTime(formatDateKey(requestedStartAt, event.timezone), rule.endTime, event.timezone)
      };
      return this.intervalsOverlap({ start: slot.startAt, end: slot.endAt }, ruleInterval);
    });

    if (!allowedRuleExists) {
      return {
        code: "event_not_bookable",
        message: "No active availability rule covers the requested time."
      };
    }

    if (slot.reservedCount + partySize > slot.capacity) {
      return {
        code: "capacity_limit",
        message: "This slot cannot accommodate the requested party size.",
        details: {
          requestedPartySize: partySize,
          remainingCapacity: Math.max(slot.capacity - slot.reservedCount, 0)
        }
      };
    }

    return null;
  }

  private buildSlots(input: BuildRange): AvailabilitySlot[] {
    const { event, rangeStart, rangeEnd, rules } = input;
    const timezone = event.timezone;
    const startKey = formatDateKey(rangeStart, timezone);
    const endKey = formatDateKey(rangeEnd, timezone);
    const duration = event.bookingRules.slotDurationMinutes;
    const bufferBefore = event.bookingRules.bufferMinutesBefore;
    const bufferAfter = event.bookingRules.bufferMinutesAfter;
    const stepMinutes = duration + bufferBefore + bufferAfter;

    const slots: AvailabilitySlot[] = [];
    for (let dateKey = startKey; dateKey <= endKey; dateKey = this.nextDateKey(dateKey)) {
      const openIntervals = this.computeOpenIntervals(dateKey, rules, timezone);
      for (const interval of openIntervals) {
        let start = addMinutes(interval.start, bufferBefore);
        const latestStart = addMinutes(interval.end, -(duration + bufferAfter));

        while (start.getTime() <= latestStart.getTime()) {
          const end = addMinutes(start, duration);
          const occupiedStartAt = addMinutes(start, -bufferBefore);
          const occupiedEndAt = addMinutes(end, bufferAfter);
          const capacity = this.resolveCapacity(event, interval.capacityOverride);

          if (occupiedStartAt.getTime() >= interval.start.getTime() && occupiedEndAt.getTime() <= interval.end.getTime()) {
            slots.push({
              startAt: start,
              endAt: end,
              occupiedStartAt,
              occupiedEndAt,
              dateKey,
              capacity,
              sourceRuleIds: interval.ruleIds.map((id) => id.toString())
            });
          }

          start = addMinutes(start, stepMinutes);
        }
      }
    }

    slots.sort((a, b) => compareDatesAsc(a.startAt, b.startAt));
    return slots;
  }

  private computeOpenIntervals(dateKey: string, rules: AvailabilityRuleDocument[], timezone: string): Interval[] {
    const localDate = parseDateKey(dateKey);
    const dayOfWeek = new Date(Date.UTC(localDate.year, localDate.month - 1, localDate.day)).getUTCDay();

    const activeRules = rules.filter((rule) => this.ruleAppliesToDateKey(rule, dateKey, dayOfWeek, timezone));
    const openRules = activeRules.filter((rule) => !rule.isBlocked);
    const blockedRules = activeRules.filter((rule) => rule.isBlocked);

    const openIntervals = openRules.map((rule) => this.ruleToInterval(rule, dateKey, timezone));
    const blockedIntervals = blockedRules.map((rule) => this.ruleToInterval(rule, dateKey, timezone));

    return this.subtractIntervals(this.mergeIntervals(openIntervals), blockedIntervals);
  }

  private ruleToInterval(rule: AvailabilityRuleDocument, dateKey: string, timezone: string): Interval {
    const start = toUtcFromDateKeyAndTime(dateKey, rule.startTime, timezone);
    const end = toUtcFromDateKeyAndTime(dateKey, rule.endTime, timezone);
    return {
      start,
      end,
      ruleIds: [rule._id],
      blocked: rule.isBlocked,
      capacityOverride: rule.maxGuests
    };
  }

  private ruleAppliesToDate(rule: AvailabilityRuleDocument, date: Date, timezone: string): boolean {
    const dateKey = formatDateKey(date, timezone);
    const localDate = parseDateKey(dateKey);
    const dayOfWeek = new Date(Date.UTC(localDate.year, localDate.month - 1, localDate.day)).getUTCDay();
    return this.ruleAppliesToDateKey(rule, dateKey, dayOfWeek, timezone);
  }

  private ruleAppliesToDateKey(
    rule: AvailabilityRuleDocument,
    dateKey: string,
    dayOfWeek: number,
    timezone: string
  ): boolean {
    if (rule.ruleType === "weekly") {
      return Array.isArray(rule.daysOfWeek) && rule.daysOfWeek.includes(dayOfWeek);
    }

    if (rule.ruleType === "specific_date") {
      return rule.date === dateKey;
    }

    if (rule.ruleType === "date_range" || rule.ruleType === "blackout" || rule.ruleType === "manual_hold") {
      const matchesStart = !rule.rangeStart || formatDateKey(rule.rangeStart, timezone) <= dateKey;
      const matchesEnd = !rule.rangeEnd || formatDateKey(rule.rangeEnd, timezone) >= dateKey;
      return matchesStart && matchesEnd;
    }

    return false;
  }

  private mergeIntervals(intervals: Interval[]): Interval[] {
    if (intervals.length === 0) return [];
    const sorted = [...intervals].sort((a, b) => compareDatesAsc(a.start, b.start));
    const merged: Interval[] = [structuredCloneInterval(sorted[0])];

    for (let i = 1; i < sorted.length; i += 1) {
      const current = sorted[i];
      const last = merged[merged.length - 1];
      if (current.start.getTime() <= last.end.getTime()) {
        last.end = new Date(Math.max(last.end.getTime(), current.end.getTime()));
        const unique = new Set([...last.ruleIds.map(String), ...current.ruleIds.map(String)]);
        last.ruleIds = [...unique].map((id) => new Types.ObjectId(id));
        last.capacityOverride = this.pickCapacity(last.capacityOverride, current.capacityOverride);
      } else {
        merged.push(structuredCloneInterval(current));
      }
    }

    return merged;
  }

  private subtractIntervals(open: Interval[], blocked: Interval[]): Interval[] {
    if (blocked.length === 0) return open;
    const sortedBlocked = [...blocked].sort((a, b) => compareDatesAsc(a.start, b.start));
    const result: Interval[] = [];

    for (const interval of open) {
      let cursorStart = interval.start;
      for (const block of sortedBlocked) {
        if (!this.intervalsOverlap({ start: cursorStart, end: interval.end }, block)) continue;

        if (block.start > cursorStart) {
          result.push({
            start: cursorStart,
            end: new Date(Math.min(block.start.getTime(), interval.end.getTime())),
            ruleIds: [...interval.ruleIds],
            blocked: false,
            capacityOverride: interval.capacityOverride
          });
        }

        cursorStart = new Date(Math.max(cursorStart.getTime(), block.end.getTime()));
        if (cursorStart.getTime() >= interval.end.getTime()) break;
      }

      if (cursorStart.getTime() < interval.end.getTime()) {
        result.push({
          start: cursorStart,
          end: interval.end,
          ruleIds: [...interval.ruleIds],
          blocked: false,
          capacityOverride: interval.capacityOverride
        });
      }
    }

    return result.filter((interval) => interval.end.getTime() > interval.start.getTime());
  }

  private pickCapacity(current?: number, next?: number): number | undefined {
    if (typeof current !== "number") return next;
    if (typeof next !== "number") return current;
    return Math.min(current, next);
  }

  private resolveCapacity(event: EventDocument, intervalCapacityOverride?: number): number {
    const capCandidates = [event.bookingRules.maxGuestsPerSlot];
    if (typeof intervalCapacityOverride === "number" && intervalCapacityOverride > 0) {
      capCandidates.push(intervalCapacityOverride);
    }
    return Math.min(...capCandidates);
  }

  private intervalsOverlap(a: { start: Date; end: Date }, b: { start: Date; end: Date }): boolean {
    return a.start.getTime() < b.end.getTime() && b.start.getTime() < a.end.getTime();
  }

  private nextDateKey(dateKey: string): string {
    const { year, month, day } = parseDateKey(dateKey);
    const next = new Date(Date.UTC(year, month - 1, day));
    next.setUTCDate(next.getUTCDate() + 1);
    return [
      next.getUTCFullYear().toString().padStart(4, "0"),
      (next.getUTCMonth() + 1).toString().padStart(2, "0"),
      next.getUTCDate().toString().padStart(2, "0")
    ].join("-");
  }

  private slotKey(eventId: Types.ObjectId, startAt: Date, endAt: Date): string {
    return `${eventId.toString()}:${startAt.toISOString()}:${endAt.toISOString()}`;
  }
}

function structuredCloneInterval(interval: Interval): Interval {
  return {
    start: new Date(interval.start),
    end: new Date(interval.end),
    ruleIds: [...interval.ruleIds],
    blocked: interval.blocked,
    capacityOverride: interval.capacityOverride
  };
}
