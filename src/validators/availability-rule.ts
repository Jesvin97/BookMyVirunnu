import { z } from "zod";
import { isoDateSchema } from "./common";

export const createAvailabilityRuleSchema = z.object({
  ruleType: z.enum(["weekly", "date_range", "specific_date", "blackout", "manual_hold"]),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  rangeStart: isoDateSchema.optional(),
  rangeEnd: isoDateSchema.optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  isBlocked: z.boolean().default(false),
  maxGuests: z.number().int().min(1).optional(),
  priority: z.number().int().default(0),
  reason: z.string().max(500).optional()
});

export const updateAvailabilityRuleSchema = createAvailabilityRuleSchema.partial();
