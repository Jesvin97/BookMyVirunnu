import type { Request, Response } from "express";
import { Types } from "mongoose";
import { EventService } from "../services/event.service";
import { BookingService } from "../services/booking-service";
import { asyncHandler, sendSuccess } from "../utils/http";
import { bookingActionSchema, createBookingSchema, availabilityPreviewSchema } from "../validators/booking";
import { objectIdSchema } from "../validators/common";

const bookingService = new BookingService();
const eventService = new EventService();

export class BookingController {
  create = asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) {
      res.status(401).json({
        success: false,
        error: { code: "unauthorized", message: "Missing authentication." }
      });
      return;
    }
    const input = createBookingSchema.parse(req.body);
    const booking = await bookingService.createBooking({
      eventId: new Types.ObjectId(input.eventId),
      guestUserId: new Types.ObjectId(req.auth.id),
      startAt: new Date(input.startAt),
      endAt: new Date(input.endAt),
      partySize: input.partySize,
      specialRequests: input.specialRequests,
      idempotencyKey: input.idempotencyKey
    });
    sendSuccess(res, { booking }, 201);
  });

  listMine = asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) {
      res.status(401).json({
        success: false,
        error: { code: "unauthorized", message: "Missing authentication." }
      });
      return;
    }
    const bookings = await bookingService.listMyBookings(req.auth.id);
    sendSuccess(res, { bookings });
  });

  getOne = asyncHandler(async (req: Request, res: Response) => {
    objectIdSchema.parse(req.params.bookingId);
    const booking = await bookingService.getBookingById(req.params.bookingId, req.auth?.id);
    sendSuccess(res, { booking });
  });

  listEventBookings = asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) {
      res.status(401).json({
        success: false,
        error: { code: "unauthorized", message: "Missing authentication." }
      });
      return;
    }
    objectIdSchema.parse(req.params.eventId);
    const bookings = await bookingService.listBookingsForEvent(req.params.eventId, req.auth.id);
    sendSuccess(res, { bookings });
  });

  previewAvailability = asyncHandler(async (req: Request, res: Response) => {
    const query = availabilityPreviewSchema.parse({ ...req.query, eventId: req.params.eventId ?? req.query.eventId });
    const slots = await bookingService.previewAvailability(
      new Types.ObjectId(query.eventId),
      new Date(query.rangeStart),
      new Date(query.rangeEnd)
    );
    sendSuccess(res, { slots });
  });

  previewForEvent = asyncHandler(async (req: Request, res: Response) => {
    const query = availabilityPreviewSchema.pick({ rangeStart: true, rangeEnd: true }).parse(req.query);
    const eventId = objectIdSchema.parse(req.params.eventId);
    await eventService.getVisibleById(eventId, req.auth?.id);
    const slots = await bookingService.previewAvailability(
      new Types.ObjectId(eventId),
      new Date(query.rangeStart),
      new Date(query.rangeEnd)
    );
    sendSuccess(res, { slots });
  });

  confirm = asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) {
      res.status(401).json({
        success: false,
        error: { code: "unauthorized", message: "Missing authentication." }
      });
      return;
    }
    objectIdSchema.parse(req.params.bookingId);
    const booking = await bookingService.confirmBooking(new Types.ObjectId(req.params.bookingId), new Types.ObjectId(req.auth.id));
    sendSuccess(res, { booking });
  });

  reject = asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) {
      res.status(401).json({
        success: false,
        error: { code: "unauthorized", message: "Missing authentication." }
      });
      return;
    }
    objectIdSchema.parse(req.params.bookingId);
    const { reason } = bookingActionSchema.parse(req.body);
    const booking = await bookingService.rejectBooking(
      new Types.ObjectId(req.params.bookingId),
      reason,
      new Types.ObjectId(req.auth.id)
    );
    sendSuccess(res, { booking });
  });

  cancel = asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) {
      res.status(401).json({
        success: false,
        error: { code: "unauthorized", message: "Missing authentication." }
      });
      return;
    }
    objectIdSchema.parse(req.params.bookingId);
    const booking = await bookingService.cancelBooking(
      new Types.ObjectId(req.params.bookingId),
      new Types.ObjectId(req.auth.id)
    );
    sendSuccess(res, { booking });
  });
}
