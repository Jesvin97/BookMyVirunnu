"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../utils/api";
import styles from "../page.module.css";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger
} from "../../components/ui/sidebar";
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
          // Hide Breakfast slots (<11am) here too for consistency
          const filteredSlots = slotsRes.slots.filter(s => {
            const hour = new Date(s.startAt).getHours();
            return hour >= 11;
          });
          setSlots(filteredSlots);
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
    const date = new Date(startAtStr);
    const hour = date.getHours();
    return hour < 16 ? "Lunch (Sadhya) 🍛" : "Dinner (Virunnu) 🍽️";
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
    <SidebarProvider style={{ background: "#040906" }}>
      {events.length > 0 && (
        <Sidebar>
          <SidebarHeader style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#34d399", margin: 0, letterSpacing: "0.02em" }}>
              BookMyVirunnu
            </h3>
            <ThemeTogglerButton />
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Feast Calendars</SidebarGroupLabel>
              <SidebarMenu>
                {events.map((e) => {
                  const isActive = selectedEventId === e._id;
                  return (
                    <SidebarMenuItem key={e._id}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => setSelectedEventId(e._id)}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <strong style={{ fontSize: "0.95rem" }}>{e.title}</strong>
                          <span style={{
                            alignSelf: "flex-start",
                            fontSize: "0.7rem",
                            textTransform: "uppercase",
                            padding: "2px 6px",
                            borderRadius: "99px",
                            background: e.status === "published" ? "rgba(16, 185, 129, 0.15)" : e.status === "draft" ? "rgba(251, 191, 36, 0.15)" : "rgba(239, 68, 68, 0.15)",
                            color: e.status === "published" ? "#34d399" : e.status === "draft" ? "#fbbf24" : "#f87171",
                            fontWeight: 600
                          }}>
                            {e.status}
                          </span>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <button
              onClick={handleLogout}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                background: "rgba(239, 68, 68, 0.05)",
                color: "#f87171",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.85rem",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239, 68, 68, 0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(239, 68, 68, 0.05)";
              }}
            >
              🚪 Sign Out
            </button>
          </SidebarFooter>
        </Sidebar>
      )}

      <main className={styles.shell} style={{ flex: 1, minHeight: "100vh", padding: "48px 24px", overflowY: "auto", position: "relative" }}>
        <div className={styles.backgroundGlow} aria-hidden="true" />

        {events.length > 0 && (
          <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
            <SidebarTrigger />
            <span style={{ fontSize: "0.85rem", color: "rgba(243, 252, 247, 0.4)" }}>Toggle Sidebar</span>
          </div>
        )}

        <header className={styles.hero} style={{ padding: "0 0 40px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "24px" }}>
          <div>
            <div className={styles.eyebrow} style={{ color: "#34d399" }}>Newlywed Feasts Portal</div>
            <h1 style={{ fontFamily: "var(--bv-font-display)", fontSize: "3rem", margin: "16px 0 8px", color: "#fff" }}>
              Namaskaram, {user?.name || "Couple"} 👋
            </h1>
            <p style={{ color: "rgba(243, 252, 247, 0.65)", margin: 0 }}>
              Manage invitations from family and block dates to rest.
            </p>
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {events.length === 0 && <ThemeTogglerButton />}
            <Link href="/couple/events/new" className={styles.primaryButton} style={{ textDecoration: "none" }}>
              + Setup Feast Calendar
            </Link>
            {events.length === 0 && (
              <button onClick={handleLogout} className={styles.secondaryButton} style={{ cursor: "pointer", border: "1px solid rgba(239, 68, 68, 0.2)", background: "rgba(239, 68, 68, 0.05)", color: "#f87171" }}>
                Sign Out
              </button>
            )}
          </div>
        </header>

        <section className={styles.section}>
          {events.length === 0 ? (
            <div className={styles.panel} style={{ textAlign: "center", padding: "64px 32px" }}>
              <h3 style={{ fontSize: "1.5rem", margin: "0 0 12px", color: "#34d399" }}>No Feast Calendar Created Yet</h3>
              <p style={{ color: "rgba(243, 252, 247, 0.7)", maxWidth: "400px", margin: "0 auto 28px" }}>
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
                      <h2 style={{ fontSize: "2rem", margin: "0 0 8px", color: "#fff", fontFamily: "var(--bv-font-display)" }}>
                        {activeEvent.title}
                      </h2>
                      <p style={{ color: "rgba(243, 252, 247, 0.5)", fontSize: "0.9rem", margin: 0 }}>
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
                    <div className={styles.notice} style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px", padding: "16px 20px", marginBottom: "16px" }}>
                      <div>
                        <strong style={{ display: "block", color: "#fff", marginBottom: "4px" }}>Share Your Invite Portal Link 🔗</strong>
                        <span style={{ fontSize: "0.85rem", color: "rgba(243, 252, 247, 0.7)" }}>Send this link to families and friends so they can call you for meals:</span>
                      </div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <code style={{ background: "rgba(0,0,0,0.3)", padding: "6px 12px", borderRadius: "8px", border: "1px solid rgba(52, 211, 153, 0.15)", fontSize: "0.85rem" }}>
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
                  <div className={styles.panelAccent} style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px", padding: "16px 20px", marginBottom: "32px", background: "rgba(239, 68, 68, 0.03)", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                    <div>
                      <strong style={{ display: "block", color: "#f87171", marginBottom: "4px" }}>Feast ID & Private Dashboard Manager 🔑</strong>
                      <span style={{ fontSize: "0.85rem", color: "rgba(243, 252, 247, 0.7)" }}>Bookmark this link to access your dashboard passwordlessly on other devices:</span>
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <code style={{ background: "rgba(0,0,0,0.3)", padding: "6px 12px", borderRadius: "8px", border: "1px solid rgba(239, 68, 68, 0.25)", fontSize: "0.85rem", color: "#f87171" }}>
                        {activeEvent._id}
                      </code>
                      <CopyButton
                        content={typeof window !== "undefined" ? `${window.location.origin}/couple?id=${activeEvent._id}` : `${activeEvent._id}`}
                        successMessage="Private Manage Link copied successfully! 🔑"
                        style={{ padding: "0 14px", minHeight: "32px", fontSize: "0.8rem", border: "1px solid rgba(239, 68, 68, 0.3)", background: "rgba(239, 68, 68, 0.05)", color: "#f87171" }}
                      />
                    </div>
                  </div>

                  {/* Bookings & Visits Schedule */}
                  <h3 style={{ fontSize: "1.2rem", color: "#34d399", margin: "0 0 16px", fontFamily: "var(--bv-font-display)" }}>
                    Scheduled Home Visits 🍛
                  </h3>
                  {bookingsLoading ? (
                    <div style={{ color: "rgba(243, 252, 247, 0.6)", display: "flex", flexDirection: "column", gap: "10px" }}>
                      <Skeleton style={{ height: "40px" }} />
                      <Skeleton style={{ height: "40px" }} />
                    </div>
                  ) : bookings.length === 0 ? (
                    <div style={{ color: "rgba(243, 252, 247, 0.5)", fontStyle: "italic", border: "1px dashed rgba(255,255,255,0.06)", borderRadius: "12px", padding: "20px", textAlign: "center", marginBottom: "32px" }}>
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
                          const isMasked = b.venue?.address?.includes("Masked");
                          const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.venue?.address || "")}`;
                          const mealLabel = getMealLabel(b.startAt);

                          return (
                            <TableRow key={b._id}>
                              <TableCell style={{ fontWeight: 600 }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                  <span style={{ color: "#fff" }}>{b.venue?.name || "Host Family"}</span>
                                  {b.venue?.phone && (
                                    <span style={{ fontSize: "0.8rem", color: "rgba(243, 252, 247, 0.5)" }}>
                                      📞 {b.venue.phone}
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                  <span style={{ color: "#34d399", fontWeight: 600 }}>{mealLabel}</span>
                                  <span style={{ fontSize: "0.8rem", color: "rgba(243, 252, 247, 0.6)" }}>
                                    {new Date(b.startAt).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell style={{ maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                <span style={{ fontSize: "0.85rem", color: isMasked ? "rgba(243, 252, 247, 0.45)" : "#fff" }}>
                                  {b.venue?.address || "Address undisclosed"}
                                </span>
                              </TableCell>
                              <TableCell>
                                {b.specialRequests ? (
                                  <span style={{ fontSize: "0.85rem", fontStyle: "italic", color: "rgba(243, 252, 247, 0.75)" }}>
                                    "{b.specialRequests}"
                                  </span>
                                ) : (
                                  <span style={{ color: "rgba(243, 252, 247, 0.35)", fontSize: "0.8rem" }}>None</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {!isMasked && b.venue?.address ? (
                                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={styles.secondaryButton} style={{ textDecoration: "none", fontSize: "0.75rem", padding: "6px 12px", minHeight: "30px", background: "rgba(52, 211, 153, 0.05)", border: "1px solid rgba(52, 211, 153, 0.2)", color: "#34d399" }}>
                                    🗺️ Maps
                                  </a>
                                ) : (
                                  <span style={{ fontSize: "0.75rem", color: "rgba(243, 252, 247, 0.45)", fontStyle: "italic" }}>
                                    Revealed 24h prior 🔒
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}

                  {/* Manual Slot Blocking Calendar */}
                  <h3 style={{ fontSize: "1.2rem", color: "#34d399", margin: "24px 0 16px", fontFamily: "var(--bv-font-display)" }}>
                    Couple's Calendar & Date Blocking Manager 📅
                  </h3>
                  <p style={{ color: "rgba(243, 252, 247, 0.6)", fontSize: "0.85rem", marginBottom: "16px" }}>
                    Click "Block Slot" on any open Lunch or Dinner block to prevent families from reserving it. Ideal for rest or private trips!
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "12px" }}>
                    {slots.map((s) => {
                      const startTime = new Date(s.startAt);
                      const meal = getMealLabel(s.startAt);
                      const isBooked = bookings.some(b => new Date(b.startAt).getTime() === startTime.getTime());
                      const isBlockedByRule = s.status === "blocked" || rules.some(
                        r => r.ruleType === "specific_date" && 
                             r.date === startTime.toLocaleDateString("en-CA") && 
                             r.isBlocked
                      );

                      return (
                        <div
                          key={s._id}
                          style={{
                            padding: "16px",
                            borderRadius: "14px",
                            background: isBooked ? "rgba(16, 185, 129, 0.05)" : isBlockedByRule ? "rgba(239, 68, 68, 0.03)" : "rgba(255,255,255,0.02)",
                            border: isBooked ? "1px solid rgba(16, 185, 129, 0.25)" : isBlockedByRule ? "1px solid rgba(239, 68, 68, 0.25)" : "1px solid rgba(255,255,255,0.06)",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            gap: "12px"
                          }}
                        >
                          <div>
                            <strong style={{ display: "block", color: isBooked ? "#34d399" : isBlockedByRule ? "#f87171" : "#fff", fontSize: "0.95rem" }}>
                              {meal}
                            </strong>
                            <span style={{ display: "block", fontSize: "0.8rem", color: "rgba(243, 252, 247, 0.7)" }}>
                              {startTime.toLocaleDateString([], { month: "short", day: "numeric" })}
                            </span>
                            <span style={{ display: "block", fontSize: "0.75rem", color: "rgba(243, 252, 247, 0.45)" }}>
                              {startTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                            </span>
                          </div>

                          <div>
                            {isBooked ? (
                              <span style={{ fontSize: "0.8rem", color: "#34d399", fontWeight: 600 }}>
                                Reserved 🍛
                              </span>
                            ) : isBlockedByRule ? (
                              <button
                                disabled={actionLoading === s._id}
                                onClick={() => handleUnblockSlot(s)}
                                style={{
                                  width: "100%",
                                  padding: "6px 12px",
                                  borderRadius: "8px",
                                  border: "1px solid rgba(52, 211, 153, 0.3)",
                                  background: "rgba(52, 211, 153, 0.05)",
                                  color: "#34d399",
                                  fontSize: "0.8rem",
                                  cursor: "pointer"
                                }}
                              >
                                {actionLoading === s._id ? "Opening..." : "🔓 Unblock Slot"}
                              </button>
                            ) : (
                              <button
                                disabled={actionLoading === s._id}
                                onClick={() => handleBlockSlot(s)}
                                style={{
                                  width: "100%",
                                  padding: "6px 12px",
                                  borderRadius: "8px",
                                  border: "1px solid rgba(239, 68, 68, 0.3)",
                                  background: "rgba(239, 68, 68, 0.05)",
                                  color: "#f87171",
                                  fontSize: "0.8rem",
                                  cursor: "pointer"
                                }}
                              >
                                {actionLoading === s._id ? "Blocking..." : "🚫 Block Slot"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </SidebarProvider>
  );
}
