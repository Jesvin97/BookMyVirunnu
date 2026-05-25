import { Schema, model, type Document, type Model, type Types } from "mongoose";
import type { DomainAvailabilityRule, RuleType } from "@bookmyvirunnu/shared";

export interface AvailabilityRuleDocument extends Document, Omit<DomainAvailabilityRule, "_id" | "eventId"> {
  _id: Types.ObjectId;
  eventId: Types.ObjectId;
  ruleType: RuleType;
}

const AvailabilityRuleSchema = new Schema<AvailabilityRuleDocument>(
  {
    eventId: { type: Schema.Types.ObjectId, required: true, index: true },
    ruleType: {
      type: String,
      enum: ["weekly", "date_range", "specific_date", "blackout", "manual_hold"],
      required: true
    },
    daysOfWeek: { type: [Number], default: undefined },
    date: { type: String },
    rangeStart: { type: Date },
    rangeEnd: { type: Date },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    isBlocked: { type: Boolean, required: true, default: false },
    maxGuests: { type: Number, min: 1 },
    priority: { type: Number, required: true, default: 0 },
    reason: { type: String, trim: true, maxlength: 500 }
  },
  { timestamps: true }
);

AvailabilityRuleSchema.index({ eventId: 1, ruleType: 1 });
AvailabilityRuleSchema.index({ eventId: 1, priority: -1 });

export const AvailabilityRuleModel: Model<AvailabilityRuleDocument> = model<AvailabilityRuleDocument>(
  "AvailabilityRule",
  AvailabilityRuleSchema
);
