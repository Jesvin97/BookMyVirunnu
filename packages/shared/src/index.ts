export type BookingStatus = "pending" | "confirmed" | "rejected" | "cancelled" | "waitlisted";
export type EventStatus = "draft" | "published" | "paused" | "ended" | "cancelled";
export type Visibility = "private" | "unlisted" | "public";
export type BookingMode = "request" | "instant";
export type SlotStatus = "open" | "blocked" | "locked";
export type RuleType = "weekly" | "date_range" | "specific_date" | "blackout" | "manual_hold";
export type UserRole = "couple" | "guest" | "admin";

export interface BookingRules {
  slotDurationMinutes: number;
  minLeadMinutes: number;
  maxGuestsPerSlot: number;
  bufferMinutesBefore: number;
  bufferMinutesAfter: number;
  allowWaitlist: boolean;
  allowAutoApprove: boolean;
}

export interface AvailabilityRuleInput {
  eventId: string;
  ruleType: RuleType;
  daysOfWeek?: number[];
  date?: string;
  rangeStart?: Date;
  rangeEnd?: Date;
  startTime: string;
  endTime: string;
  isBlocked: boolean;
  maxGuests?: number;
  priority: number;
  reason?: string;
}

export interface BookingCreationInput {
  eventId: string;
  guestUserId: string;
  startAt: Date;
  endAt: Date;
  partySize: number;
  specialRequests?: string;
  idempotencyKey?: string;
}

export interface SlotConflict {
  code:
    | "event_not_published"
    | "event_not_bookable"
    | "outside_event_window"
    | "lead_time_violation"
    | "blackout_rule"
    | "manual_hold"
    | "time_overlap"
    | "duplicate_booking"
    | "capacity_limit"
    | "slot_missing"
    | "slot_locked"
    | "race_condition";
  message: string;
  details?: Record<string, unknown>;
}

export interface AvailabilitySlot {
  startAt: Date;
  endAt: Date;
  occupiedStartAt: Date;
  occupiedEndAt: Date;
  dateKey: string;
  capacity: number;
  sourceRuleIds: string[];
}

export interface TimeWindow {
  startTime: string;
  endTime: string;
}

export interface DomainEvent {
  _id: string;
  hostUserId: string;
  title: string;
  description?: string;
  eventType: string;
  status: EventStatus;
  timezone: string;
  visibility: Visibility;
  startDate: Date;
  endDate: Date;
  venue?: {
    name?: string;
    address?: string;
    geo?: {
      lat?: number;
      lng?: number;
    };
  };
  coverImageUrl?: string;
  maxGuestsTotal: number;
  bookingMode: BookingMode;
  bookingRules: BookingRules;
  dietaryRestrictions?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DomainAvailabilityRule extends AvailabilityRuleInput {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DomainBooking {
  _id: string;
  eventId: string;
  guestUserId: string;
  slotId: string;
  startAt: Date;
  endAt: Date;
  partySize: number;
  specialRequests?: string;
  status: BookingStatus;
  isActive: boolean;
  idempotencyKey?: string;
  holdExpiresAt?: Date;
  rejectionReason?: string;
  venue?: {
    name?: string;
    address?: string;
    phone?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
  cancelledAt?: Date;
}

export interface DomainBookingSlot {
  _id: string;
  eventId: string;
  dateKey: string;
  startAt: Date;
  endAt: Date;
  occupiedStartAt: Date;
  occupiedEndAt: Date;
  capacity: number;
  reservedCount: number;
  confirmedCount: number;
  status: SlotStatus;
  sourceRuleIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DomainUser {
  _id: string;
  role: UserRole;
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  status: "active" | "blocked" | "pending_verification";
  locale: string;
  timezone: string;
  avatarUrl?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingGuestDetails {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface DashboardBooking extends Omit<DomainBooking, "guestUserId"> {
  guest: BookingGuestDetails;
}

export interface DashboardEvent extends DomainEvent {
  bookings: DashboardBooking[];
}

export interface CoupleDashboardSummary {
  couple: DomainUser;
  events: DashboardEvent[];
}

export interface AdminDashboardData {
  couples: CoupleDashboardSummary[];
}
