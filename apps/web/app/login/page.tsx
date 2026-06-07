"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../utils/api";
import styles from "../page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"password" | "feastId">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [eventId, setEventId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (activeTab === "password") {
        const response = await api.post<{ token: string; user: { role: string; name: string } }>(
          "/auth/login",
          { email, password }
        );

        if (response && response.token) {
          localStorage.setItem("bv_token", response.token);
          localStorage.setItem("bv_user", JSON.stringify(response.user));

          if (response.user.role === "couple" || response.user.role === "admin") {
            router.push("/couple");
          } else {
            router.push("/");
          }
        }
      } else {
        if (!eventId || eventId.trim().length !== 24) {
          throw new Error("Please enter a valid 24-character Feast ID.");
        }
        
        const response = await api.post<{ token: string; user: { role: string; name: string } }>(
          "/auth/access-id",
          { eventId: eventId.trim() }
        );

        if (response && response.token) {
          localStorage.setItem("bv_token", response.token);
          localStorage.setItem("bv_user", JSON.stringify(response.user));
          router.push("/couple");
        }
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.shell} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 0" }}>
      <div className={styles.backgroundGlow} aria-hidden="true" />
      
      <div className={styles.panel} style={{ width: "min(440px, calc(100% - 32px))", padding: "40px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div className={styles.eyebrow} style={{ marginBottom: "16px", color: "#8b9e6c" }}>Login</div>
          <h2 style={{ fontFamily: "var(--bv-font-display)", fontSize: "2.4rem", margin: "0 0 10px", color: "#8b9e6c" }}>
            Welcome back
          </h2>
          <p style={{ color: "#8b9e6c", margin: 0 }}>
            Enter your credentials to manage your virunnu slots
          </p>
        </div>

        {error && (
          <div style={{
            padding: "12px 16px",
            background: "rgba(239, 68, 68, 0.12)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            borderRadius: "12px",
            color: "#f87171",
            fontSize: "0.9rem",
            marginBottom: "24px",
            lineHeight: 1.5
          }}>
            {error}
          </div>
        )}

        {/* Toggle between Email Login and Feast ID Access */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          background: "rgba(4, 9, 6, 0.5)",
          border: "1px solid rgba(52, 211, 153, 0.15)",
          borderRadius: "14px",
          padding: "4px",
          marginBottom: "28px"
        }}>
          <button
            type="button"
            onClick={() => setActiveTab("password")}
            style={{
              padding: "10px",
              border: 0,
              borderRadius: "10px",
              background: activeTab === "password" ? "linear-gradient(135deg, #ffffff 0%, #e2fced 100%)" : "transparent",
              color: activeTab === "password" ? "#03200d" : "rgba(243, 252, 247, 0.75)",
              fontWeight: 600,
              fontSize: "0.9rem",
              cursor: "pointer",
              transition: "all 150ms ease"
            }}
          >
            Email Login
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("feastId")}
            style={{
              padding: "10px",
              border: 0,
              borderRadius: "10px",
              background: activeTab === "feastId" ? "linear-gradient(135deg, #ffffff 0%, #e2fced 100%)" : "transparent",
              color: activeTab === "feastId" ? "#03200d" : "rgba(243, 252, 247, 0.75)",
              fontWeight: 600,
              fontSize: "0.9rem",
              cursor: "pointer",
              transition: "all 150ms ease"
            }}
          >
            Feast ID Login 
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "20px" }}>
          {activeTab === "password" ? (
            <>
              <div style={{ display: "grid", gap: "8px" }}>
                <label htmlFor="email" style={{ fontSize: "0.85rem", color: "#8b9e6c", fontWeight: 500 }}>
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    border: "1px solid rgba(52, 211, 153, 0.2)",
                    background: "rgba(4, 9, 6, 0.4)",
                    color: "#fff",
                    outline: "none",
                    fontSize: "0.95rem",
                    transition: "border-color 200ms ease"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#34d399"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(52, 211, 153, 0.2)"}
                />
              </div>

              <div style={{ display: "grid", gap: "8px" }}>
                <label htmlFor="password" style={{ fontSize: "0.85rem", color: "#8b9e6c", fontWeight: 500 }}>
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    border: "1px solid rgba(52, 211, 153, 0.2)",
                    background: "rgba(4, 9, 6, 0.4)",
                    color: "#fff",
                    outline: "none",
                    fontSize: "0.95rem",
                    transition: "border-color 200ms ease"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#34d399"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(52, 211, 153, 0.2)"}
                />
              </div>
            </>
          ) : (
            <div style={{ display: "grid", gap: "8px" }}>
              <label htmlFor="eventId" style={{ fontSize: "0.85rem", color: "#8b9e6c", fontWeight: 500 }}>
                Wedding Feast ID 
              </label>
              <input
                id="eventId"
                type="text"
                required
                placeholder="e.g. 64a78be1..."
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  border: "1px solid rgba(52, 211, 153, 0.2)",
                  background: "rgba(4, 9, 6, 0.4)",
                  color: "#fff",
                  outline: "none",
                  fontSize: "0.95rem",
                  transition: "border-color 200ms ease"
                }}
                onFocus={(e) => e.target.style.borderColor = "#34d399"}
                onBlur={(e) => e.target.style.borderColor = "rgba(52, 211, 153, 0.2)"}
              />
              <span style={{ fontSize: "0.8rem", color: "#8b9e6c", marginTop: "4px" }}>
                Enter the unique 24-character Feast ID generated when you created your calendar.
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={styles.primaryButton}
            style={{ width: "100%", border: "0", cursor: loading ? "not-allowed" : "pointer", marginTop: "10px", color: "#fff" }}
          >
            {loading ? "Verifying..." : activeTab === "password" ? "Sign in to account" : "Access Feast Dashboard"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "28px", fontSize: "0.9rem", color: "#8b9e6c" }}>
          Don't have an account?{" "}
          <Link href="/register" style={{ color: "#34d399", fontWeight: 600, textDecoration: "none" }}>
            Register here
          </Link>
        </div>
      </div>
    </main>
  );
}
