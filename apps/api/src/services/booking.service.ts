import mongoose, { Types, type ClientSession } from "mongoose";
import { BookingModel, type BookingDocument } from "../models/Booking";
import { BookingSlotModel, type BookingSlotDocument } from "../models/BookingSlot";
import { EventModel, type EventDocument } from "../models/Event";
import { AvailabilityEngine } from "./availability-engine";
import { BookingConflictError, NotFoundError } from "../errors";
import { differenceInMinutes } from "../utils/timezone";

export interface CreateBookingInput {
  eventId: Types.ObjectId;
  guestUserId: Types.ObjectId;
  startAt: Date;
  endAt: Date;
  partySize: number;
  specialRequests?: string;
  idempotencyKey?: string;
  venue?: {
    name?: string;
    address?: string;
    phone?: string;
  };
}

export interface BookingServiceOptions {
  availabilityEngine?: AvailabilityEngine;
}

export class BookingService {
  private readonly availabilityEngine: AvailabilityEngine;

  constructor(options: BookingServiceOptions = {}) {
    this.availabilityEngine = options.availabilityEngine ?? new AvailabilityEngine();
  }

  async previewAvailability(eventId: Types.ObjectId, rangeStart: Date, rangeEnd: Date): Promise<BookingSlotDocument[]> {
    const event = await EventModel.findById(eventId);
    if (!event) throw new NotFoundError("Event not found.");

    const rules = await this.availabilityEngine.listRules(event._id);
    await this.availabilityEngine.syncSlotsForRange({
      event,
      rangeStart,
      rangeEnd,
      rules
    });

    return BookingSlotModel.find({
      eventId: event._id,
      startAt: { $gte: rangeStart, $lte: rangeEnd },
      status: { $in: ["open", "locked"] }
    })
      .sort({ startAt: 1 })
      .exec();
  }

  async createBooking(input: CreateBookingInput): Promise<BookingDocument> {
    const session = await mongoose.startSession();
    try {
      let createdBooking: BookingDocument | null = null;

      await session.withTransaction(async () => {
        if (input.idempotencyKey) {
          const existing = await BookingModel.findOne({ idempotencyKey: input.idempotencyKey }).session(session);
          if (existing) {
            createdBooking = existing;
            return;
          }
        }

        const event = await EventModel.findById(input.eventId).session(session);
        if (!event) throw new NotFoundError("Event not found.");
        if (event.hostUserId.toString() === input.guestUserId.toString()) {
          throw new BookingConflictError("event_not_bookable", "The host cannot book their own event.");
        }

        const rules = await this.availabilityEngine.listRules(event._id, session);
        this.assertBookingShape(event, input.startAt, input.endAt, input.partySize);

        const slot = await this.resolveSlot(event, input.startAt, input.endAt, session);
        const conflict = this.availabilityEngine.validateRequestedSlot({
          event,
          rules,
          slot,
          partySize: input.partySize,
          requestedStartAt: input.startAt,
          requestedEndAt: input.endAt
        });

        if (conflict) throw new BookingConflictError(conflict.code, conflict.message, conflict.details);

        const existingActive = await BookingModel.findOne({
          eventId: event._id,
          guestUserId: input.guestUserId,
          isActive: true
        }).session(session);

        if (existingActive) {
          throw new BookingConflictError("duplicate_booking", "This guest already has an active booking for the event.", {
            bookingId: existingActive._id.toString()
          });
        }

        const confirmed = event.bookingMode === "instant" || event.bookingRules.allowAutoApprove;
        const [booking] = await BookingModel.create(
          [
            {
              eventId: event._id,
              guestUserId: input.guestUserId,
              slotId: slot._id,
              startAt: input.startAt,
              endAt: input.endAt,
              partySize: input.partySize,
              specialRequests: input.specialRequests,
              idempotencyKey: input.idempotencyKey,
              status: confirmed ? "confirmed" : "pending",
              isActive: true,
              confirmedAt: confirmed ? new Date() : undefined,
              venue: input.venue
            }
          ],
          { session }
        );

        const nextReserved = slot.reservedCount + input.partySize;
        const updatedSlot = await BookingSlotModel.findOneAndUpdate(
          { _id: slot._id, eventId: event._id },
          {
            $inc: {
              reservedCount: input.partySize,
              confirmedCount: confirmed ? input.partySize : 0
            },
            $set: {
              status: nextReserved >= slot.capacity ? "locked" : "open"
            }
          },
          { new: true, session }
        );

        if (!updatedSlot) {
          throw new BookingConflictError("race_condition", "The slot changed while booking was in progress.");
        }

        createdBooking = booking;
      });

      if (!createdBooking) throw new Error("Booking transaction completed without creating a booking.");
      return createdBooking;
    } catch (error) {
      if (error instanceof BookingConflictError || error instanceof NotFoundError) throw error;

      const mongoError = error as { code?: number };
      if (mongoError?.code === 11000) {
        if (input.idempotencyKey) {
          const existing = await BookingModel.findOne({ idempotencyKey: input.idempotencyKey });
          if (existing) return existing;
        }
        throw new BookingConflictError("duplicate_booking", "A conflicting booking already exists for this guest and event.");
      }

      throw error;
    } finally {
      session.endSession();
    }
  }

