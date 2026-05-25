import { Schema, model, type Document, type Model, type Types } from "mongoose";
import type { DomainBookingSlot, SlotStatus } from "@bookmyvirunnu/shared";

export interface BookingSlotDocument extends Document, Omit<DomainBookingSlot, "_id" | "eventId" | "sourceRuleIds"> {
  _id: Types.ObjectId;
  eventId: Types.ObjectId;
  status: SlotStatus;
  sourceRuleIds: Types.ObjectId[];
}

const BookingSlotSchema = new Schema<BookingSlotDocument>(
  {
    eventId: { type: Schema.Types.ObjectId, required: true, index: true },
    dateKey: { type: String, required: true, index: true },
    startAt: { type: Date, required: true, index: true },
    endAt: { type: Date, required: true, index: true },
    occupiedStartAt: { type: Date, required: true },
    occupiedEndAt: { type: Date, required: true },
    capacity: { type: Number, required: true, min: 1 },
    reservedCount: { type: Number, required: true, default: 0, min: 0 },
    confirmedCount: { type: Number, required: true, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["open", "blocked", "locked"],
      required: true,
      default: "open",
      index: true
    },
    sourceRuleIds: { type: [Schema.Types.ObjectId], default: [] }
  },
  { timestamps: true }
);

BookingSlotSchema.index({ eventId: 1, startAt: 1, endAt: 1 }, { unique: true });
BookingSlotSchema.index({ eventId: 1, dateKey: 1, status: 1 });
BookingSlotSchema.index({ eventId: 1, occupiedStartAt: 1, occupiedEndAt: 1 });

export const BookingSlotModel: Model<BookingSlotDocument> = model<BookingSlotDocument>(
  "BookingSlot",
  BookingSlotSchema
);
