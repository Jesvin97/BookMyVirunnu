"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { api } from "../../utils/api";
import styles from "../../page.module.css";
import { Progress } from "../../../components/ui/progress";
import { Skeleton } from "../../../components/ui/skeleton";
import { Textarea } from "../../../components/ui/textarea";
import { toast } from "../../../components/ui/sonner";

interface Event {
  _id: string;
  title: string;
  description?: string;
  venue: string;
  visibility: string;
  startDate: string;
  endDate: string;
  maxGuestsTotal: number;
  dietaryRestrictions?: string[];
  bookingRules: {
    slotDurationMinutes: number;
    maxGuestsPerSlot: number;
  };
}

interface Slot {
  _id: string;
  startAt: string;
  endAt: string;
  capacity: number;
  reservedCount: number;
  confirmedCount: number;
  status: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  symbol: string;
}

export default function GuestBookingPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  // Wizard States
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [animatingOut, setAnimatingOut] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  // Form State
  const [guestName, setGuestName] = useState(() => {
    if (typeof window !== "undefined") {
      const savedName = localStorage.getItem("bv_last_host_name");
      if (savedName) return savedName;
      try {
        const userStr = localStorage.getItem("bv_user");
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user.name) return user.name;
        }
      } catch (e) {}
    }
    return "Jesvin & Family";
  });
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState(() => {
    if (typeof window !== "undefined") {
      const savedPhone = localStorage.getItem("bv_last_host_phone");
      if (savedPhone) return savedPhone;
      try {
        const userStr = localStorage.getItem("bv_user");
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user.phone) return user.phone;
        }
      } catch (e) {}
    }
    return "";
  });
  const [venueAddress, setVenueAddress] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [locateError, setLocateError] = useState(false);

  useEffect(() => {
    // Attempt to pre-fill guest details from active session if present
    if (typeof window !== "undefined") {
      try {
        const userStr = localStorage.getItem("bv_user");
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user.name) setGuestName(user.name);
          if (user.email) setGuestEmail(user.email);
          if (user.phone) setGuestPhone(user.phone);
        }
      } catch (e) {
        console.error("Error pre-filling profile info:", e);
      }
    }
    fetchEventDetails();
  }, [eventId]);

  useEffect(() => {
    if (event) {
      const savedName = typeof window !== "undefined" ? localStorage.getItem("bv_last_host_name") : null;
      if (!savedName && (guestName === "Jesvin & Family" || !guestName)) {
        setGuestName("");
      }
    }
  }, [event, guestName]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ event: Event }>(`/events/${eventId}`);
      if (response && response.event) {
        setEvent(response.event);
        fetchSlots(response.event);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch wedding feast details.");
      setLoading(false);
    }
  };

  const fetchSlots = async (evt: Event) => {
    try {
      const start = new Date(evt.startDate).toISOString();
      const end = new Date(evt.endDate).toISOString();

      const response = await api.get<{ slots: Slot[] }>(
        `/events/${evt._id}/availability?rangeStart=${start}&rangeEnd=${end}`
      );
      if (response && response.slots) {
        setSlots(response.slots);
        if (response.slots.length > 0) {
          const firstDateStr = new Date(response.slots[0].startAt).toLocaleDateString([], {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric"
          });
          setSelectedDate(firstDateStr);
        }
      }
    } catch (err) {
      console.error("Error fetching slots:", err);
    } finally {
      setLoading(false);
    }
  };

  const triggerParticles = (clientX: number, clientY: number) => {
    const symbols = ["🍛", "🍽️", "✨", "🌟", "🎉", "🌾", "🍛"];
    const newParticles: Particle[] = [];
    for (let i = 0; i < 20; i++) {
      newParticles.push({
        id: Date.now() + i + Math.random(),
        x: clientX || (typeof window !== "undefined" ? window.innerWidth / 2 : 400),
        y: clientY || (typeof window !== "undefined" ? window.innerHeight / 2 : 300),
        symbol: symbols[Math.floor(Math.random() * symbols.length)]
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles((prev) => prev.slice(newParticles.length));
    }, 1500);
  };

  const handleStepTransition = (nextStep: 1 | 2 | 3, e?: React.MouseEvent) => {
    if (step === 1) {
      if (!selectedSlot) {
        setError("Please choose an available meal slot first.");
        return;
      }
      const isStillAvailable = slots.some((s) => s._id === selectedSlot._id && s.status !== "locked" && (s.capacity - s.reservedCount) > 0);
      if (!isStillAvailable) {
        setError("This slot is no longer available. It was recently booked by another guest. Please choose a different slot.");
        setSelectedSlot(null);
        return;
      }
      triggerParticles(e?.clientX || 0, e?.clientY || 0);
    }
    if (step === 2) {
      if (!guestName.trim() || !guestPhone.trim()) {
        setError("Please fill out your Name and Phone number.");
        return;
      }
      if (!/^[6-9]\d{9}$/.test(guestPhone.trim())) {
        setError("Phone number must be exactly 10 digits and start with 6, 7, 8, or 9 (Indian mobile format).");
        return;
      }
    }

    setError("");
    setAnimatingOut(true);
    setTimeout(() => {
      setStep(nextStep);
      setAnimatingOut(false);
    }, 380); // Match fadeOutLeft CSS animation time
  };

  const locateMe = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLocating(true);
    setError("");
    setLocateError(false);

    const handleSuccess = async (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          {
            headers: {
              "Accept-Language": "en"
            }
          }
        );
        const data = await res.json();
        if (data && data.display_name) {
          setVenueAddress(data.display_name);
          toast.success("Location successfully pinpointed! 📍");
        } else {
          setVenueAddress(`Coordinates: Lat ${latitude.toFixed(6)}, Lng ${longitude.toFixed(6)}`);
          toast.success("Coordinates captured! 📍");
        }
      } catch (err) {
        console.error("Reverse geocoding error:", err);
        setVenueAddress(`Coordinates: Lat ${latitude.toFixed(6)}, Lng ${longitude.toFixed(6)}`);
        toast.success("Coordinates captured! 📍");
        setLocateError(true);
      } finally {
        setLocating(false);
      }
    };

    const handleError = (err: GeolocationPositionError) => {
      console.error("Geolocation primary error:", err);
      setLocateError(true);
      if (err.code === err.PERMISSION_DENIED) {
        toast.error("Location permission denied. Please enable location access in your browser settings or type manually.");
        setError("Location permission denied. Please allow location permissions in your browser or enter address manually.");
        setLocating(false);
      } else {
        // Fallback to low-accuracy network provider
        toast.info("GPS timed out. Retrying with network/cell location fallback...");
        navigator.geolocation.getCurrentPosition(
          handleSuccess,
          (fallbackErr) => {
            console.error("Geolocation fallback error:", fallbackErr);
            toast.error("Unable to retrieve coordinates automatically. Please type your home address.");
            setError("Unable to capture location automatically. Please enter your home address manually.");
            setLocating(false);
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
        );
      }
    };

    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;
    if (!guestName.trim() || !guestPhone.trim() || !venueAddress.trim()) {
      setError("Please fill out your Name, Phone, and Home Address.");
      return;
    }
    setError("");
    setSubmitLoading(true);

    try {
      const idempotencyKey = `bk-${selectedSlot._id}-${Date.now()}`;
      const response = await api.post<{ booking: { _id: string; status: string } }>(
        "/bookings",
        {
          eventId,
          startAt: selectedSlot.startAt,
          endAt: selectedSlot.endAt,
          partySize: 1, // newlyweds couple slot unit
          guestName,
          guestEmail,
          guestPhone,
          venueAddress,
          idempotencyKey
        }
      );

      if (response && response.booking) {
        if (typeof window !== "undefined") {
          localStorage.setItem("bv_last_host_name", guestName.trim());
          localStorage.setItem("bv_last_host_phone", guestPhone.trim());
        }
        toast.success("Feast invitation successfully sent to couple! ✉️");
        router.push(`/booking/success?bookingId=${response.booking._id}`);
      }
    } catch (err: any) {
      setError(err.message || "Booking failed. The slot may have been locked or filled.");
      toast.error(err.message || "Booking failed. The slot may have been locked or filled.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const getMealLabel = (startAtStr: string, index?: number) => {
    if (typeof index === "number") {
      const mealNames = ["Breakfast", "Lunch", "Dinner"];
      return { name: mealNames[index] || `Slot ${index + 1}` };
    }
    const date = new Date(startAtStr);
    const hour = date.getHours();

    if (hour < 12) {
      return { name: "Breakfast" };
    } else if (hour < 16) {
      return { name: "Lunch" };
    } else {
      return { name: "Dinner" };
    }
  };

  const getSlotsByDate = () => {
    const groups: Record<string, Slot[]> = {};
    slots.forEach((slot) => {
      const dateKey = new Date(slot.startAt).toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric"
      });
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(slot);
    });
    return groups;
  };

  const isDateFullyBooked = (dateStr: string) => {
    const dateGroups = getSlotsByDate();
    const slotsForDate = dateGroups[dateStr] || [];
    return slotsForDate.length > 0 && slotsForDate.every((s) => s.status === "locked" || (s.capacity - s.reservedCount) <= 0);
  };

  if (loading) {
    return (
      <main className={styles.shell} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className={styles.backgroundGlow} />
        <div style={{ color: "#34d399", fontWeight: 600 }}>Loading feast booking portal...</div>
      </main>
    );
  }

  if (error && !event) {
    return (
      <main className={styles.shell} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 0" }}>
        <div className={styles.backgroundGlow} />
        <div className={styles.panel} style={{ padding: "40px", textAlign: "center", maxWidth: "440px" }}>
          <h2 style={{ color: "#f87171", marginBottom: "12px", fontFamily: "var(--bv-font-display)" }}>Feast Not Found</h2>
          <p style={{ color: "rgba(243, 252, 247, 0.7)", marginBottom: "28px" }}>{error}</p>
          <Link href="/" className={styles.secondaryButton} style={{ textDecoration: "none" }}>Return Home</Link>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.shell} style={{ minHeight: "100vh", padding: "24px 0" }}>
      <div className={styles.backgroundGlow} aria-hidden="true" />

      {/* Floating particles container */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="celebration-particle"
          style={{
            left: `${p.x}px`,
            top: `${p.y}px`
          }}
        >
          {p.symbol}
        </span>
      ))}

      {event && (
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          
          <header className={styles.hero} style={{ padding: "0 0 28px", textAlign: "center" }}>
            <div className={styles.eyebrow} style={{ color: "#34d399", margin: "0 auto 8px" }}>Invitation Portal</div>
            <h1 style={{ fontFamily: "var(--bv-font-display)", fontSize: "2.8rem", margin: "8px 0 6px", color: "#fff", lineHeight: 1.1 }}>
              Invite {event.title.replace("'s Feast Schedule 🍛", "").replace("'s Feast Schedule", "")}
            </h1>

            {/* Newlyweds Dietary Preferences Notification */}
            {event.dietaryRestrictions && event.dietaryRestrictions.length > 0 && (
              <div className={styles.notice} style={{
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                padding: "12px 24px",
                borderRadius: "14px",
                border: "1px solid rgba(52, 211, 153, 0.25)",
                background: "rgba(52, 211, 153, 0.04)",
                maxWidth: "600px",
                margin: "0 auto",
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)"
              }}>
                <span style={{ fontSize: "0.82rem", color: "#34d399", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  🥗 Note from Newlyweds: Dietary Preferences
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center" }}>
                  {event.dietaryRestrictions.map((diet) => (
                    <span key={diet} style={{
                      fontSize: "0.8rem",
                      padding: "4px 10px",
                      borderRadius: "8px",
                      background: "rgba(52, 211, 153, 0.12)",
                      border: "1px solid rgba(52, 211, 153, 0.2)",
                      color: "#fff",
                      fontWeight: 600
                    }}>
                      {diet}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Progress tracker */}
            <Progress
              value={step === 1 ? 33 : step === 2 ? 66 : 100}
              style={{ width: "100%", maxWidth: "360px", margin: "28px auto 0" }}
            />
          </header>

          <section className={styles.section} style={{ position: "relative" }}>
            {error && (
              <div style={{
                padding: "12px 16px",
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                borderRadius: "12px",
                color: "#f87171",
                fontSize: "0.9rem",
                marginBottom: "24px",
                animation: "scalePop 0.3s ease"
              }}>
                {error}
              </div>
            )}

            <div className={`${styles.panel} ${animatingOut ? "animate-fade-out" : "animate-fade-in"}`} style={{ padding: "24px" }}>
              
              {step === 1 && (
                <div>
                  <h2 style={{ fontFamily: "var(--bv-font-display)", fontSize: "2.2rem", color: "#34d399", margin: "0 0 8px", textAlign: "center" }}>
                    Select a Slot to Host the Couple
                  </h2>
                  <p style={{ color: "rgba(243, 252, 247, 0.6)", fontSize: "0.95rem", textAlign: "center", marginBottom: "32px" }}>
                    Choose an available date, then select a slot to host the newlyweds.
                  </p>

                  {slots.length === 0 ? (
                    <div style={{ color: "rgba(243, 252, 247, 0.5)", fontStyle: "italic", border: "1px dashed rgba(255,255,255,0.06)", borderRadius: "12px", padding: "28px", textAlign: "center" }}>
                      No active slots are currently open for this couple.
                    </div>
                  ) : (
                    <div>
                      {/* Horizontal Date Slider Selector */}
                      <span style={{ display: "block", fontSize: "0.85rem", color: "rgba(243, 252, 247, 0.5)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
                        🗓️ Select Date
                      </span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "28px" }}>
                        {Object.keys(getSlotsByDate()).map((dateStr) => {
                          const isSelected = selectedDate === dateStr;
                          const isFull = isDateFullyBooked(dateStr);
                          return (
                            <button
                              key={dateStr}
                              type="button"
                              onClick={() => setSelectedDate(dateStr)}
                              style={{
                                flexShrink: 0,
                                padding: "10px 18px",
                                borderRadius: "999px",
                                background: isSelected ? "rgba(52, 211, 153, 0.12)" : isFull ? "rgba(239, 68, 68, 0.02)" : "rgba(255, 255, 255, 0.03)",
                                border: isSelected ? "2px solid #34d399" : isFull ? "1px solid rgba(239, 68, 68, 0.15)" : "1px solid rgba(255, 255, 255, 0.08)",
                                color: isSelected ? "#fff" : isFull ? "rgba(243, 252, 247, 0.35)" : "rgba(243, 252, 247, 0.75)",
                                fontSize: "0.88rem",
                                fontWeight: isSelected ? 700 : 500,
                                cursor: "pointer",
                                transition: "all 150ms ease"
                              }}
                            >
                              {dateStr} {isFull && "🔒"}
                            </button>
                          );
                        })}
                      </div>

                      {/* Filtered Slots List */}
                      {selectedDate && getSlotsByDate()[selectedDate] && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "14px", marginBottom: "36px" }}>
                          {getSlotsByDate()[selectedDate].map((s, index) => {
                            const isSelected = selectedSlot?._id === s._id;
                            const isLocked = s.status === "locked" || (s.capacity - s.reservedCount) <= 0;
                            const meal = getMealLabel(s.startAt, index);

                            return (
                              <button
                                key={s._id}
                                type="button"
                                disabled={isLocked}
                                onClick={() => {
                                  setSelectedSlot(s);
                                  setTimeout(() => {
                                    handleStepTransition(2);
                                  }, 350);
                                }}
                                style={{
                                  padding: "20px 16px",
                                  borderRadius: "16px",
                                  background: isLocked ? "rgba(239, 68, 68, 0.05)" : isSelected ? "rgba(52, 211, 153, 0.08)" : "rgba(255,255,255,0.03)",
                                  border: isLocked ? "1px solid rgba(239, 68, 68, 0.25)" : isSelected ? "2px solid #34d399" : "1px solid rgba(255, 255, 255, 0.08)",
                                  color: isLocked ? "rgba(239, 68, 68, 0.4)" : isSelected ? "#fff" : "rgba(243, 252, 247, 0.8)",
                                  cursor: isLocked ? "not-allowed" : "pointer",
                                  textAlign: "center",
                                  transition: "all 150ms ease",
                                  boxShadow: isSelected ? "0 0 15px rgba(52, 211, 153, 0.25)" : "none",
                                  transform: isSelected ? "scale(1.03)" : "scale(1)",
                                  minWidth: 0,
                                  maxWidth: "100%",
                                  flexShrink: 1,
                                  boxSizing: "border-box",
                                  overflowWrap: "anywhere",
                                  wordBreak: "break-word"
                                }}
                              >
                                <strong style={{ display: "block", fontSize: "1.05rem", marginBottom: "4px", color: isLocked ? "rgba(239, 68, 68, 0.6)" : isSelected ? "#34d399" : "#fff" }}>
                                  {meal.name}
                                </strong>
                                <span style={{ display: "block", fontSize: "0.75rem", marginTop: "12px", fontWeight: 600 }}>
                                  {isLocked ? "🔒 Reserved / Blocked" : isSelected ? "Selected ✅" : "Open Slot"}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={(e) => handleStepTransition(2, e)}
                    disabled={!selectedSlot}
                    className={styles.primaryButton}
                    style={{ width: "100%", border: 0, padding: "14px", fontSize: "1.05rem", cursor: !selectedSlot ? "not-allowed" : "pointer" }}
                  >
                    Continue to Details ➔
                  </button>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 style={{ fontFamily: "var(--bv-font-display)", fontSize: "2.2rem", color: "#34d399", margin: "0 0 8px", textAlign: "center" }}>
                    Who is hosting the feast?
                  </h2>
                  <p style={{ color: "rgba(243, 252, 247, 0.6)", fontSize: "0.95rem", textAlign: "center", marginBottom: "32px" }}>
                    Please enter your host details so the newlyweds can connect with you.
                  </p>

                  {selectedSlot && (
                    <div style={{
                      padding: "14px 18px",
                      borderRadius: "14px",
                      background: "rgba(52, 211, 153, 0.05)",
                      border: "1px solid rgba(52, 211, 153, 0.2)",
                      color: "#fff",
                      marginBottom: "28px"
                    }}>
                      <span style={{ fontSize: "0.8rem", color: "rgba(52, 211, 153, 0.75)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "4px" }}>
                        Selected Slot
                      </span>
                      <strong style={{ display: "block", color: "#34d399", fontSize: "1.05rem", marginBottom: "4px" }}>
                        {getMealLabel(selectedSlot.startAt).name}
                      </strong>
                      <span style={{ fontSize: "0.85rem", color: "rgba(243, 252, 247, 0.6)" }}>
                        Date: {new Date(selectedSlot.startAt).toLocaleDateString([], { dateStyle: "medium" })}
                      </span>
                    </div>
                  )}

                  <div style={{ display: "grid", gap: "20px", marginBottom: "36px" }}>
                    <div style={{ display: "grid", gap: "6px" }}>
                      <label htmlFor="guestName" style={{ fontSize: "0.85rem", color: "rgba(243, 252, 247, 0.8)", fontWeight: 500 }}>
                        Family / Host Name
                      </label>
                      <input
                        id="guestName"
                        type="text"
                        required
                        placeholder="e.g. Jesvin & Family"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          borderRadius: "12px",
                          border: "1px solid rgba(52, 211, 153, 0.2)",
                          background: "rgba(4, 9, 6, 0.4)",
                          color: "#fff",
                          outline: "none",
                          fontSize: "0.95rem"
                        }}
                      />
                    </div>

                    <div style={{ display: "grid", gap: "6px" }}>
                      <label htmlFor="guestPhone" style={{ fontSize: "0.85rem", color: "rgba(243, 252, 247, 0.8)", fontWeight: 500 }}>
                        Phone Number
                      </label>
                      <input
                        id="guestPhone"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={10}
                        required
                        placeholder="e.g. 9876543210"
                        value={guestPhone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setGuestPhone(val);
                        }}
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          borderRadius: "12px",
                          border: "1px solid rgba(52, 211, 153, 0.2)",
                          background: "rgba(4, 9, 6, 0.4)",
                          color: "#fff",
                          outline: "none",
                          fontSize: "0.95rem"
                        }}
                      />
                    </div>
                  </div>

                  <div className={styles.wizardButtons} style={{ display: "flex", gap: "12px", flexDirection: "row" }}>
                    <button
                      type="button"
                      onClick={() => handleStepTransition(1)}
                      className={styles.secondaryButton}
                      style={{ flex: 1, padding: "14px" }}
                    >
                      ⬅ Back
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleStepTransition(3, e)}
                      className={styles.primaryButton}
                      style={{ flex: 1, border: 0, padding: "14px", fontSize: "1.05rem" }}
                    >
                      Continue to Location ➔
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <form onSubmit={handleBooking}>
                  <h2 style={{ fontFamily: "var(--bv-font-display)", fontSize: "2.2rem", color: "#34d399", margin: "0 0 8px", textAlign: "center" }}>
                    Feast Venue Location 📍
                  </h2>
                  <p style={{ color: "rgba(243, 252, 247, 0.6)", fontSize: "0.95rem", textAlign: "center", marginBottom: "32px" }}>
                    Pinpoint your home address so the newlyweds can navigate easily.
                  </p>

                  <div style={{ display: "grid", gap: "20px", marginBottom: "36px" }}>
                    
                    <div style={{ display: "grid", gap: "8px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <label htmlFor="venueAddress" style={{ fontSize: "0.85rem", color: "rgba(243, 252, 247, 0.8)", fontWeight: 500 }}>
                          Feast Venue
                        </label>
                        <button
                          type="button"
                          onClick={locateMe}
                          disabled={locating}
                          className={locating ? "gps-pulse" : ""}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "8px",
                            border: "1px solid rgba(52, 211, 153, 0.3)",
                            background: "rgba(52, 211, 153, 0.08)",
                            color: "#34d399",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            cursor: locating ? "not-allowed" : "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            transition: "all 150ms ease"
                          }}
                        >
                          {locating ? "⏳ Pinpointing..." : locateError ? "🔄 Retry Locate Me" : "📍 Locate Me"}
                        </button>
                      </div>
                      {locating ? (
                        <Skeleton style={{ height: "100px", marginTop: "8px" }} />
                      ) : (
                        <div>
                          <Textarea
                            id="venueAddress"
                            required
                            placeholder="Provide your physical home address so the couple can navigate there..."
                            value={venueAddress}
                            onChange={(e) => setVenueAddress(e.target.value)}
                            style={{ marginTop: "8px" }}
                          />
                        </div>
                      )}
                    </div>

                  </div>

                  <div className={styles.wizardButtons} style={{ display: "flex", gap: "12px", flexDirection: "row" }}>
                    <button
                      type="button"
                      onClick={() => handleStepTransition(2)}
                      className={styles.secondaryButton}
                      style={{ flex: 1, padding: "14px" }}
                    >
                      ⬅ Back
                    </button>
                    <button
                      type="submit"
                      disabled={submitLoading || locating}
                      className={styles.primaryButton}
                      style={{ flex: 1, border: 0, padding: "14px", fontSize: "1.05rem", cursor: (submitLoading || locating) ? "not-allowed" : "pointer" }}
                    >
                      {submitLoading ? "Reserving Slot..." : "Send Invitation ✉️"}
                    </button>
                  </div>
                </form>
              )}

            </div>
          </section>
        </div>
      )}
    </main>
  );
}
