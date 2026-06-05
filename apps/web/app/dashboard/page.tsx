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
import { ThemeTogglerButton } from "../../components/ui/theme-toggler";

interface DomainUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
}

interface BookingGuestDetails {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

interface DashboardBooking {
  _id: string;
  startAt: string;
  endAt: string;
  partySize: number;
  status: string;
  specialRequests?: string;
  guest: BookingGuestDetails;
}

interface DashboardEvent {
  _id: string;
  title: string;
  status: string;
  startDate: string;
  endDate: string;
  bookings: DashboardBooking[];
}

interface CoupleDashboardSummary {
  couple: DomainUser;
  events: DashboardEvent[];
}

interface AdminDashboardData {
  couples: CoupleDashboardSummary[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const checkAuthAndFetch = async () => {
        const token = localStorage.getItem("bv_token");
        const savedUser = localStorage.getItem("bv_user");

        if (!token || !savedUser) {
          router.push("/login");
          return;
        }

        try {
          const parsedUser = JSON.parse(savedUser);
          if (parsedUser.role !== "admin") {
            router.push("/");
            return;
          }

          setUser(parsedUser);
          
          const response = await api.get<AdminDashboardData>("/admin/dashboard");
          if (response) {
            setData(response);
          }
        } catch (err) {
          console.error("Error fetching admin dashboard:", err);
        } finally {
          setLoading(false);
        }
      };

      checkAuthAndFetch();
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("bv_token");
    localStorage.removeItem("bv_user");
    router.push("/login");
  };

  const getMealLabel = (startAtStr: string) => {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      hour12: false
    });
    const hourStr = formatter.format(new Date(startAtStr));
    const hour = parseInt(hourStr, 10);
    
    if (hour < 12) return "Breakfast";
    if (hour < 16) return "Lunch";
    return "Dinner";
  };

  if (loading) {
    return (
      <main className={styles.shell} style={{ minHeight: "100vh", padding: "48px 24px" }}>
        <div className={styles.backgroundGlow} aria-hidden="true" />
        <header className={styles.hero} style={{ padding: "0 0 40px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "24px" }}>
          <div>
            <Skeleton style={{ width: "160px", height: "16px", marginBottom: "12px" }} />
            <Skeleton style={{ width: "380px", height: "48px", marginBottom: "12px" }} />
          </div>
        </header>
      </main>
    );
  }

  return (
    <div style={{ background: "#fff", minHeight: "100vh", display: "flex", flexDirection: "column", width: "100%" }}>
      <main className={styles.shell} style={{ flex: 1, minHeight: "100vh", padding: "48px 24px", overflowY: "auto", position: "relative" }}>
        <div className={styles.backgroundGlow} aria-hidden="true" />

        <header className={styles.hero} style={{ padding: "0 0 40px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "24px" }}>
          <div>
            <div className={styles.eyebrow} style={{ color: "var(--color-primary)" }}>Platform Administration</div>
            <h1 style={{ fontFamily: "var(--bv-font-display)", fontSize: "3rem", margin: "16px 0 8px", color: "#000" }}>
              Admin Full View 👑
            </h1>
            <p style={{ color: "#000", margin: 0 }}>
              Overview of all couples, events, and bookings on the platform.
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
          {!data || data.couples.length === 0 ? (
            <div className={styles.panel} style={{ textAlign: "center", padding: "64px 32px" }}>
              <h3 style={{ fontSize: "1.5rem", margin: "0 0 12px", color: "var(--color-primary)" }}>No Couples Registered Yet</h3>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
              {data.couples.map((coupleSummary) => (
                <div key={coupleSummary.couple._id} className={styles.panel} style={{ padding: "32px", marginBottom: "20px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "16px", marginBottom: "20px" }}>
                    <div>
                      <h2 style={{ fontSize: "2rem", margin: "0 0 8px", color: "#000", fontFamily: "var(--bv-font-display)" }}>
                        {coupleSummary.couple.name}
                      </h2>
                      <p style={{ color: "#000", fontSize: "0.9rem", margin: 0 }}>
                        {coupleSummary.couple.email} {coupleSummary.couple.phone && `| ${coupleSummary.couple.phone}`}
                      </p>
                    </div>
                  </div>

                  <hr style={{ border: "0", borderTop: "1px solid rgba(52, 211, 153, 0.12)", margin: "24px 0" }} />

                  {coupleSummary.events.length === 0 ? (
                    <p style={{ color: "#000", fontStyle: "italic" }}>No events created by this couple.</p>
                  ) : (
                    coupleSummary.events.map((event) => (
                      <div key={event._id} style={{ marginBottom: "24px" }}>
                        <h3 style={{ fontSize: "1.2rem", color: "#000", margin: "0 0 16px", fontFamily: "var(--bv-font-display)" }}>
                          Event: {event.title} <span style={{ fontSize: "0.9rem", fontWeight: "normal", color: "var(--color-primary)" }}>({event.status})</span>
                        </h3>
                        
                        {event.bookings.length === 0 ? (
                          <div style={{ color: "#000", fontStyle: "italic", border: "1px dashed #d1d5db", borderRadius: "12px", padding: "20px", textAlign: "center", marginBottom: "32px" }}>
                            No families have booked for this event.
                          </div>
                        ) : (
                          <Table style={{ marginBottom: "32px" }}>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Guest Family</TableHead>
                                <TableHead>Meal Details</TableHead>
                                <TableHead>Party Size</TableHead>
                                <TableHead>Special Requests</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {event.bookings.map((b) => {
                                const mealLabel = getMealLabel(b.startAt);

                                return (
                                  <TableRow key={b._id}>
                                    <TableCell style={{ fontWeight: 600 }}>
                                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                        <span style={{ color: "#000" }}>{b.guest.name}</span>
                                        <span style={{ fontSize: "0.8rem", color: "#000" }}>
                                          {b.guest.email}
                                        </span>
                                        {b.guest.phone && (
                                          <span style={{ fontSize: "0.8rem", color: "#000" }}>
                                            📞 {b.guest.phone}
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
                                    <TableCell>
                                      <span style={{ fontSize: "0.85rem", color: "#000" }}>
                                        {b.partySize} person(s)
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
                                      <span style={{ fontSize: "0.75rem", padding: "4px 8px", borderRadius: "12px", background: b.status === "confirmed" ? "rgba(52, 211, 153, 0.2)" : "#f3f4f6", color: b.status === "confirmed" ? "var(--color-primary)" : "#000" }}>
                                        {b.status}
                                      </span>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                    ))
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
