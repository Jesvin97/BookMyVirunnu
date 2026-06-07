"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../../../utils/api";
import styles from "../../../page.module.css";

export default function NewEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Core Event details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [visibility, setVisibility] = useState("public");

  // Meal configurations (Breakfast is completely disabled)
  const [enableLunch, setEnableLunch] = useState(true);
  const [enableDinner, setEnableDinner] = useState(true);

  useEffect(() => {
    // Validate auth
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("bv_token");
      const savedUser = localStorage.getItem("bv_user");

      if (!token || !savedUser) {
        router.push("/login");
        return;
      }

      const parsedUser = JSON.parse(savedUser);
      if (parsedUser.role !== "couple" && parsedUser.role !== "admin") {
        router.push("/");
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!enableLunch && !enableDinner) {
      setError("Please enable at least one feast meal block (Lunch or Dinner) for booking.");
      return;
    }

    setLoading(true);

    try {
      // 1. Create the base Event
      // Enforce Malayalam newlywed Sadhya: Max guests per slot is strictly 1 family (capacity = 1)
      const eventResponse = await api.post<{ event: { _id: string } }>("/events", {
        title,
        description,
        venue: "Various Host Homes", // Newlyweds visit the host family's home
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        maxGuestsTotal: (enableLunch ? 1 : 0) + (enableDinner ? 1 : 0),
        visibility,
        eventType: "feast",
        timezone: "Asia/Kolkata",
        bookingMode: "instant", // Locks instantly on reservation
        bookingRules: {
          slotDurationMinutes: 180, // 3-hour blocks
          minLeadMinutes: 60, // 1 hour lead time
          maxGuestsPerSlot: 1, // Enforce strictly 1 host family per slot!
          bufferMinutesBefore: 0,
          bufferMinutesAfter: 0,
          allowWaitlist: false, // Waitlist is disabled
          allowAutoApprove: true // Auto confirms so slot locks instantly
        }
      });

      if (eventResponse && eventResponse.event) {
        const eventId = eventResponse.event._id;

        // 2. Automatically create availability rules for each enabled meal
        const allDays = [0, 1, 2, 3, 4, 5, 6];

        if (enableLunch) {
          await api.post(`/events/${eventId}/availability-rules`, {
            ruleType: "weekly",
            daysOfWeek: allDays,
            startTime: "12:00",
            endTime: "15:00",
            maxGuests: 1,
            isBlocked: false,
            priority: 1,
            reason: "Lunch Slot"
          });
        }

        if (enableDinner) {
          await api.post(`/events/${eventId}/availability-rules`, {
            ruleType: "weekly",
            daysOfWeek: allDays,
            startTime: "19:00",
            endTime: "22:00",
            maxGuests: 1,
            isBlocked: false,
            priority: 1,
            reason: "Dinner Slot"
          });
        }
      }

      router.push("/couple");
    } catch (err: any) {
      setError(err.message || "Failed to create feast calendar. Please check inputs.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1px solid rgba(52, 211, 153, 0.2)",
    background: "rgba(4, 9, 6, 0.4)",
    color: "#fff",
    outline: "none",
    fontSize: "0.95rem",
    transition: "border-color 200ms ease"
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "0.85rem",
    color: "rgba(243, 252, 247, 0.8)",
    fontWeight: 500
  };

  return (
    <main className={styles.shell} style={{ minHeight: "100vh", padding: "48px 0" }}>
      <div className={styles.backgroundGlow} aria-hidden="true" />

      <header className={styles.hero} style={{ padding: "0 0 32px" }}>
        <div className={styles.headerWrapper} style={{ gap: "16px", width: "100%" }}>
          <div>
            <div className={styles.eyebrow} style={{ color: "#34d399" }}>Newlyweds Portal</div>
            <h1 style={{ fontFamily: "var(--bv-font-display)", fontSize: "2.8rem", margin: "16px 0 8px", color: "#fff" }}>
              Setup Feast Calendar
            </h1>
            <p style={{ color: "rgba(243, 252, 247, 0.65)", margin: 0 }}>
              Set up the date range you are available to be invited to host family homes.
            </p>
          </div>
          <Link href="/couple" className={styles.secondaryButton} style={{ textDecoration: "none" }}>
            ← Back to Portal
          </Link>
        </div>
      </header>

      <section className={styles.section} style={{ maxWidth: "800px" }}>
        {error && (
          <div style={{
            padding: "12px 16px",
            background: "rgba(239, 68, 68, 0.12)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            borderRadius: "12px",
            color: "#f87171",
            fontSize: "0.9rem",
            marginBottom: "24px"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.panel} style={{ padding: "40px", display: "grid", gap: "32px" }}>
          
          {/* Section 1: Core Details */}
          <div>
            <h3 style={{ fontSize: "1.15rem", color: "#34d399", margin: "0 0 20px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              1. Newlywed Feast Calendar Details
            </h3>
            <div style={{ display: "grid", gap: "20px" }}>
              <div style={{ display: "grid", gap: "8px" }}>
                <label style={labelStyle}>Calendar Title</label>
                <input
                  type="text"
                  required
                  placeholder="Joyal & Anjali's Feast Schedule "
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = "#34d399"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(52, 211, 153, 0.2)"}
                />
              </div>

              <div style={{ display: "grid", gap: "8px" }}>
                <label style={labelStyle}>Feast Description (Optional)</label>
                <textarea
                  placeholder="e.g. We are excited to visit our family and friends! Feel free to book a convenient Lunch or Dinner slot..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ ...inputStyle, minHeight: "80px", fontFamily: "inherit", resize: "vertical" }}
                  onFocus={(e) => e.target.style.borderColor = "#34d399"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(52, 211, 153, 0.2)"}
                />
              </div>

              <div className={styles.formTwoCol}>
                <div style={{ display: "grid", gap: "8px" }}>
                  <label style={labelStyle}>Available From (Start Date)</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = "#34d399"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(52, 211, 153, 0.2)"}
                  />
                </div>
                <div style={{ display: "grid", gap: "8px" }}>
                  <label style={labelStyle}>Available Until (End Date)</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = "#34d399"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(52, 211, 153, 0.2)"}
                  />
                </div>
              </div>
            </div>
          </div>

          <hr style={{ border: "0", borderTop: "1px solid rgba(52, 211, 153, 0.12)", margin: 0 }} />

          {/* Section 2: Meal Slot Configurations */}
          <div>
            <h3 style={{ fontSize: "1.15rem", color: "#34d399", margin: "0 0 20px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              2. Available Meal Blocks
            </h3>
            <p style={{ fontSize: "0.9rem", color: "rgba(243, 252, 247, 0.6)", marginTop: "-12px", marginBottom: "24px", lineHeight: 1.5 }}>
              Choose which meal times you are open to be invited to host family homes. Feasts are restricted strictly to **1 host family per slot**.
            </p>

            <div style={{ display: "grid", gap: "24px" }}>
              
              {/* Lunch Config */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                alignItems: "center",
                gap: "20px",
                padding: "20px",
                borderRadius: "16px",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(52, 211, 153, 0.1)"
              }}>
                <input
                  type="checkbox"
                  checked={enableLunch}
                  onChange={(e) => setEnableLunch(e.target.checked)}
                  style={{ width: "20px", height: "20px", cursor: "pointer", accentColor: "#34d399" }}
                />
                <div>
                  <strong style={{ color: "#fff", display: "block", fontSize: "1.05rem" }}>Lunch (Sadhya) </strong>
                  <span style={{ fontSize: "0.85rem", color: "rgba(243, 252, 247, 0.5)" }}>Banquet Window: 12:00 PM - 3:00 PM</span>
                </div>
                <div style={{ fontSize: "0.85rem", color: "#34d399", fontWeight: 600 }}>
                  Capacity: 1 Family
                </div>
              </div>

              {/* Dinner Config */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                alignItems: "center",
                gap: "20px",
                padding: "20px",
                borderRadius: "16px",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(52, 211, 153, 0.1)"
              }}>
                <input
                  type="checkbox"
                  checked={enableDinner}
                  onChange={(e) => setEnableDinner(e.target.checked)}
                  style={{ width: "20px", height: "20px", cursor: "pointer", accentColor: "#34d399" }}
                />
                <div>
                  <strong style={{ color: "#fff", display: "block", fontSize: "1.05rem" }}>Dinner (Virunnu) </strong>
                  <span style={{ fontSize: "0.85rem", color: "rgba(243, 252, 247, 0.5)" }}>Banquet Window: 7:00 PM - 10:00 PM</span>
                </div>
                <div style={{ fontSize: "0.85rem", color: "#34d399", fontWeight: 600 }}>
                  Capacity: 1 Family
                </div>
              </div>

            </div>
          </div>

          <hr style={{ border: "0", borderTop: "1px solid rgba(52, 211, 153, 0.12)", margin: 0 }} />

          {/* Section 3: Access Settings */}
          <div>
            <h3 style={{ fontSize: "1.15rem", color: "#34d399", margin: "0 0 20px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              3. Privacy Control
            </h3>
            <div style={{ display: "grid", gap: "8px" }}>
              <label style={labelStyle}>Booking Access Mode</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
                onFocus={(e) => e.target.style.borderColor = "#34d399"}
                onBlur={(e) => e.target.style.borderColor = "rgba(52, 211, 153, 0.2)"}
              >
                <option value="public" style={{ background: "#040906" }}>Public Invite (Anyone with link can book slots)</option>
                <option value="invite_only" style={{ background: "#040906" }}>Private Invite (Explicit guest invitation only)</option>
              </select>
            </div>
          </div>

          <hr style={{ border: "0", borderTop: "1px solid rgba(52, 211, 153, 0.12)", margin: 0 }} />

          <button
            type="submit"
            disabled={loading}
            className={styles.primaryButton}
            style={{ width: "100%", border: "0", cursor: loading ? "not-allowed" : "pointer", minHeight: "54px", fontSize: "1.05rem" }}
          >
            {loading ? "Creating Feast Calendar..." : "Generate Available Slots "}
          </button>
        </form>
      </section>
    </main>
  );
}
