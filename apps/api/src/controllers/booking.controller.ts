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
  if (!bookingObj.venue || !bookingObj.venue.address) return bookingObj;

  const start = new Date(bookingObj.startAt);
  const now = new Date();
  const diffMs = start.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  // If requester is the guest owner, do NOT mask
  const isGuest = authUserId && bookingObj.guestUserId?.toString() === authUserId.toString();
  if (isGuest) return bookingObj;

  // Mask address if more than 24 hours in the future
  if (diffHours > 24) {
    bookingObj.venue.address = "Masked (Revealed 24h prior)";
  }
  return bookingObj;
}

export class BookingController {
  create = asyncHandler(async (req: Request, res: Response) => {
    const input = createBookingSchema.parse(req.body);
    let guestUserId: Types.ObjectId;

    if (req.auth) {
      guestUserId = new Types.ObjectId(req.auth.id);
    } else {
      if (!input.guestName || !input.guestEmail || !input.guestPhone || !input.venueAddress) {
        res.status(400).json({
          success: false,
          error: {
            code: "validation_error",
            message: "For One-Click RSVP, you must provide your Name, Email, Phone, and Venue Address."
          }
        });
        return;
      }

      const emailLower = input.guestEmail.toLowerCase().trim();
      let shadowUser = await UserModel.findOne({ email: emailLower });
      if (!shadowUser) {
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
}
