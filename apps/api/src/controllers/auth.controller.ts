import type { Request, Response } from "express";
import { Types } from "mongoose";
import bcrypt from "bcryptjs";
import { AuthService } from "../services/auth.service";
import { EventService } from "../services/event.service";
import { AvailabilityRuleService } from "../services/availability-rule.service";
import { UserModel } from "../models/User";
import { EventModel } from "../models/Event";
import { loginSchema, registerSchema, quickRegisterSchema, accessIdSchema } from "../validators/auth";
import { asyncHandler, sendSuccess } from "../utils/http";

const authService = new AuthService();

function serializeUser(user: unknown) {
  const typed = user as {
  _id: { toString(): string };
  role: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  locale: string;
  timezone: string;
  avatarUrl?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  };

  return {
    id: typed._id.toString(),
    role: typed.role,
    name: typed.name,
    email: typed.email,
    phone: typed.phone,
    status: typed.status,
    locale: typed.locale,
    timezone: typed.timezone,
    avatarUrl: typed.avatarUrl,
    lastLoginAt: typed.lastLoginAt,
    createdAt: typed.createdAt,
    updatedAt: typed.updatedAt
  };
}

export class AuthController {
  register = asyncHandler(async (req: Request, res: Response) => {
    const input = registerSchema.parse(req.body);
    const { user, token } = await authService.register({
      role: input.role,
      name: input.name,
      email: input.email,
      phone: input.phone,
      password: input.password,
      timezone: input.timezone,
      locale: input.locale
    });
    sendSuccess(res, { user: serializeUser(user), token }, 201);
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const input = loginSchema.parse(req.body);
    const { user, token } = await authService.login({
      email: input.email,
      password: input.password
    });
    sendSuccess(res, { user: serializeUser(user), token });
  });

  me = asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) {
      res.status(401).json({ success: false, error: { code: "unauthorized", message: "Missing authentication." } });
      return;
    }
    const user = await authService.me(req.auth.id);
    sendSuccess(res, { user: serializeUser(user) });
  });

  quickRegister = asyncHandler(async (req: Request, res: Response) => {
    const input = quickRegisterSchema.parse(req.body);

    const randomStr = Math.random().toString(36).substring(2, 10);
    const anonymousEmail = `couple-${Date.now()}-${randomStr}@anonymous.bookmyvirunnu.com`;
    const passwordHash = await bcrypt.hash(`passwordless-${randomStr}`, 12);
    
    // Create shadow couple user
    const [user] = await UserModel.create([
      {
        role: "couple",
        name: input.coupleName.trim(),
        email: anonymousEmail,
        phone: input.phone?.trim(),
        passwordHash,
        timezone: "Asia/Kolkata",
        locale: "en",
        status: "active"
      }
    ]);

    const eventService = new EventService();
    const ruleService = new AvailabilityRuleService();

    // Auto-generate title and description if missing
    const generatedTitle = input.title || `${input.coupleName}'s Feast Schedule 🍛`;
    const generatedDescription = input.description || `A warm invitation from ${input.coupleName} to call us to your home for a beautiful Sadhya (Lunch) or Virunnu (Dinner) feast!`;

    // Create the feast calendar
    const event = await eventService.createEvent({
      hostUserId: user._id.toString(),
      title: generatedTitle,
      description: generatedDescription,
      eventType: "feast",
      timezone: "Asia/Kolkata",
      visibility: "public",
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      venue: {
        name: "Various Host Homes"
      },
      maxGuestsTotal: (input.enableBreakfast ? 1 : 0) + (input.enableLunch ? 1 : 0) + (input.enableDinner ? 1 : 0),
      bookingMode: "instant",
      bookingRules: {
        slotDurationMinutes: 180,
        minLeadMinutes: 60,
        maxGuestsPerSlot: 1,
        bufferMinutesBefore: 0,
        bufferMinutesAfter: 0,
        allowWaitlist: false,
        allowAutoApprove: true
      },
      status: "published", // Automatically publish to generate slots
      dietaryRestrictions: input.dietaryRestrictions || []
    });

    const allDays = [0, 1, 2, 3, 4, 5, 6];

    if (input.enableBreakfast) {
      await ruleService.createRule(event._id.toString(), user._id.toString(), {
        ruleType: "weekly",
        daysOfWeek: allDays,
        startTime: "08:00",
        endTime: "11:00",
        maxGuests: 1,
        isBlocked: false,
        priority: 1,
        reason: "Breakfast Slot"
      });
    }

    if (input.enableLunch) {
      await ruleService.createRule(event._id.toString(), user._id.toString(), {
        ruleType: "weekly",
        daysOfWeek: allDays,
        startTime: "12:00",
        endTime: "15:00",
        maxGuests: 1,
        isBlocked: false,
        priority: 1,
        reason: "Lunch Slot"
      });
    }

    if (input.enableDinner) {
      await ruleService.createRule(event._id.toString(), user._id.toString(), {
        ruleType: "weekly",
        daysOfWeek: allDays,
        startTime: "19:00",
        endTime: "22:00",
        maxGuests: 1,
        isBlocked: false,
        priority: 1,
        reason: "Dinner Slot"
      });
    }

    // Process pre-blocked rest dates
    if (input.blockedDates && input.blockedDates.length > 0) {
      for (const blockedDate of input.blockedDates) {
        try {
          await ruleService.createRule(event._id.toString(), user._id.toString(), {
            ruleType: "specific_date",
            date: blockedDate,
            startTime: "00:00",
            endTime: "23:59",
            isBlocked: true,
            priority: 10,
            reason: "Pre-blocked private rest day"
          });
        } catch (ruleErr) {
          console.error(`Failed to create pre-block rule for date ${blockedDate}:`, ruleErr);
        }
      }
    }

    const token = authService.sign(user);

    sendSuccess(res, {
      token,
      user: serializeUser(user),
      event: {
        id: event._id.toString(),
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate
      }
    }, 201);
  });

  loginWithFeastId = asyncHandler(async (req: Request, res: Response) => {
    const { eventId } = accessIdSchema.parse(req.body);

    const event = await EventModel.findById(new Types.ObjectId(eventId));
    if (!event) {
      res.status(404).json({ success: false, error: { code: "not_found", message: "Feast Calendar not found." } });
      return;
    }

    const user = await UserModel.findById(event.hostUserId);
    if (!user) {
      res.status(404).json({ success: false, error: { code: "not_found", message: "Associated couple user not found." } });
      return;
    }

    const token = authService.sign(user);

    sendSuccess(res, {
      token,
      user: serializeUser(user),
      event: {
        id: event._id.toString(),
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate
      }
    });
  });

  logout = asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, { loggedOut: true });
  });
}
