import { Schema, model, type Document, type Model, type Types } from "mongoose";
import type { BookingStatus } from "../types";

export interface BookingDocument extends Document {
  eventId: Types.ObjectId;
  guestUserId: Types.ObjectId;
  slotId: Types.ObjectId;
  startAt: Date;
  endAt: Date;
  partySize: number;
  specialRequests?: string;
  venue?: {
    name?: string;
    address?: string;
    phone?: string;
  };
  status: BookingStatus;
  isActive: boolean;
  idempotencyKey?: string;
  holdExpiresAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
  cancelledAt?: Date;
}

const BookingSchema = new Schema<BookingDocument>(
  {
    eventId: { type: Schema.Types.ObjectId, required: true, index: true },
    guestUserId: { type: Schema.Types.ObjectId, required: true, index: true },
    slotId: { type: Schema.Types.ObjectId, required: true, index: true },
    startAt: { type: Date, required: true, index: true },
    endAt: { type: Date, required: true, index: true },
    partySize: { type: Number, required: true, min: 1 },
    specialRequests: { type: String, trim: true, maxlength: 2000 },
    venue: {
      name: { type: String, trim: true, maxlength: 500 },
      address: { type: String, trim: true, maxlength: 2000 },
      phone: { type: String, trim: true, maxlength: 30 }
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "rejected", "cancelled", "waitlisted"],
      required: true,
      default: "pending",
      index: true
    },
    isActive: { type: Boolean, required: true, default: true, index: true },
    idempotencyKey: { type: String, trim: true },
    holdExpiresAt: { type: Date, index: true },
    rejectionReason: { type: String, trim: true, maxlength: 500 },
    confirmedAt: { type: Date },
    cancelledAt: { type: Date }
  },
  { timestamps: true }
);

BookingSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });
BookingSchema.index(
  { eventId: 1, guestUserId: 1, isActive: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);
BookingSchema.index({ eventId: 1, startAt: 1, endAt: 1, status: 1 });

export const BookingModel: Model<BookingDocument> = model<BookingDocument>("Booking", BookingSchema);
