import { z } from "zod";
import { timezoneSchema } from "./common";

export const registerSchema = z.object({
  role: z.enum(["couple", "guest"]).default("guest"),
  name: z.string().min(2).max(140),
  email: z.string().email(),
  phone: z.string().min(6).max(32).optional(),
  password: z.string().min(8).max(128),
  timezone: timezoneSchema.default("Asia/Kolkata"),
  locale: z.string().min(2).max(20).default("en")
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});
