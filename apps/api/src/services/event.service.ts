import { Types } from "mongoose";
import { BookingConflictError, NotFoundError } from "../errors";
import { EventModel, type EventDocument } from "../models/Event";
import { AvailabilityEngine } from "./availability-engine";
import type { BookingRules } from "@bookmyvirunnu/shared";

export interface CreateEventInput {
  hostUserId: string;
  title: string;
  description?: string;
  eventType: string;
  timezone: string;
  visibility: "private" | "unlisted" | "public";
  startDate: Date;
  endDate: Date;
  venue?: EventDocument["venue"];
  coverImageUrl?: string;
  maxGuestsTotal: number;
  bookingMode: "request" | "instant";
  bookingRules: BookingRules;
  status?: EventDocument["status"];
  dietaryRestrictions?: string[];
}

export type UpdateEventInput = Partial<Omit<CreateEventInput, "hostUserId">> & {
  status?: EventDocument["status"];
};

export class EventService {
  constructor(private readonly availabilityEngine = new AvailabilityEngine()) {}

  async createEvent(input: CreateEventInput): Promise<EventDocument> {
    if (input.endDate <= input.startDate) {
      throw new BookingConflictError("outside_event_window", "Event end date must be after the start date.");
    }

    const [event] = await EventModel.create([
      {
        hostUserId: new Types.ObjectId(input.hostUserId),
        title: input.title,
        description: input.description,
        eventType: input.eventType,
        timezone: input.timezone,
        visibility: input.visibility,
        startDate: input.startDate,
        endDate: input.endDate,
        venue: input.venue,
        coverImageUrl: input.coverImageUrl,
        maxGuestsTotal: input.maxGuestsTotal,
        bookingMode: input.bookingMode,
        bookingRules: input.bookingRules,
        status: input.status ?? "draft",
        dietaryRestrictions: input.dietaryRestrictions ?? []
      }
    ]);

    if (event.status === "published") {
      await this.syncEventSlots(event);
    }

    return event;
  }

  async listMyEvents(hostUserId: string): Promise<EventDocument[]> {
    return EventModel.find({ hostUserId: new Types.ObjectId(hostUserId) }).sort({ createdAt: -1 }).exec();
  }

  async listPublicEvents(): Promise<EventDocument[]> {
    return EventModel.find({ status: "published", visibility: { $in: ["unlisted", "public"] } })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getById(eventId: string): Promise<EventDocument> {
    const event = await EventModel.findById(new Types.ObjectId(eventId)).exec();
    if (!event) throw new NotFoundError("Event not found.");
    return event;
  }

  async getVisibleById(eventId: string, viewerUserId?: string): Promise<EventDocument> {
    const event = await this.getById(eventId);
    const isHost = event.hostUserId.toString() === viewerUserId;
    if (!isHost && (event.status !== "published" || event.visibility === "private")) {
      throw new NotFoundError("Event not found.");
    }
    return event;
  }

  async getOwnedEvent(eventId: string, hostUserId: string): Promise<EventDocument> {
    const event = await EventModel.findOne({
      _id: new Types.ObjectId(eventId),
      hostUserId: new Types.ObjectId(hostUserId)
    }).exec();
    if (!event) throw new NotFoundError("Event not found.");
    return event;
  }

  async updateEvent(eventId: string, hostUserId: string, input: UpdateEventInput): Promise<EventDocument> {
    const event = await this.getOwnedEvent(eventId, hostUserId);
    if (input.startDate && input.endDate && input.endDate <= input.startDate) {
      throw new BookingConflictError("outside_event_window", "Event end date must be after the start date.");
    }

    // Clean undefined fields to avoid overwriting existing properties
    const cleanInput = Object.fromEntries(
      Object.entries(input).filter(([_, v]) => v !== undefined)
    );

    Object.assign(event, {
      ...cleanInput,
      startDate: cleanInput.startDate ?? event.startDate,
      endDate: cleanInput.endDate ?? event.endDate
    });

    await event.save();
    if (event.status === "published") {
      await this.syncEventSlots(event);
    }
    return event;
  }

  async publishEvent(eventId: string, hostUserId: string): Promise<EventDocument> {
    const event = await this.getOwnedEvent(eventId, hostUserId);
    if (event.status === "cancelled") {
      throw new BookingConflictError("event_not_bookable", "Cancelled events cannot be published.");
    }
    event.status = "published";
    await event.save();
    await this.syncEventSlots(event);
    return event;
  }

  async pauseEvent(eventId: string, hostUserId: string): Promise<EventDocument> {
    const event = await this.getOwnedEvent(eventId, hostUserId);
    event.status = "paused";
    await event.save();
    return event;
  }

  async cancelEvent(eventId: string, hostUserId: string): Promise<EventDocument> {
    const event = await this.getOwnedEvent(eventId, hostUserId);
    event.status = "cancelled";
    await event.save();
    return event;
  }

  private async syncEventSlots(event: EventDocument): Promise<void> {
    const rules = await this.availabilityEngine.listRules(event._id);
    await this.availabilityEngine.syncSlotsForRange({
      event,
      rangeStart: event.startDate,
      rangeEnd: event.endDate,
      rules
    });
  }
}
