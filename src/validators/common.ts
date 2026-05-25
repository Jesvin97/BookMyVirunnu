import { z } from "zod";

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId.");

export const timezoneSchema = z.string().min(1).max(80);

export const isoDateSchema = z.string().datetime();

export const bookingRulesSchema = z.object({
  slotDurationMinutes: z.number().int().min(5),
  minLeadMinutes: z.number().int().min(0).default(0),
  maxGuestsPerSlot: z.number().int().min(1),
  bufferMinutesBefore: z.number().int().min(0).default(0),
  bufferMinutesAfter: z.number().int().min(0).default(0),
  allowWaitlist: z.boolean().default(true),
  allowAutoApprove: z.boolean().default(false)
});
