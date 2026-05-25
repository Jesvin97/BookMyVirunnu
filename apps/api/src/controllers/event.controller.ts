import type { Request, Response } from "express";
import { EventService } from "../services/event.service";
import { asyncHandler, sendSuccess } from "../utils/http";
import { toParam } from "../utils/params";
import { createEventSchema, updateEventSchema } from "../validators/event";
import { objectIdSchema } from "../validators/common";

const eventService = new EventService();

export class EventController {
  create = asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) {
      res.status(401).json({ success: false, error: { code: "unauthorized", message: "Missing authentication." } });
      return;
    }

    const input = createEventSchema.parse(req.body);
    const event = await eventService.createEvent({
      hostUserId: req.auth.id,
      title: input.title,
      description: input.description,
      eventType: input.eventType,
      timezone: input.timezone,
      visibility: input.visibility,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      venue: input.venue,
      coverImageUrl: input.coverImageUrl,
      maxGuestsTotal: input.maxGuestsTotal,
      bookingMode: input.bookingMode,
      bookingRules: {
        slotDurationMinutes: input.bookingRules.slotDurationMinutes,
        minLeadMinutes: input.bookingRules.minLeadMinutes,
        maxGuestsPerSlot: input.bookingRules.maxGuestsPerSlot,
        bufferMinutesBefore: input.bookingRules.bufferMinutesBefore,
        bufferMinutesAfter: input.bookingRules.bufferMinutesAfter,
        allowWaitlist: input.bookingRules.allowWaitlist,
        allowAutoApprove: input.bookingRules.allowAutoApprove
      }
    });

    sendSuccess(res, { event }, 201);
  });

  listMine = asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) {
      res.status(401).json({ success: false, error: { code: "unauthorized", message: "Missing authentication." } });
      return;
    }
    const events = await eventService.listMyEvents(req.auth.id);
    sendSuccess(res, { events });
  });

  listPublic = asyncHandler(async (_req: Request, res: Response) => {
    const events = await eventService.listPublicEvents();
    sendSuccess(res, { events });
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const eventId = objectIdSchema.parse(toParam(req.params.eventId));
    const event = await eventService.getVisibleById(eventId, req.auth?.id);
    sendSuccess(res, { event });
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) {
      res.status(401).json({ success: false, error: { code: "unauthorized", message: "Missing authentication." } });
      return;
    }
    const eventId = objectIdSchema.parse(toParam(req.params.eventId));
    const input = updateEventSchema.parse(req.body);
    const updateInput = {
      title: input.title,
      description: input.description,
      eventType: input.eventType,
      timezone: input.timezone,
      visibility: input.visibility,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
      venue: input.venue,
      coverImageUrl: input.coverImageUrl,
      maxGuestsTotal: input.maxGuestsTotal,
      bookingMode: input.bookingMode,
      bookingRules: input.bookingRules
        ? {
            slotDurationMinutes: input.bookingRules.slotDurationMinutes,
            minLeadMinutes: input.bookingRules.minLeadMinutes,
            maxGuestsPerSlot: input.bookingRules.maxGuestsPerSlot,
            bufferMinutesBefore: input.bookingRules.bufferMinutesBefore,
            bufferMinutesAfter: input.bookingRules.bufferMinutesAfter,
            allowWaitlist: input.bookingRules.allowWaitlist,
            allowAutoApprove: input.bookingRules.allowAutoApprove
          }
        : undefined,
      status: input.status
    };
    const event = await eventService.updateEvent(eventId, req.auth.id, updateInput);
    sendSuccess(res, { event });
  });

  publish = asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) {
      res.status(401).json({ success: false, error: { code: "unauthorized", message: "Missing authentication." } });
      return;
    }
    const eventId = objectIdSchema.parse(toParam(req.params.eventId));
    const event = await eventService.publishEvent(eventId, req.auth.id);
    sendSuccess(res, { event });
  });

  pause = asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) {
      res.status(401).json({ success: false, error: { code: "unauthorized", message: "Missing authentication." } });
      return;
    }
    const eventId = objectIdSchema.parse(toParam(req.params.eventId));
    const event = await eventService.pauseEvent(eventId, req.auth.id);
    sendSuccess(res, { event });
  });

  cancel = asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) {
      res.status(401).json({ success: false, error: { code: "unauthorized", message: "Missing authentication." } });
      return;
    }
    const eventId = objectIdSchema.parse(toParam(req.params.eventId));
    const event = await eventService.cancelEvent(eventId, req.auth.id);
    sendSuccess(res, { event });
  });
}
