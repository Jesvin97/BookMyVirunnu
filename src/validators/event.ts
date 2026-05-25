import { z } from "zod";
import { bookingRulesSchema, isoDateSchema, timezoneSchema } from "./common";

const venueSchema = z
  .object({
    name: z.string().min(1).max(140).optional(),
    address: z.string().min(1).max(500).optional(),
    geo: z
      .object({
        lat: z.number().optional(),
        lng: z.number().optional()
      })
      .optional()
  })
  .optional();

export const createEventSchema = z.object({
  title: z.string().min(2).max(140),
  description: z.string().max(4000).optional(),
  eventType: z.string().min(1).max(50).default("virunnu"),
  timezone: timezoneSchema.default("Asia/Kolkata"),
  visibility: z.enum(["private", "unlisted", "public"]).default("unlisted"),
  startDate: isoDateSchema,
  endDate: isoDateSchema,
  venue: venueSchema,
  coverImageUrl: z.string().url().optional(),
  maxGuestsTotal: z.number().int().min(1),
  bookingMode: z.enum(["request", "instant"]).default("request"),
  bookingRules: bookingRulesSchema
});

export const updateEventSchema = createEventSchema.partial().extend({
  status: z.enum(["draft", "published", "paused", "ended", "cancelled"]).optional()
});