  async listMyBookings(guestUserId: string): Promise<BookingDocument[]> {
    return BookingModel.find({ guestUserId: new Types.ObjectId(guestUserId) }).sort({ createdAt: -1 }).exec();
  }

  async listBookingsForEvent(eventId: string, hostUserId: string): Promise<BookingDocument[]> {
    const event = await EventModel.findOne({
      _id: new Types.ObjectId(eventId),
      hostUserId: new Types.ObjectId(hostUserId)
    }).exec();
    if (!event) throw new NotFoundError("Event not found.");
    return BookingModel.find({ eventId: event._id }).sort({ createdAt: -1 }).exec();
  }

  async getBookingById(bookingId: string, actorUserId?: string): Promise<BookingDocument> {
    const booking = await BookingModel.findById(new Types.ObjectId(bookingId)).exec();
    if (!booking) throw new NotFoundError("Booking not found.");

    if (actorUserId) {
      const event = await EventModel.findById(booking.eventId).exec();
      if (!event) throw new NotFoundError("Event not found.");

      const actor = actorUserId.toString();
      const isGuest = booking.guestUserId.toString() === actor;
      const isHost = event.hostUserId.toString() === actor;
      if (!isGuest && !isHost) {
        throw new BookingConflictError("event_not_bookable", "You are not allowed to access this booking.");
      }
    }

    return booking;
  }

  async confirmBooking(bookingId: Types.ObjectId, actorUserId?: Types.ObjectId): Promise<BookingDocument> {
    return this.withBookingTransaction(bookingId, actorUserId, async ({ booking, slot, event, session }) => {
      if (!actorUserId || event.hostUserId.toString() !== actorUserId.toString()) {
        throw new BookingConflictError("event_not_bookable", "Only the event host can confirm bookings.");
      }
      if (booking.status !== "pending") {
        throw new BookingConflictError("event_not_bookable", "Only pending bookings can be confirmed.");
      }

      booking.status = "confirmed";
      booking.confirmedAt = new Date();
      booking.isActive = true;
      await booking.save({ session });

      slot.confirmedCount += booking.partySize;
      slot.status = slot.reservedCount >= slot.capacity ? "locked" : "open";
      await slot.save({ session });

      return booking;
    });
  }

  async rejectBooking(
    bookingId: Types.ObjectId,
    reason = "Rejected by host.",
    actorUserId?: Types.ObjectId
  ): Promise<BookingDocument> {
    return this.withBookingTransaction(bookingId, actorUserId, async ({ booking, slot, event, session }) => {
      if (!actorUserId || event.hostUserId.toString() !== actorUserId.toString()) {
        throw new BookingConflictError("event_not_bookable", "Only the event host can reject bookings.");
      }
      if (booking.status !== "pending") {
        throw new BookingConflictError("event_not_bookable", "Only pending bookings can be rejected.");
      }

      booking.status = "rejected";
      booking.rejectionReason = reason;
      booking.isActive = false;
      await booking.save({ session });

      slot.reservedCount = Math.max(slot.reservedCount - booking.partySize, 0);
      slot.status = slot.reservedCount >= slot.capacity ? "locked" : "open";
      await slot.save({ session });

      return booking;
    });
  }

