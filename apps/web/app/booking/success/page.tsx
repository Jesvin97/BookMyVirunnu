"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "../../utils/api";
import styles from "../../page.module.css";

interface Booking {
  _id: string;
  partySize: number;
  specialRequests?: string;
  status: string;
  startAt: string;
  eventId: string;
  venue?: {
    name?: string;
    address?: string;
    phone?: string;
  };
}

interface Event {
  _id: string;
  title: string;
}

function BookingSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");

  const [booking, setBooking] = useState<Booking | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!bookingId) {
      router.push("/");
      return;
    }
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ booking: Booking }>(`/bookings/${bookingId}`);
      if (response && response.booking) {
        setBooking(response.booking);
        
        const eventResponse = await api.get<{ event: Event }>(`/events/${response.booking.eventId}`);
        if (eventResponse && eventResponse.event) {
          setEvent(eventResponse.event);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to retrieve booking information.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className={styles.shell} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className={styles.backgroundGlow} />
        <div style={{ color: "#34d399", fontWeight: 600 }}>Loading booking confirmation...</div>
      </main>
    );
  }

  // Determine meal category
  const getMealCategory = (startAtStr: string) => {
    const date = new Date(startAtStr);
    const hour = date.getHours();
    return hour < 16 ? "Lunch (Sadhya) 🍛" : "Dinner (Virunnu) 🍽️";
  };

  return (
    <main className={styles.shell} style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 0" }}>
      <div className={styles.backgroundGlow} aria-hidden="true" />

      {error ? (
        <div className={styles.panel} style={{ padding: "40px", textAlign: "center", maxWidth: "440px" }}>
          <h2 style={{ color: "#f87171", marginBottom: "12px", fontFamily: "var(--bv-font-display)" }}>Error</h2>
          <p style={{ color: "rgba(243, 252, 247, 0.7)", marginBottom: "28px" }}>{error}</p>
          <Link href="/" className={styles.secondaryButton} style={{ textDecoration: "none" }}>Return Home</Link>
        </div>
      ) : (
        <div className={styles.panel} style={{ width: "min(520px, calc(100% - 32px))", padding: "40px", textAlign: "center" }}>
          {/* Celebratory Checkmark Icon */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            background: "rgba(16, 185, 129, 0.12)",
            border: "2px solid rgba(52, 211, 153, 0.35)",
            color: "#34d399",
            fontSize: "2rem",
            marginBottom: "28px",
            boxShadow: "0 0 35px rgba(52, 211, 153, 0.2)"
          }}>
            ✓
          </div>

          <div className={styles.eyebrow} style={{ marginBottom: "16px" }}>Invitation Sent Successfully</div>
          <h2 style={{ fontFamily: "var(--bv-font-display)", fontSize: "2.4rem", margin: "0 0 10px", color: "#fff", lineHeight: 1.1 }}>
            Feast Slot Reserved!
          </h2>
          <p style={{ color: "rgba(243, 252, 247, 0.65)", margin: "0 0 32px" }}>
            You have successfully booked a slot to host the newlyweds. Let's send them a confirmation message!
          </p>

          {/* Booking Summary Card */}
          <div style={{
            textAlign: "left",
            padding: "24px",
            borderRadius: "18px",
            background: "rgba(4, 9, 6, 0.45)",
            border: "1px solid rgba(52, 211, 153, 0.15)",
            marginBottom: "28px",
            display: "grid",
            gap: "16px"
          }}>
            <div>
              <span style={{ fontSize: "0.75rem", color: "rgba(243, 252, 247, 0.5)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "4px" }}>
                Newlywed Couple
              </span>
              <strong style={{ color: "#fff", fontSize: "1.1rem" }}>{event?.title}</strong>
            </div>

            <div>
              <span style={{ fontSize: "0.75rem", color: "rgba(243, 252, 247, 0.5)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "4px" }}>
                Feast Time Slot
              </span>
              <strong style={{ color: "#fff" }}>
                {booking && `${getMealCategory(booking.startAt)} - ${new Date(booking.startAt).toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })} at ${new Date(booking.startAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`}
              </strong>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "16px" }}>
              <div>
                <span style={{ fontSize: "0.75rem", color: "rgba(243, 252, 247, 0.5)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "4px" }}>
                  Invited By
                </span>
                <strong style={{ color: "#fff" }}>{booking?.venue?.name}</strong>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "rgba(243, 252, 247, 0.5)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "4px" }}>
                  Status
                </span>
                <strong style={{ color: "#34d399", textTransform: "capitalize" }}>{booking?.status}</strong>
              </div>
            </div>

            {/* Restricted Address Reveal */}
            <hr style={{ border: "0", borderTop: "1px solid rgba(52, 211, 153, 0.12)", margin: "8px 0" }} />
            <div>
              <span style={{ fontSize: "0.75rem", color: "#34d399", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "4px" }}>
                📍 Feast Venue (Your Home Address)
              </span>
              <strong style={{ color: "#fff", lineHeight: 1.4, display: "block" }}>
                {booking?.venue?.address || "Address details"}
              </strong>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
            {booking && (
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Hi! We have successfully booked a slot to host you for ${getMealCategory(
                    booking.startAt
                  )} on ${new Date(booking.startAt).toLocaleDateString([], {
                    weekday: "long",
                    month: "short",
                    day: "numeric"
                  })} at our home! We can't wait to welcome you!\n\nFeast Address:\n${booking.venue?.address || ""}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.primaryButton}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textDecoration: "none",
                  gap: "8px",
                  background: "#25D366", // WhatsApp Green
                  border: "1px solid #1ebd56",
                  color: "#fff",
                  padding: "14px 20px",
                  fontSize: "1.05rem",
                  fontWeight: 600,
                  borderRadius: "14px",
                  boxShadow: "0 0 25px rgba(37, 211, 102, 0.35)",
                  transition: "all 150ms ease"
                }}
              >
                💬 Send WhatsApp Confirmation
              </a>
            )}

            <Link href="/" className={styles.secondaryButton} style={{ textDecoration: "none", padding: "14px 20px", borderRadius: "14px" }}>
              Go to Home Page
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={
      <main className={styles.shell} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className={styles.backgroundGlow} />
        <div style={{ color: "#34d399", fontWeight: 600 }}>Loading booking confirmation...</div>
      </main>
    }>
      <BookingSuccessContent />
    </Suspense>
  );
}
