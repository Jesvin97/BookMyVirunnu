import type { HydratedDocument, Model, Types } from "mongoose";

export type BookingStatus = "pending" | "confirmed" | "rejected" | "cancelled" | "waitlisted";
export type EventStatus = "draft" | "published" | "paused" | "ended" | "cancelled";
export type Visibility = "private" | "unlisted" | "public";
export type BookingMode = "request" | "instant";
export type SlotStatus = "open" | "blocked" | "locked";
export type RuleType = "weekly" | "date_range" | "specific_date" | "blackout" | "manual_hold";

export interface BookingRules {
  slotDurationMinutes: number;
  minLeadMinutes: number;
  maxGuestsPerSlot: number;
  bufferMinutesBefore: number;
  bufferMinutesAfter: number;
  allowWaitlist: boolean;
  allowAutoApprove: boolean;
}

export interface TimeWindow {
  startTime: string;
  endTime: string;
}

export interface AvailabilityRuleInput extends TimeWindow {
  eventId: Types.ObjectId;
  ruleType: RuleType;
  daysOfWeek?: number[];
  date?: string;
  rangeStart?: Date;
  rangeEnd?: Date;
  isBlocked: boolean;
  maxGuests?: number;
  priority: number;
  reason?: string;
}

export interface SlotBuildOptions {
  eventId: Types.ObjectId;
  timezone: string;
  rangeStart: Date;
  rangeEnd: Date;
}

export interface BookingCreationInput {
  eventId: Types.ObjectId;
  guestUserId: Types.ObjectId;
  startAt: Date;
  endAt: Date;
  partySize: number;
  specialRequests?: string;
  idempotencyKey?: string;
}

export interface SlotConflict {
  code:
    | "event_not_published"
    | "event_not_bookable"
    | "outside_event_window"
    | "lead_time_violation"
    | "blackout_rule"
    | "manual_hold"
    | "time_overlap"
    | "duplicate_booking"
    | "capacity_limit"
    | "slot_missing"
    | "slot_locked"
    | "race_condition";
  message: string;
  details?: Record<string, unknown>;
}

export interface AvailabilitySlot {
  startAt: Date;
  endAt: Date;
  occupiedStartAt: Date;
  occupiedEndAt: Date;
  dateKey: string;
  capacity: number;
  sourceRuleIds: Types.ObjectId[];
}

export type BookingDocument = HydratedDocument<{
  eventId: Types.ObjectId;
  guestUserId: Types.ObjectId;
  slotId: Types.ObjectId;
  startAt: Date;
  endAt: Date;
  partySize: number;
  specialRequests?: string;
  status: BookingStatus;
  isActive: boolean;
  idempotencyKey?: string;
  holdExpiresAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
  cancelledAt?: Date;
}>;

export type BookingModel = Model<BookingDocument>;