  async cancelBooking(bookingId: Types.ObjectId, actorUserId?: Types.ObjectId): Promise<BookingDocument> {
    return this.withBookingTransaction(bookingId, actorUserId, async ({ booking, slot, event, session }) => {
      const isGuestOwner = !!actorUserId && booking.guestUserId.toString() === actorUserId.toString();
      const isHostOwner = !!actorUserId && event.hostUserId.toString() === actorUserId.toString();
      if (!isGuestOwner && !isHostOwner) {
        throw new BookingConflictError("event_not_bookable", "You are not allowed to cancel this booking.");
      }
      if (booking.status === "cancelled" || booking.status === "rejected") {
        throw new BookingConflictError("event_not_bookable", "This booking is no longer active.");
      }

      const wasConfirmed = booking.status === "confirmed";
      booking.status = "cancelled";
      booking.isActive = false;
      booking.cancelledAt = new Date();
      await booking.save({ session });

      slot.reservedCount = Math.max(slot.reservedCount - booking.partySize, 0);
      if (wasConfirmed) {
        slot.confirmedCount = Math.max(slot.confirmedCount - booking.partySize, 0);
      }
      slot.status = slot.reservedCount >= slot.capacity ? "locked" : "open";
      await slot.save({ session });

      return booking;
    });
  }

  private async withBookingTransaction<T>(
    bookingId: Types.ObjectId,
    actorUserId: Types.ObjectId | undefined,
    operation: (context: {
      booking: BookingDocument;
      slot: BookingSlotDocument;
      event: EventDocument;
      session: ClientSession;
    }) => Promise<T>
  ): Promise<T> {
    const session = await mongoose.startSession();
    try {
      let result!: T;
      await session.withTransaction(async () => {
        const booking = await BookingModel.findById(bookingId).session(session);
        if (!booking) throw new NotFoundError("Booking not found.");

        const slot = await BookingSlotModel.findById(booking.slotId).session(session);
        if (!slot) throw new NotFoundError("Slot not found.");

        const event = await EventModel.findById(booking.eventId).session(session);
        if (!event) throw new NotFoundError("Event not found.");

        result = await operation({ booking, slot, event, session });
      });
      return result;
    } finally {
      session.endSession();
    }
  }

  private async resolveSlot(
    event: EventDocument,
    startAt: Date,
    endAt: Date,
    session: ClientSession
  ): Promise<BookingSlotDocument> {
    let slot = await BookingSlotModel.findOne({
      eventId: event._id,
      startAt,
      endAt
    }).session(session);

    if (slot) return slot;

    const windowStart = new Date(startAt);
    windowStart.setUTCDate(windowStart.getUTCDate() - 1);
    const windowEnd = new Date(endAt);
    windowEnd.setUTCDate(windowEnd.getUTCDate() + 1);

    await this.availabilityEngine.syncSlotsForRange({
      event,
      rangeStart: windowStart,
      rangeEnd: windowEnd,
      rules: await this.availabilityEngine.listRules(event._id, session),
      session
    });

    slot = await BookingSlotModel.findOne({
      eventId: event._id,
      startAt,
      endAt
    }).session(session);

    if (!slot) {
      throw new BookingConflictError("slot_missing", "No generated slot exists for the requested time.");
    }

    return slot;
  }

  private assertBookingShape(event: EventDocument, startAt: Date, endAt: Date, partySize: number): void {
    if (partySize < 1) {
      throw new BookingConflictError("capacity_limit", "Party size must be at least 1.");
    }

    if (endAt.getTime() <= startAt.getTime()) {
      throw new BookingConflictError("outside_event_window", "The booking end time must be after the start time.");
    }

    const duration = differenceInMinutes(endAt, startAt);
    if (duration !== event.bookingRules.slotDurationMinutes) {
      throw new BookingConflictError("outside_event_window", "Bookings must match the configured slot duration exactly.", {
        expectedMinutes: event.bookingRules.slotDurationMinutes,
        actualMinutes: duration
      });
    }

    if (partySize > event.bookingRules.maxGuestsPerSlot) {
      throw new BookingConflictError("capacity_limit", "The requested party size exceeds the maximum guest capacity for a slot.", {
        maxGuestsPerSlot: event.bookingRules.maxGuestsPerSlot
      });
    }

    if (event.status !== "published") {
      throw new BookingConflictError("event_not_published", "This event is not accepting bookings.");
    }
  }
}
