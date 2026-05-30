import { z } from "zod";
import { timezoneSchema } from "./common";

export const registerSchema = z.object({
  role: z.enum(["couple", "guest"]).default("guest"),
  name: z.string().min(2).max(140),
  email: z.string().email(),
  phone: z.string().min(6).max(32).optional(),
  password: z
    .string()
    .min(12)
    .max(128)
    .regex(/[a-z]/, "Password must contain a lowercase letter.")
    .regex(/[A-Z]/, "Password must contain an uppercase letter.")
    .regex(/[0-9]/, "Password must contain a number.")
    .regex(/[^A-Za-z0-9]/, "Password must contain a symbol."),
  timezone: timezoneSchema.default("Asia/Kolkata"),
  locale: z.string().min(2).max(20).default("en")
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const quickRegisterSchema = z.object({
  coupleName: z.string().min(2).max(140),
  title: z.string().min(2).max(140).optional(),
  description: z.string().max(4000).optional(),
  startDate: z.string(),
  endDate: z.string(),
  enableLunch: z.boolean().default(true),
  enableDinner: z.boolean().default(true),
  phone: z.string().min(6).max(32).optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  blockedDates: z.array(z.string()).optional()
});

export const accessIdSchema = z.object({
  eventId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId.")
});

