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
  const [cancelled, setCancelled] = useState(false);
  const [cancelling, setCancelling] = useState(false);

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

  const handlePublicCancel = async () => {
    if (!bookingId) return;
    if (!window.confirm("Are you sure you want to cancel this feast slot reservation?")) return;

    try {
      setCancelling(true);
      await api.post(`/bookings/${bookingId}/public-cancel`);
      setCancelled(true);
    } catch (err: any) {
      alert(err.message || "Failed to cancel reservation.");
    } finally {
      setCancelling(false);
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
    <main className={styles.shell} style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 0" }}>
      <div className={styles.backgroundGlow} aria-hidden="true" />

      {error ? (
        <div className={styles.panel} style={{ padding: "40px", textAlign: "center", maxWidth: "440px" }}>
          <h2 style={{ color: "#f87171", marginBottom: "12px", fontFamily: "var(--bv-font-display)" }}>Error</h2>
          <p style={{ color: "rgba(243, 252, 247, 0.7)", marginBottom: "28px" }}>{error}</p>
          <Link href="/" className={styles.secondaryButton} style={{ textDecoration: "none" }}>Return Home</Link>
        </div>
      ) : cancelled ? (
        <div className={styles.panel} style={{ width: "min(520px, calc(100% - 32px))", padding: "clamp(20px, 6vw, 40px)", textAlign: "center" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            background: "rgba(239, 68, 68, 0.1)",
            border: "2px solid rgba(239, 68, 68, 0.3)",
            color: "#f87171",
            fontSize: "2rem",
            marginBottom: "28px",
            boxShadow: "0 0 35px rgba(239, 68, 68, 0.15)"
          }}>
            🔓
          </div>
          <h2 style={{ fontFamily: "var(--bv-font-display)", fontSize: "clamp(1.8rem, 6vw, 2.4rem)", margin: "0 0 12px", color: "#fff", lineHeight: 1.1 }}>
            Reservation Cancelled
          </h2>
          <p style={{ color: "rgba(243, 252, 247, 0.7)", marginBottom: "28px", lineHeight: 1.5 }}>
            Your slot reservation has been cancelled successfully. The slot is now open and available for other relatives to book.
          </p>
          <Link
            href={`/book/${booking?.eventId}`}
            className={styles.primaryButton}
            style={{ textDecoration: "none", width: "100%", textAlign: "center", display: "block", marginBottom: "12px", padding: "14px", borderRadius: "14px" }}
          >
            Choose a Different Slot
          </Link>
          <Link
            href="/"
            className={styles.secondaryButton}
            style={{ textDecoration: "none", width: "100%", textAlign: "center", display: "block", padding: "14px", borderRadius: "14px" }}
          >
            Go to Home Page
          </Link>
        </div>
      ) : (
        <div className={styles.panel} style={{ width: "min(520px, calc(100% - 24px))", padding: "24px", textAlign: "center" }}>
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
          <h2 style={{ fontFamily: "var(--bv-font-display)", fontSize: "clamp(1.8rem, 6vw, 2.4rem)", margin: "0 0 10px", color: "#8b9e6c", lineHeight: 1.1 }}>
            Feast Slot Reserved!
          </h2>
          <p style={{ color: "#8b9e6c", margin: "0 0 32px" }}>
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

            <div className={styles.formTwoCol}>
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
                <strong style={{ color: "white", background: "rgb(37, 211, 102)", padding: "2px 8px", borderRadius: "4px", textTransform: "capitalize", display: "inline-block" }}>{booking?.status}</strong>
              </div>
            </div>

            {/* Restricted Address Reveal */}
            <hr style={{ border: "0", borderTop: "1px solid rgba(52, 211, 153, 0.12)", margin: "8px 0" }} />
            <div>
              <span style={{ fontSize: "0.75rem", color: "white", background: "rgb(37, 211, 102)", padding: "4px 8px", borderRadius: "6px", textTransform: "uppercase", letterSpacing: "0.08em", display: "inline-block", marginBottom: "8px" }}>
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
                Send WhatsApp Confirmation
              </a>
            )}

            <Link href="/" className={styles.secondaryButton} style={{ textDecoration: "none", padding: "14px 20px", borderRadius: "14px" }}>
              Go to Home Page
            </Link>
          </div>

          {/* Need to Reschedule / Cancel helper card */}
          <div style={{
            marginTop: "28px",
            padding: "20px",
            background: "rgba(239, 68, 68, 0.02)",
            border: "1px solid rgba(239, 68, 68, 0.15)",
            borderRadius: "18px",
            textAlign: "left"
          }}>
            <strong style={{ display: "block", color: "rgb(248, 113, 113)", fontSize: "0.95rem", marginBottom: "4px" }}>
              📅 Need to Reschedule or Cancel?
            </strong>
            <p style={{ fontSize: "0.8rem", color: "rgb(248, 113, 113)", margin: "0 0 16px", lineHeight: 1.4 }}>
              If you have scheduling conflicts or made an error, you can cancel this slot instantly to free it up, then reserve a new date/time slot.
            </p>
            <button
              type="button"
              disabled={cancelling}
              onClick={handlePublicCancel}
              style={{
                width: "100%",
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.22)",
                color: "#f87171",
                padding: "10px 14px",
                borderRadius: "10px",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: cancelling ? "not-allowed" : "pointer",
                transition: "all 150ms ease"
              }}
            >
              {cancelling ? "Cancelling..." : "Cancel This Booking"}
            </button>
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
