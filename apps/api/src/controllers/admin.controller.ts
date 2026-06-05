import type { Request, Response } from "express";
import { asyncHandler, sendSuccess } from "../utils/http";
import { UserModel } from "../models/User";
import { EventModel } from "../models/Event";
import { BookingModel } from "../models/Booking";
import type { AdminDashboardData, CoupleDashboardSummary, DashboardEvent, DashboardBooking, DomainUser } from "@bookmyvirunnu/shared";

export class AdminController {
  static getAdminDashboard = asyncHandler(async (req: Request, res: Response) => {
    // 1. Fetch all couples
    const couples = await UserModel.find({ role: "couple" }).lean().exec() as unknown as DomainUser[];

    // 2. Fetch all events for these couples
    const coupleIds = couples.map(c => c._id.toString());
    const events = await EventModel.find({ hostUserId: { $in: coupleIds } }).lean().exec();

    // 3. Fetch all bookings for these events
    const eventIds = events.map(e => e._id.toString());
    const bookings = await BookingModel.find({ eventId: { $in: eventIds } }).lean().exec();

    // 4. Fetch all guests who made these bookings
    const guestUserIds = [...new Set(bookings.map(b => b.guestUserId.toString()))];
    const guests = await UserModel.find({ _id: { $in: guestUserIds } }).lean().exec();
    const guestMap = new Map(guests.map(g => [g._id.toString(), g]));

    // 5. Aggregate data
    const couplesSummary: CoupleDashboardSummary[] = couples.map(couple => {
      const coupleEvents = events.filter(e => e.hostUserId.toString() === couple._id.toString());

      const dashboardEvents: DashboardEvent[] = coupleEvents.map(event => {
        const eventBookings = bookings.filter(b => b.eventId.toString() === event._id.toString());
        
        const dashboardBookings: DashboardBooking[] = eventBookings.map(booking => {
          const guest = guestMap.get(booking.guestUserId.toString());
          // Convert booking document to match DashboardBooking structure by removing guestUserId
          const { guestUserId, ...bookingRest } = booking as any;
          return {
            ...bookingRest,
            guest: guest ? {
              _id: guest._id.toString(),
              name: guest.name,
              email: guest.email,
              phone: guest.phone
            } : {
              _id: booking.guestUserId.toString(),
              name: "Unknown Guest",
              email: "unknown@example.com"
            }
          };
        });

        return {
          ...event,
          _id: event._id.toString(),
          bookings: dashboardBookings
        } as unknown as DashboardEvent;
      });

      return {
        couple,
        events: dashboardEvents
      };
    });

    const responseData: AdminDashboardData = {
      couples: couplesSummary
    };

    sendSuccess(res, responseData);
  });
}
