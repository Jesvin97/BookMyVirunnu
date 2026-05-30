import { z } from "zod";
import { isoDateSchema, objectIdSchema } from "./common";

export const createBookingSchema = z.object({
  eventId: objectIdSchema,
  startAt: isoDateSchema,
  endAt: isoDateSchema,
  partySize: z.number().int().min(1).default(1),
  specialRequests: z.string().max(2000).optional(),
  idempotencyKey: z.string().min(8).max(100).optional(),
  guestName: z.string().max(140).optional(),
  guestEmail: z.string().max(200).optional(),
  guestPhone: z.string().max(30).optional(),
  venueAddress: z.string().max(2000).optional()
});

export const bookingActionSchema = z.object({
  reason: z.string().max(500).optional()
});

export const availabilityPreviewSchema = z.object({
  eventId: objectIdSchema.optional(),
  rangeStart: isoDateSchema,
  rangeEnd: isoDateSchema
});
