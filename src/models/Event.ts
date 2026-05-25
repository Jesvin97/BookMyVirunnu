import { Schema, model, type Document, type Model, type Types } from "mongoose";
import type { BookingMode, BookingRules, EventStatus, Visibility } from "../types";

export interface EventDocument extends Document {
  hostUserId: Types.ObjectId;
  title: string;
  description?: string;
  eventType: string;
  status: EventStatus;
  timezone: string;
  visibility: Visibility;
  startDate: Date;
  endDate: Date;
  venue?: {
    name?: string;
    address?: string;
    geo?: {
      lat?: number;
      lng?: number;
    };
  };
  coverImageUrl?: string;
  maxGuestsTotal: number;
  bookingMode: BookingMode;
  bookingRules: BookingRules;
  createdAt: Date;
  updatedAt: Date;
}

const BookingRulesSchema = new Schema<BookingRules>(
  {
    slotDurationMinutes: { type: Number, required: true, min: 5 },
    minLeadMinutes: { type: Number, required: true, min: 0, default: 0 },
    maxGuestsPerSlot: { type: Number, required: true, min: 1, default: 1 },
    bufferMinutesBefore: { type: Number, required: true, min: 0, default: 0 },
    bufferMinutesAfter: { type: Number, required: true, min: 0, default: 0 },
    allowWaitlist: { type: Boolean, required: true, default: true },
    allowAutoApprove: { type: Boolean, required: true, default: false }
  },
  { _id: false }
);

const EventSchema = new Schema<EventDocument>(
  {
    hostUserId: { type: Schema.Types.ObjectId, required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, trim: true, maxlength: 4000 },
    eventType: { type: String, required: true, trim: true, default: "virunnu" },
    status: {
      type: String,
      enum: ["draft", "published", "paused", "ended", "cancelled"],
      default: "draft",
      index: true
    },
    timezone: { type: String, required: true, default: "Asia/Kolkata" },
    visibility: {
      type: String,
      enum: ["private", "unlisted", "public"],
      required: true,
      default: "unlisted"
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    venue: {
      name: { type: String },
      address: { type: String },
      geo: {
        lat: { type: Number },
        lng: { type: Number }
      }
    },
    coverImageUrl: { type: String, trim: true },
    maxGuestsTotal: { type: Number, required: true, min: 1 },
    bookingMode: {
      type: String,
      enum: ["request", "instant"],
      required: true,
      default: "request"
    },
    bookingRules: { type: BookingRulesSchema, required: true }
  },
  { timestamps: true }
);

EventSchema.index({ hostUserId: 1, status: 1 });
EventSchema.index({ status: 1, visibility: 1 });

export const EventModel: Model<EventDocument> = model<EventDocument>("Event", EventSchema);
