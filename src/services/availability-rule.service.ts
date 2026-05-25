import { Types } from "mongoose";
import { BookingConflictError, NotFoundError } from "../errors";
import { AvailabilityRuleModel, type AvailabilityRuleDocument } from "../models/AvailabilityRule";
import { AvailabilityEngine } from "./availability-engine";
import { EventService } from "./event.service";

export interface CreateAvailabilityRuleInput {
  ruleType: AvailabilityRuleDocument["ruleType"];
  daysOfWeek?: number[];
  date?: string;
  rangeStart?: Date;
  rangeEnd?: Date;
  startTime: string;
  endTime: string;
  isBlocked: boolean;
  maxGuests?: number;
  priority: number;
  reason?: string;
}

export type UpdateAvailabilityRuleInput = Partial<CreateAvailabilityRuleInput>;

export class AvailabilityRuleService {
  constructor(
    private readonly eventService = new EventService(),
    private readonly availabilityEngine = new AvailabilityEngine()
  ) {}

  async listRules(eventId: string, hostUserId: string): Promise<AvailabilityRuleDocument[]> {
    await this.eventService.getOwnedEvent(eventId, hostUserId);
    return AvailabilityRuleModel.find({ eventId: new Types.ObjectId(eventId) }).sort({ priority: -1 }).exec();
  }

  async createRule(eventId: string, hostUserId: string, input: CreateAvailabilityRuleInput): Promise<AvailabilityRuleDocument> {
    const event = await this.eventService.getOwnedEvent(eventId, hostUserId);
    this.assertRuleShape(input);

    const [rule] = await AvailabilityRuleModel.create([
      {
        eventId: event._id,
        ...input
      }
    ]);

    await this.resyncEvent(eventId, hostUserId);
    return rule;
  }

  async updateRule(ruleId: string, hostUserId: string, input: UpdateAvailabilityRuleInput): Promise<AvailabilityRuleDocument> {
    const rule = await this.getOwnedRule(ruleId, hostUserId);
    Object.assign(rule, input);
    this.assertRuleShape(rule as AvailabilityRuleDocument);
    await rule.save();

    await this.resyncEvent(rule.eventId.toString(), hostUserId);
    return rule;
  }

  async deleteRule(ruleId: string, hostUserId: string): Promise<{ deleted: boolean }> {
    const rule = await this.getOwnedRule(ruleId, hostUserId);
    await AvailabilityRuleModel.deleteOne({ _id: rule._id }).exec();
    await this.resyncEvent(rule.eventId.toString(), hostUserId);
    return { deleted: true };
  }

  private async getOwnedRule(ruleId: string, hostUserId: string): Promise<AvailabilityRuleDocument> {
    const rule = await AvailabilityRuleModel.findById(new Types.ObjectId(ruleId)).exec();
    if (!rule) throw new NotFoundError("Availability rule not found.");

    await this.eventService.getOwnedEvent(rule.eventId.toString(), hostUserId);
    return rule;
  }

  private async resyncEvent(eventId: string, hostUserId: string): Promise<void> {
    const event = await this.eventService.getOwnedEvent(eventId, hostUserId);
    const rules = await this.availabilityEngine.listRules(event._id);
    await this.availabilityEngine.syncSlotsForRange({
      event,
      rangeStart: event.startDate,
      rangeEnd: event.endDate,
      rules
    });
  }

  private assertRuleShape(input: Partial<CreateAvailabilityRuleInput> | AvailabilityRuleDocument): void {
    if (!input.startTime || !input.endTime) {
      throw new BookingConflictError("validation_error", "Availability rule must include start and end times.");
    }
    if (input.endTime <= input.startTime) {
      throw new BookingConflictError("validation_error", "Rule end time must be after start time.");
    }
    if (input.ruleType === "weekly" && (!input.daysOfWeek || input.daysOfWeek.length === 0)) {
      throw new BookingConflictError("validation_error", "Weekly rules require at least one day of week.");
    }
    if (input.ruleType === "specific_date" && !input.date) {
      throw new BookingConflictError("validation_error", "Specific-date rules require a date.");
    }
    if (input.ruleType === "date_range" && (!input.rangeStart || !input.rangeEnd)) {
      throw new BookingConflictError("validation_error", "Date-range rules require rangeStart and rangeEnd.");
    }
  }
}
