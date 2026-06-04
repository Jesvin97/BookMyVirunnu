import type { Request, Response } from "express";
import { Types } from "mongoose";
import { BookingService } from "../services/booking.service";
import { EventService } from "../services/event.service";
import { UserModel } from "../models/User";
import { asyncHandler, sendSuccess } from "../utils/http";
import { toParam } from "../utils/params";
import { bookingActionSchema, createBookingSchema, availabilityPreviewSchema } from "../validators/booking";
import { objectIdSchema } from "../validators/common";

const bookingService = new BookingService();
const eventService = new EventService();

function maskBookingAddress(booking: any, authUserId?: string): any {
  if (!booking) return booking;
  const bookingObj = booking.toObject ? booking.toObject() : { ...booking };
  return bookingObj;
}

export class BookingController {
  create = asyncHandler(async (req: Request, res: Response) => {
    const input = createBookingSchema.parse(req.body);
    let guestUserId: Types.ObjectId;

    if (req.auth) {
      guestUserId = new Types.ObjectId(req.auth.id);
    } else {
      if (!input.guestName || !input.guestPhone || !input.venueAddress) {
        res.status(400).json({
          success: false,
          error: {
            code: "validation_error",
            message: "For One-Click RSVP, you must provide your Name, Phone, and Venue Address."
          }
        });
        return;
      }

      let shadowUser = await UserModel.findOne({ phone: input.guestPhone.trim() });
      if (!shadowUser) {
        const cleanPhone = input.guestPhone.replace(/\D/g, "");
        const emailLower = input.guestEmail
          ? input.guestEmail.toLowerCase().trim()
          : `${cleanPhone || Math.random().toString(36).substring(2, 10)}@bookmyvirunnu-shadow.com`;

        shadowUser = await UserModel.create({
          role: "guest",
          name: input.guestName.trim(),
          email: emailLower,
          phone: input.guestPhone.trim(),
          passwordHash: "shadow-guest-passwordless-" + Math.random().toString(),
          status: "active",
          locale: "en",
          timezone: "Asia/Kolkata"
        });
      }
      guestUserId = shadowUser._id;
    }

    const booking = await bookingService.createBooking({
      eventId: new Types.ObjectId(input.eventId),
      guestUserId,
      startAt: new Date(input.startAt),
      endAt: new Date(input.endAt),
      partySize: input.partySize ?? 1,
      specialRequests: input.specialRequests,
      idempotencyKey: input.idempotencyKey,
      venue: {
        name: input.guestName ?? "Host Family",
        address: input.venueAddress,
        phone: input.guestPhone
      }
    });

    sendSuccess(res, { booking: maskBookingAddress(booking, req.auth?.id) }, 201);
  });

  listMine = asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) {
      res.status(401).json({ success: false, error: { code: "unauthorized", message: "Missing authentication." } });
      return;
    }
    const bookings = await bookingService.listMyBookings(req.auth.id);
    sendSuccess(res, { bookings: bookings.map((b) => maskBookingAddress(b, req.auth?.id)) });
  });

  getOne = asyncHandler(async (req: Request, res: Response) => {
    const bookingId = objectIdSchema.parse(toParam(req.params.bookingId));
    const booking = await bookingService.getBookingById(bookingId, req.auth?.id);
    sendSuccess(res, { booking: maskBookingAddress(booking, req.auth?.id) });
  });

  listEventBookings = asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) {
      res.status(401).json({ success: false, error: { code: "unauthorized", message: "Missing authentication." } });
      return;
    }
    const eventId = objectIdSchema.parse(toParam(req.params.eventId));
    const bookings = await bookingService.listBookingsForEvent(eventId, req.auth.id);
    sendSuccess(res, { bookings: bookings.map((b) => maskBookingAddress(b, req.auth?.id)) });
  });

  previewForEvent = asyncHandler(async (req: Request, res: Response) => {
    const query = availabilityPreviewSchema.pick({ rangeStart: true, rangeEnd: true }).parse(req.query);
    const eventId = objectIdSchema.parse(toParam(req.params.eventId));
    await eventService.getVisibleById(eventId, req.auth?.id);
    const slots = await bookingService.previewAvailability(new Types.ObjectId(eventId), new Date(query.rangeStart), new Date(query.rangeEnd));
    sendSuccess(res, { slots });
  });

  confirm = asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) {
      res.status(401).json({ success: false, error: { code: "unauthorized", message: "Missing authentication." } });
      return;
    }
    const bookingId = objectIdSchema.parse(toParam(req.params.bookingId));
    const booking = await bookingService.confirmBooking(new Types.ObjectId(bookingId), new Types.ObjectId(req.auth.id));
    sendSuccess(res, { booking });
  });

  reject = asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) {
      res.status(401).json({ success: false, error: { code: "unauthorized", message: "Missing authentication." } });
      return;
    }
    const bookingId = objectIdSchema.parse(toParam(req.params.bookingId));
    const { reason } = bookingActionSchema.parse(req.body);
    const booking = await bookingService.rejectBooking(
      new Types.ObjectId(bookingId),
      reason,
      new Types.ObjectId(req.auth.id)
    );
    sendSuccess(res, { booking });
  });

  cancel = asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) {
      res.status(401).json({ success: false, error: { code: "unauthorized", message: "Missing authentication." } });
      return;
    }
    const bookingId = objectIdSchema.parse(toParam(req.params.bookingId));
    const booking = await bookingService.cancelBooking(new Types.ObjectId(bookingId), new Types.ObjectId(req.auth.id));
    sendSuccess(res, { booking });
  });

  publicCancel = asyncHandler(async (req: Request, res: Response) => {
    const bookingId = objectIdSchema.parse(toParam(req.params.bookingId));
    const booking = await bookingService.publicCancelBooking(new Types.ObjectId(bookingId));
    sendSuccess(res, { booking });
  });
}
