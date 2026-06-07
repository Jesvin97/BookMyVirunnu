"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../utils/api";
import styles from "../page.module.css";

import { Skeleton } from "../../components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from "../../components/ui/table";
import { CopyButton } from "../../components/ui/copy-button";
import { ShareButton } from "../../components/ui/share-button";
import { ThemeTogglerButton } from "../../components/ui/theme-toggler";
import { toast } from "../../components/ui/sonner";

interface Event {
  _id: string;
  title: string;
  description?: string;
  visibility: string;
  startDate: string;
  endDate: string;
  status: string;
  venue: string;
  maxGuestsTotal: number;
}

interface Booking {
  _id: string;
  partySize: number;
  specialRequests?: string;
  status: string;
  startAt: string;
  endAt: string;
  venue?: {
    name?: string;
    address?: string;
    phone?: string;
  };
}

interface Slot {
  _id: string;
  startAt: string;
  endAt: string;
  status: string;
  capacity: number;
  reservedCount: number;
}

interface Rule {
  _id: string;
  ruleType: string;
  date?: string;
  startTime: string;
  endTime: string;
  isBlocked: boolean;
  reason?: string;
}

export default function CoupleDashboard() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [newRestDate, setNewRestDate] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryId = params.get("id");

      const checkAuthAndFetch = async () => {
        let token = localStorage.getItem("bv_token");
        let savedUser = localStorage.getItem("bv_user");

        if (queryId) {
          try {
            setLoading(true);
            const response = await api.post<{ token: string; user: { role: string; name: string } }>(
              "/auth/access-id",
              { eventId: queryId.trim() }
            );
            if (response && response.token) {
              localStorage.setItem("bv_token", response.token);
              localStorage.setItem("bv_user", JSON.stringify(response.user));
              token = response.token;
              savedUser = JSON.stringify(response.user);
              
              // Clean query param from URL
              const newUrl = window.location.pathname;
              window.history.replaceState({}, "", newUrl);
            }
          } catch (err) {
            console.error("Auto login with Feast ID failed:", err);
          }
        }

        if (!token || !savedUser) {
          router.push("/login");
          return;
        }

        try {
          const parsedUser = JSON.parse(savedUser);
          if (parsedUser.role !== "couple" && parsedUser.role !== "admin") {
            router.push("/");
            return;
          }

          setUser(parsedUser);
          
          // Fetch events
          const response = await api.get<{ events: Event[] }>("/events/me");
          if (response && response.events) {
            setEvents(response.events);
            if (response.events.length > 0) {
              const matchingEvent = response.events.find(e => e._id === queryId);
              if (matchingEvent) {
                setSelectedEventId(matchingEvent._id);
              } else {
                setSelectedEventId(response.events[0]._id);
              }
            }
          }
        } catch (err) {
          console.error("Error fetching events:", err);
        } finally {
          setLoading(false);
        }
      };

      checkAuthAndFetch();
    }
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ events: Event[] }>("/events/me");
      if (response && response.events) {
        setEvents(response.events);
        if (response.events.length > 0) {
          setSelectedEventId(response.events[0]._id);
        }
      }
    } catch (err) {
      console.error("Error fetching events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEventId) {
      refreshDashboardData(selectedEventId);
    } else {
      setBookings([]);
      setSlots([]);
      setRules([]);
    }
  }, [selectedEventId]);

  const refreshDashboardData = async (eventId: string) => {
    setBookingsLoading(true);
    try {
      // 1. Fetch bookings
      const bookingsRes = await api.get<{ bookings: Booking[] }>(`/events/${eventId}/bookings`);
      if (bookingsRes && bookingsRes.bookings) {
        setBookings(bookingsRes.bookings);
      }

      // 2. Fetch all availability rules
      const rulesRes = await api.get<{ rules: Rule[] }>(`/events/${eventId}/availability-rules`);
      if (rulesRes && rulesRes.rules) {
        setRules(rulesRes.rules);
      }

      // 3. Fetch slots for the event window
      const eventDetail = events.find(e => e._id === eventId) || await api.get<{ event: Event }>(`/events/${eventId}`).then(r => r.event);
      if (eventDetail) {
        const start = new Date(eventDetail.startDate).toISOString();
        const end = new Date(eventDetail.endDate).toISOString();
        const slotsRes = await api.get<{ slots: Slot[] }>(
          `/events/${eventId}/availability?rangeStart=${start}&rangeEnd=${end}`
        );
        if (slotsRes && slotsRes.slots) {
          setSlots(slotsRes.slots);
        }
      }
    } catch (err) {
      console.error("Error syncing dashboard data:", err);
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleStatusChange = async (eventId: string, action: "publish" | "pause" | "cancel") => {
    try {
      await api.post(`/events/${eventId}/${action}`);
      toast.success(`Feast calendar status updated to ${action}ed! 🍛`);
      fetchEvents();
    } catch (err: any) {
      console.error(`Error performing ${action}:`, err);
      toast.error(err.message || `Failed to update status to ${action}ed.`);
    }
  };

  const handleBlockSlot = async (slot: Slot) => {
    if (!selectedEventId) return;
    const start = new Date(slot.startAt);
    const end = new Date(slot.endAt);
    
    const dateStr = start.toLocaleDateString("en-CA"); // YYYY-MM-DD local format safely
    const startTime = start.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }); // HH:MM
    const endTime = end.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }); // HH:MM

    setActionLoading(slot._id);
    try {
      await api.post(`/events/${selectedEventId}/availability-rules`, {
        ruleType: "specific_date",
        date: dateStr,
        startTime,
        endTime,
        isBlocked: true,
        priority: 10,
        reason: "Blocked by couple for private plans"
      });
      toast.success("Feast slot successfully blocked! 🚫");
      await refreshDashboardData(selectedEventId);
    } catch (err: any) {
      console.error("Failed to block slot:", err);
      toast.error(err.message || "Failed to block slot.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnblockSlot = async (slot: Slot) => {
    if (!selectedEventId) return;
    const start = new Date(slot.startAt);
    const dateStr = start.toLocaleDateString("en-CA");
    
    // Find the specific rule that blocks this date and time
    const ruleToDelete = rules.find(
      r => r.ruleType === "specific_date" && r.date === dateStr && r.isBlocked
    );

    if (!ruleToDelete) {
      // If we can't find it locally, refresh anyway
      await refreshDashboardData(selectedEventId);
      return;
    }

    setActionLoading(slot._id);
    try {
      await api.delete(`/availability-rules/${ruleToDelete._id}`);
      toast.success("Feast slot unblocked! 🔓");
      await refreshDashboardData(selectedEventId);
    } catch (err: any) {
      console.error("Failed to unblock slot:", err);
      toast.error(err.message || "Failed to unblock slot.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("bv_token");
    localStorage.removeItem("bv_user");
    router.push("/login");
  };

  const getMealLabel = (startAtStr: string) => {
    // Asia/Kolkata is UTC + 5:30
    const date = new Date(startAtStr);
    const istMillis = date.getTime() + (5.5 * 60 * 60 * 1000);
    const istDate = new Date(istMillis);
    const hour = istDate.getUTCHours();
    
    if (hour < 12) return "Breakfast";
    if (hour < 16) return "Lunch";
    return "Dinner";
  };

  const activeEvent = events.find(e => e._id === selectedEventId);

  if (loading) {
    return (
      <main className={styles.shell} style={{ minHeight: "100vh", padding: "48px 24px" }}>
        <div className={styles.backgroundGlow} aria-hidden="true" />
        <header className={styles.hero} style={{ padding: "0 0 40px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "24px" }}>
          <div>
            <Skeleton style={{ width: "160px", height: "16px", marginBottom: "12px" }} />
            <Skeleton style={{ width: "380px", height: "48px", marginBottom: "12px" }} />
            <Skeleton style={{ width: "420px", height: "20px" }} />
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <Skeleton style={{ width: "180px", height: "46px" }} />
            <Skeleton style={{ width: "100px", height: "46px" }} />
          </div>
        </header>
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "32px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Skeleton style={{ width: "120px", height: "20px", marginBottom: "8px" }} />
            <Skeleton style={{ height: "60px", borderRadius: "16px" }} />
            <Skeleton style={{ height: "60px", borderRadius: "16px" }} />
            <Skeleton style={{ height: "60px", borderRadius: "16px" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <Skeleton style={{ height: "160px", borderRadius: "16px" }} />
            <Skeleton style={{ height: "320px", borderRadius: "16px" }} />
          </div>
        </section>
      </main>
    );
  }

  return (
    <div style={{ background: "#fff", minHeight: "100vh", display: "flex", flexDirection: "column", width: "100%" }}>
      <main className={styles.shell} style={{ flex: 1, minHeight: "100vh", padding: "48px 24px", overflowY: "auto", position: "relative" }}>
        <div className={styles.backgroundGlow} aria-hidden="true" />

        <header className={styles.hero} style={{ padding: "0 0 40px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "24px" }}>
          <div>
            <div className={styles.eyebrow} style={{ color: "var(--color-primary)" }}>Newlywed Feasts Portal</div>
            <h1 style={{ fontFamily: "var(--bv-font-display)", fontSize: "3rem", margin: "16px 0 8px", color: "#000" }}>
              Namaskaram, {user?.name || "Couple"} 👋
            </h1>
            <p style={{ color: "#000", margin: 0 }}>
              Manage invitations from family and block dates to rest.
            </p>
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <ThemeTogglerButton />
            <button onClick={handleLogout} className={styles.secondaryButton} style={{ cursor: "pointer", border: "1px solid rgba(239, 68, 68, 0.2)", background: "rgba(239, 68, 68, 0.05)", color: "#f87171" }}>
              Sign Out
            </button>
          </div>
        </header>

        <section className={styles.section}>
          {events.length === 0 ? (
            <div className={styles.panel} style={{ textAlign: "center", padding: "64px 32px" }}>
              <h3 style={{ fontSize: "1.5rem", margin: "0 0 12px", color: "var(--color-primary)" }}>No Feast Calendar Created Yet</h3>
              <p style={{ color: "#000", maxWidth: "400px", margin: "0 auto 28px" }}>
                Setup your available date range so families and friends can begin calling you to their homes for traditional wedding meals!
              </p>
              <Link href="/couple/events/new" className={styles.primaryButton} style={{ textDecoration: "none" }}>
                Setup your Feast Calendar
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
              {activeEvent && (
                <div className={styles.panel} style={{ padding: "32px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "16px", marginBottom: "20px" }}>
                    <div>
                      <h2 style={{ fontSize: "2rem", margin: "0 0 8px", color: "#000", fontFamily: "var(--bv-font-display)" }}>
                        {activeEvent.title.replace(/ 🍛$/, '')}
                      </h2>
                      <p style={{ color: "#000", fontSize: "0.9rem", margin: 0 }}>
                        Active Calendar Range: {new Date(activeEvent.startDate).toLocaleDateString()} - {new Date(activeEvent.endDate).toLocaleDateString()}
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: "10px", alignItems: "start" }}>
                      {activeEvent.status === "draft" && (
                        <button onClick={() => handleStatusChange(activeEvent._id, "publish")} className={styles.primaryButton} style={{ border: 0, padding: "0 18px", minHeight: "40px", fontSize: "0.9rem", cursor: "pointer" }}>
                          Open Invitations
                        </button>
                      )}
                      {activeEvent.status === "published" && (
                        <button onClick={() => handleStatusChange(activeEvent._id, "pause")} className={styles.secondaryButton} style={{ padding: "0 18px", minHeight: "40px", fontSize: "0.9rem", cursor: "pointer" }}>
                          Pause Invitations
                        </button>
                      )}
                      {activeEvent.status === "paused" && (
                        <button onClick={() => handleStatusChange(activeEvent._id, "publish")} className={styles.primaryButton} style={{ border: 0, padding: "0 18px", minHeight: "40px", fontSize: "0.9rem", cursor: "pointer" }}>
                          Resume Invitations
                        </button>
                      )}
                      {activeEvent.status !== "cancelled" && (
                        <button onClick={() => handleStatusChange(activeEvent._id, "cancel")} className={styles.secondaryButton} style={{ padding: "0 18px", minHeight: "40px", fontSize: "0.9rem", cursor: "pointer", border: "1px solid rgba(239, 68, 68, 0.2)", background: "rgba(239, 68, 68, 0.05)", color: "#f87171" }}>
                          Close Calendar
                        </button>
                      )}
                    </div>
                  </div>

                  <hr style={{ border: "0", borderTop: "1px solid rgba(52, 211, 153, 0.12)", margin: "24px 0" }} />

                  {/* Public Link Share Card */}
                  {activeEvent.status === "published" && (
                    <div className={styles.notice} style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px", padding: "12px 16px", marginBottom: "16px", minWidth: 0, flexShrink: 1, overflowWrap: "anywhere", wordBreak: "break-word" }}>
                      <div style={{ minWidth: 0, flexShrink: 1 }}>
                        <strong style={{ display: "block", color: "#000", marginBottom: "4px" }}>Share Your Invite Portal Link 🔗</strong>
                        <span style={{ fontSize: "0.85rem", color: "#000" }}>Send this link to families and friends so they can call you for meals:</span>
                      </div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", minWidth: 0, flexShrink: 1 }}>
                        <code style={{ background: "#fff", padding: "4px 8px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.75rem", color: "#000", minWidth: 0, flexShrink: 1, overflowWrap: "anywhere", wordBreak: "break-all", whiteSpace: "normal" }}>
                          /book/{activeEvent._id}
                        </code>
                        <CopyButton
                          content={typeof window !== "undefined" ? `${window.location.origin}/book/${activeEvent._id}` : `/book/${activeEvent._id}`}
                          successMessage="Invitation Link copied successfully! 🍛"
                        />
                        <ShareButton
                          url={`/book/${activeEvent._id}`}
                          title={activeEvent.title}
                          text="We are now accepting post-wedding invitations! Book a Sadhya slot here:"
                        />
                        <Link href={`/book/${activeEvent._id}`} target="_blank" className={styles.secondaryButton} style={{ padding: "0 14px", minHeight: "32px", fontSize: "0.8rem", textDecoration: "none" }}>
                          Open Link
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Private Dashboard Link Card */}
                  <div className={styles.panelAccent} style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px", padding: "12px 16px", marginBottom: "32px", background: "#fef2f2", border: "1px solid #fecaca", minWidth: 0, maxWidth: "100%", flexShrink: 1, boxSizing: "border-box", overflowWrap: "anywhere", wordBreak: "break-word" }}>
                    <div style={{ minWidth: 0, flexShrink: 1 }}>
                      <strong style={{ display: "block", color: "#ef4444", marginBottom: "4px" }}>Feast ID & Private Dashboard Manager 🔑</strong>
                      <span style={{ fontSize: "0.85rem", color: "#000" }}>Bookmark this link to access your dashboard passwordlessly on other devices:</span>
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", minWidth: 0, flexShrink: 1 }}>
                      <code style={{ background: "#fff", padding: "4px 8px", borderRadius: "8px", border: "1px solid #fca5a5", fontSize: "0.75rem", color: "#ef4444", minWidth: 0, flexShrink: 1, overflowWrap: "anywhere", wordBreak: "break-all", whiteSpace: "normal" }}>
                        {activeEvent._id}
                      </code>
                      <CopyButton
                        content={typeof window !== "undefined" ? `${window.location.origin}/couple?id=${activeEvent._id}` : `${activeEvent._id}`}
                        successMessage="Private Manage Link copied successfully! 🔑"
                        style={{ padding: "0 14px", minHeight: "32px", fontSize: "0.8rem", border: "1px solid #fca5a5", background: "#fff", color: "#ef4444" }}
                      />
                    </div>
                  </div>

                  {/* Bookings & Visits Schedule */}
                  <h3 style={{ fontSize: "1.2rem", color: "#000", margin: "0 0 16px", fontFamily: "var(--bv-font-display)" }}>
                    Scheduled Home Visits
                  </h3>
                  {bookingsLoading ? (
                    <div style={{ color: "rgba(243, 252, 247, 0.6)", display: "flex", flexDirection: "column", gap: "10px" }}>
                      <Skeleton style={{ height: "40px" }} />
                      <Skeleton style={{ height: "40px" }} />
                    </div>
                  ) : bookings.length === 0 ? (
                    <div style={{ color: "#000", fontStyle: "italic", border: "1px dashed #d1d5db", borderRadius: "12px", padding: "20px", textAlign: "center", marginBottom: "32px" }}>
                      No families have invited you for a meal yet. Share your link!
                    </div>
                  ) : (
                    <Table style={{ marginBottom: "32px" }}>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Host Family</TableHead>
                          <TableHead>Meal Details</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead>Special Requests</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bookings.map((b) => {
                          const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.venue?.address || "")}`;
                          const mealLabel = getMealLabel(b.startAt);

                          return (
                            <TableRow key={b._id}>
                              <TableCell style={{ fontWeight: 600 }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                  <span style={{ color: "#000" }}>{b.venue?.name || "Host Family"}</span>
                                  {b.venue?.phone && (
                                    <span style={{ fontSize: "0.8rem", color: "#000" }}>
                                      📞 {b.venue.phone}
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                  <span style={{ color: "var(--color-primary)", fontWeight: 600 }}>{mealLabel}</span>
                                  <span style={{ fontSize: "0.8rem", color: "#000" }}>
                                    {new Date(b.startAt).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell style={{ maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                <span style={{ fontSize: "0.85rem", color: "#000" }}>
                                  {b.venue?.address || "Address undisclosed"}
                                </span>
                              </TableCell>
                              <TableCell>
                                {b.specialRequests ? (
                                  <span style={{ fontSize: "0.85rem", fontStyle: "italic", color: "#000" }}>
                                    "{b.specialRequests}"
                                  </span>
                                ) : (
                                  <span style={{ color: "rgba(0,0,0,0.5)", fontSize: "0.8rem" }}>None</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {b.venue?.address ? (
                                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={styles.secondaryButton} style={{ textDecoration: "none", fontSize: "0.75rem", padding: "6px 12px", minHeight: "30px", background: "rgba(52, 211, 153, 0.05)", border: "1px solid rgba(52, 211, 153, 0.2)", color: "var(--color-primary)" }}>
                                    🗺️ Maps
                                  </a>
                                ) : (
                                  <span style={{ fontSize: "0.75rem", color: "rgba(0,0,0,0.5)", fontStyle: "italic" }}>
                                    No Address
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}

                  {/* Compact Feast Calendar & Date Blocking Manager */}
                  <h3 style={{ fontSize: "1.2rem", color: "#000", margin: "28px 0 16px", fontFamily: "var(--bv-font-display)" }}>
                    Feast Calendar Configuration & Rest Days
                  </h3>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "32px" }}>
                    
                    {/* Selected Calendar Range & Configured Meals Status */}
                    <div className={styles.panelAccent} style={{ padding: "20px", borderRadius: "16px", background: "#f9fafb", border: "1px solid #d1d5db", display: "flex", flexDirection: "column", gap: "16px", minWidth: 0, maxWidth: "100%", flexShrink: 1, boxSizing: "border-box", overflowWrap: "anywhere", wordBreak: "break-word" }}>
                      <h4 style={{ margin: 0, color: "#000", fontSize: "1.05rem", fontWeight: 600 }}>Feast Setup Summary 🌿</h4>
                      
                      <div style={{ fontSize: "0.9rem", color: "#000" }}>
                        <strong style={{ display: "block", color: "var(--color-primary)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Selected Calendar Range</strong>
                        <span>
                          {new Date(activeEvent.startDate).toLocaleDateString(undefined, { dateStyle: "long" })} to {new Date(activeEvent.endDate).toLocaleDateString(undefined, { dateStyle: "long" })}
                        </span>
                      </div>

                      <div style={{ fontSize: "0.9rem", color: "#000" }}>
                        <strong style={{ display: "block", color: "var(--color-primary)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Configured Meals</strong>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                          {[
                            { name: "Breakfast", active: rules.some(r => r.ruleType === "weekly" && r.startTime === "08:00") },
                            { name: "Lunch", active: rules.some(r => r.ruleType === "weekly" && r.startTime === "12:00") },
                            { name: "Dinner", active: rules.some(r => r.ruleType === "weekly" && r.startTime === "19:00") }
                          ].map(meal => (
                            <span key={meal.name} style={{
                              fontSize: "0.78rem",
                              padding: "4px 10px",
                              borderRadius: "99px",
                              background: meal.active ? "var(--color-primary-light)" : "#f3f4f6",
                              border: meal.active ? "1px solid var(--color-primary)" : "1px solid #d1d5db",
                              color: meal.active ? "var(--color-primary-dark)" : "#000",
                              fontWeight: 600
                            }}>
                              {meal.name}: {meal.active ? "Active" : "Disabled"}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div style={{ fontSize: "0.9rem", color: "#000" }}>
                        <strong style={{ display: "block", color: "var(--color-primary)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Slot Availability Status</strong>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                          <span style={{ fontSize: "0.78rem", padding: "4px 10px", borderRadius: "99px", background: "var(--color-primary-light)", border: "1px solid var(--color-primary)", color: "var(--color-primary-dark)", fontWeight: 600 }}>
                            Open: {slots.filter(s => s.status !== "locked" && s.reservedCount === 0).length}
                          </span>
                          <span style={{ fontSize: "0.78rem", padding: "4px 10px", borderRadius: "99px", background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontWeight: 600 }}>
                            Reserved Feasts: {slots.filter(s => s.status === "locked" || s.reservedCount > 0).length}
                          </span>
                          <span style={{ fontSize: "0.78rem", padding: "4px 10px", borderRadius: "99px", background: "#fef2f2", border: "1px solid #fca5a5", color: "#b91c1c", fontWeight: 600 }}>
                            Blocked Rest Dates: {rules.filter(r => r.ruleType === "specific_date" && r.isBlocked).length}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Block New Rest Date Form */}
                    <div className={styles.panelAccent} style={{ padding: "20px", borderRadius: "16px", background: "#fef2f2", border: "1px solid #fecaca", display: "flex", flexDirection: "column", gap: "14px", minWidth: 0, maxWidth: "100%", flexShrink: 1, boxSizing: "border-box", overflowWrap: "anywhere", wordBreak: "break-word" }}>
                      <h4 style={{ margin: 0, color: "#000", fontSize: "1.05rem", fontWeight: 600 }}>Block a Rest Date 🚫</h4>
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "#000", lineHeight: 1.4 }}>
                        Add dates (e.g., honeymoon, personal plans) to completely hide all meals on that day from relatives.
                      </p>
                      
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <input
                          type="date"
                          value={newRestDate}
                          onChange={(e) => setNewRestDate(e.target.value)}
                          style={{
                            flex: 1,
                            minWidth: "120px",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            border: "1px solid #fca5a5",
                            background: "#fff",
                            color: "#000",
                            outline: "none",
                            fontSize: "0.85rem"
                          }}
                        />
                        <button
                          type="button"
                          disabled={actionLoading === "block-rest" || !newRestDate}
                          onClick={async () => {
                            if (!selectedEventId || !newRestDate) return;
                            setActionLoading("block-rest");
                            try {
                              await api.post(`/events/${selectedEventId}/availability-rules`, {
                                ruleType: "specific_date",
                                date: newRestDate,
                                startTime: "00:00",
                                endTime: "23:59",
                                isBlocked: true,
                                priority: 10,
                                reason: "Blocked Rest Day"
                              });
                              toast.success("Rest date successfully blocked! 🚫");
                              setNewRestDate("");
                              await refreshDashboardData(selectedEventId);
                            } catch (err: any) {
                              console.error("Failed to block rest date:", err);
                              toast.error(err.message || "Failed to block rest date.");
                            } finally {
                              setActionLoading(null);
                            }
                          }}
                          style={{
                            padding: "8px 14px",
                            borderRadius: "8px",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            background: "rgba(239, 68, 68, 0.08)",
                            color: "#f87171",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            cursor: (!newRestDate || actionLoading === "block-rest") ? "not-allowed" : "pointer",
                            opacity: (!newRestDate || actionLoading === "block-rest") ? 0.6 : 1
                          }}
                        >
                          {actionLoading === "block-rest" ? "Blocking..." : "🚫 Block Date"}
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Blocked Rest Dates List */}
                  <h4 style={{ color: "#000", fontSize: "1.1rem", marginBottom: "12px", fontWeight: 600 }}>Active Blocked Rest Dates</h4>
                  {rules.filter(r => r.ruleType === "specific_date" && r.isBlocked).length === 0 ? (
                    <div style={{ color: "#000", fontSize: "0.85rem", fontStyle: "italic", border: "1px dashed #d1d5db", borderRadius: "12px", padding: "16px", textAlign: "center", marginBottom: "24px" }}>
                      No blocked rest dates. You are open for all dates in the calendar range!
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "32px" }}>
                      {rules.filter(r => r.ruleType === "specific_date" && r.isBlocked).map(rule => {
                        const ruleDate = rule.date ? new Date(rule.date) : null;
                        const dateLabel = ruleDate ? ruleDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : rule.date;
                        return (
                          <div key={rule._id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "6px 12px", borderRadius: "10px", background: "#fef2f2", border: "1px solid #fecaca" }}>
                            <span style={{ fontSize: "0.85rem", color: "#b91c1c", fontWeight: 600 }}>🚫 {dateLabel}</span>
                            <button
                              type="button"
                              disabled={actionLoading === rule._id}
                              onClick={async () => {
                                setActionLoading(rule._id);
                                try {
                                  await api.delete(`/availability-rules/${rule._id}`);
                                  toast.success("Rest date unblocked! 🔓");
                                  if (selectedEventId) {
                                    await refreshDashboardData(selectedEventId);
                                  }
                                } catch (err: any) {
                                  console.error("Failed to unblock rest date:", err);
                                  toast.error(err.message || "Failed to unblock rest date.");
                                } finally {
                                  setActionLoading(null);
                                }
                              }}
                              style={{
                                border: 0,
                                background: "none",
                                color: "#f87171",
                                cursor: "pointer",
                                fontSize: "1rem",
                                padding: "0 4px",
                                fontWeight: "bold"
                              }}
                            >
                              {actionLoading === rule._id ? "..." : "×"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
