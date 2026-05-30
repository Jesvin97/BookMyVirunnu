"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../utils/api";
import styles from "../page.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"couple" | "guest">("couple");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post<{ token: string; user: { role: string; name: string } }>(
        "/auth/register",
        {
          role,
          name,
          email,
          password
        }
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
    } catch (err: any) {
      setError(err.message || "Failed to register. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.shell} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 0" }}>
      <div className={styles.backgroundGlow} aria-hidden="true" />
      
      <div className={styles.panel} style={{ width: "min(460px, calc(100% - 32px))", padding: "40px" }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div className={styles.eyebrow} style={{ marginBottom: "16px" }}>Register</div>
          <h2 style={{ fontFamily: "var(--bv-font-display)", fontSize: "2.4rem", margin: "0 0 10px", color: "#fff" }}>
            Create account
          </h2>
          <p style={{ color: "rgba(243, 252, 247, 0.65)", margin: 0 }}>
            Choose your role and set up your virunnu portal
          </p>
        </div>

        {/* Role Toggle Selector */}
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
            onClick={() => setRole("couple")}
            style={{
              padding: "10px",
              border: 0,
              borderRadius: "10px",
              background: role === "couple" ? "linear-gradient(135deg, #ffffff 0%, #e2fced 100%)" : "transparent",
              color: role === "couple" ? "#03200d" : "rgba(243, 252, 247, 0.75)",
              fontWeight: 600,
              fontSize: "0.9rem",
              cursor: "pointer",
              transition: "all 150ms ease"
            }}
          >
            I am a Host (Couple)
          </button>
          <button
            type="button"
            onClick={() => setRole("guest")}
            style={{
              padding: "10px",
              border: 0,
              borderRadius: "10px",
              background: role === "guest" ? "linear-gradient(135deg, #ffffff 0%, #e2fced 100%)" : "transparent",
              color: role === "guest" ? "#03200d" : "rgba(243, 252, 247, 0.75)",
              fontWeight: 600,
              fontSize: "0.9rem",
              cursor: "pointer",
              transition: "all 150ms ease"
            }}
          >
            I am a Guest
          </button>
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

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "20px" }}>
          <div style={{ display: "grid", gap: "8px" }}>
            <label htmlFor="name" style={{ fontSize: "0.85rem", color: "rgba(243, 252, 247, 0.8)", fontWeight: 500 }}>
              Full name
            </label>
            <input
              id="name"
              type="text"
              required
              placeholder={role === "couple" ? "Joyal & Anjali" : "Your Name"}
              value={name}
              onChange={(e) => setName(e.target.value)}
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
            <label htmlFor="email" style={{ fontSize: "0.85rem", color: "rgba(243, 252, 247, 0.8)", fontWeight: 500 }}>
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
            <label htmlFor="password" style={{ fontSize: "0.85rem", color: "rgba(243, 252, 247, 0.8)", fontWeight: 500 }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              placeholder="Min. 8 characters"
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

          <button
            type="submit"
            disabled={loading}
            className={styles.primaryButton}
            style={{ width: "100%", border: "0", cursor: loading ? "not-allowed" : "pointer", marginTop: "10px" }}
          >
            {loading ? "Creating account..." : "Register and get started"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "28px", fontSize: "0.9rem", color: "rgba(243, 252, 247, 0.6)" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "#34d399", fontWeight: 600, textDecoration: "none" }}>
            Login here
          </Link>
        </div>
      </div>
    </main>
  );
}
