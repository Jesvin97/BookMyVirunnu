"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../../utils/api";
import styles from "../../page.module.css";
import { Progress } from "../../../components/ui/progress";
import { CopyButton } from "../../../components/ui/copy-button";
import { toast } from "../../../components/ui/sonner";

interface Particle {
  id: number;
  x: number;
  y: number;
  symbol: string;
}

const DIETARY_OPTIONS = [
  { value: "Vegetarian 🥬", label: "Vegetarian 🥬" },
  { value: "No Beef 🚫🥩", label: "No Beef 🚫🥩" },
  { value: "Halal 🥩", label: "Halal 🥩" },
  { value: "Eggless 🥚", label: "Eggless 🥚" },
  { value: "Nut Allergy 🥜", label: "Nut Allergy 🥜" },
  { value: "No Restrictions ✨", label: "No Restrictions ✨" }
];

export default function QuickCreatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState<{
    eventId: string;
    bookingUrl: string;
    dashboardUrl: string;
  } | null>(null);

  // Wizard Flow State
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [animatingOut, setAnimatingOut] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  // Form states
  const [husbandName, setHusbandName] = useState("");
  const [wifeName, setWifeName] = useState("");
  
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [restDateInput, setRestDateInput] = useState("");
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  
  const [phone, setPhone] = useState("");
  const [enableLunch, setEnableLunch] = useState(true);
  const [enableDinner, setEnableDinner] = useState(true);
  const [selectedDiet, setSelectedDiet] = useState<string[]>([]);

  const [copiedBooking, setCopiedBooking] = useState(false);
  const [copiedDashboard, setCopiedDashboard] = useState(false);
  const [customDiet, setCustomDiet] = useState("");

  // Celebratory particles splash
  const triggerParticles = (clientX: number, clientY: number) => {
    const symbols = ["💖", "❤️", "✨", "🌸", "💍", "🎉"];
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
    // Validate current step
    if (step === 1) {
      if (!husbandName.trim() || !wifeName.trim()) {
        setError("Please enter both Husband's and Wife's names.");
        return;
      }
      triggerParticles(e?.clientX || 0, e?.clientY || 0);
    }
    if (step === 2) {
      if (!startDate || !endDate) {
        setError("Please select both start and end dates.");
        return;
      }
      if (new Date(endDate) <= new Date(startDate)) {
        setError("End date must be after the start date.");
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

  const toggleDietary = (val: string) => {
    if (val === "No Restrictions ✨") {
      setSelectedDiet(["No Restrictions ✨"]);
    } else {
      let updated = selectedDiet.filter((d) => d !== "No Restrictions ✨");
      if (updated.includes(val)) {
        updated = updated.filter((d) => d !== val);
      } else {
        updated.push(val);
      }
      setSelectedDiet(updated);
    }
  };

  const addRestDate = () => {
    if (!restDateInput) return;
    if (blockedDates.includes(restDateInput)) {
      setError("This date is already blocked.");
      return;
    }
    setError("");
    setBlockedDates([...blockedDates, restDateInput]);
    setRestDateInput("");
  };

  const removeRestDate = (dateToRemove: string) => {
    setBlockedDates(blockedDates.filter((d) => d !== dateToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!enableLunch && !enableDinner) {
      setError("Please enable at least one feast meal block (Lunch or Dinner) for booking.");
      return;
    }

    setLoading(true);

    const coupleName = `${husbandName.trim()} & ${wifeName.trim()}`;
    const generatedTitle = `${coupleName}'s Feast Schedule 🍛`;

    const finalDietary = [...selectedDiet];
    if (customDiet.trim()) {
      finalDietary.push(customDiet.trim());
    }

    try {
      const response = await api.post<{
        token: string;
        user: { role: string; name: string };
        event: { id: string; title: string };
      }>("/auth/quick-register", {
        coupleName,
        title: generatedTitle,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        enableLunch,
        enableDinner,
        phone: phone || undefined,
        dietaryRestrictions: finalDietary,
        blockedDates: blockedDates
      });

      if (response && response.token && response.event) {
        localStorage.setItem("bv_token", response.token);
        localStorage.setItem("bv_user", JSON.stringify(response.user));

        setSuccessData({
          eventId: response.event.id,
          bookingUrl: `/book/${response.event.id}`,
          dashboardUrl: `/couple?id=${response.event.id}`
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to create feast calendar. Please check inputs.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: "booking" | "dashboard") => {
    const fullText = typeof window !== "undefined" ? `${window.location.origin}${text}` : text;
    try {
      await navigator.clipboard.writeText(fullText);
      if (type === "booking") {
        setCopiedBooking(true);
        setTimeout(() => setCopiedBooking(false), 2000);
      } else {
        setCopiedDashboard(true);
        setTimeout(() => setCopiedDashboard(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 18px",
    borderRadius: "14px",
    border: "1px solid rgba(52, 211, 153, 0.25)",
    background: "rgba(4, 9, 6, 0.5)",
    color: "#fff",
    outline: "none",
    fontSize: "1rem",
    transition: "border-color 200ms ease, box-shadow 200ms ease"
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "0.9rem",
    color: "rgba(243, 252, 247, 0.85)",
    fontWeight: 500
  };

  if (successData) {
    return (
      <main className={styles.shell} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 0" }}>
        <div className={styles.backgroundGlow} aria-hidden="true" />
        
        <div className={`${styles.panel} animate-scale-pop`} style={{ width: "min(560px, calc(100% - 32px))", padding: "clamp(20px, 6vw, 40px)", textAlign: "center" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "16px" }}>🎉</div>
          
          <h2 style={{ fontFamily: "var(--bv-font-display)", fontSize: "clamp(1.8rem, 6vw, 2.8rem)", margin: "0 0 12px", color: "#fff", lineHeight: 1.1 }}>
            Feast Slots Live!
          </h2>
          <p style={{ color: "rgba(243, 252, 247, 0.75)", fontSize: "1.05rem", margin: "0 0 32px", lineHeight: 1.5 }}>
            Congratulations, {husbandName} & {wifeName}! Your post-wedding feast slots are now generated. Please save the links below:
          </p>

          <div style={{ display: "grid", gap: "24px", textAlign: "left", marginBottom: "32px" }}>
            
            {/* Booking Link */}
            <div style={{ background: "rgba(0, 0, 0, 0.3)", border: "1px solid rgba(52, 211, 153, 0.15)", borderRadius: "16px", padding: "18px 20px" }}>
              <strong style={{ display: "block", color: "#34d399", fontSize: "1rem", marginBottom: "6px" }}>
                Relative Booking Link 🔗
              </strong>
              <p style={{ fontSize: "0.85rem", color: "rgba(243, 252, 247, 0.6)", margin: "0 0 12px", lineHeight: 1.4 }}>
                Send this link directly to your family and relatives so they can book a slot and call you over for Sadhyas:
              </p>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", width: "100%", minWidth: 0 }}>
                <code style={{ flex: 1, minWidth: 0, background: "rgba(0, 0, 0, 0.4)", padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {typeof window !== "undefined" ? `${window.location.origin}${successData.bookingUrl}` : successData.bookingUrl}
                </code>
                <CopyButton
                  content={typeof window !== "undefined" ? `${window.location.origin}${successData.bookingUrl}` : successData.bookingUrl}
                  successMessage="Relative Booking Link copied successfully! 🍛"
                />
              </div>
            </div>

            {/* Dashboard Link */}
            <div style={{ background: "rgba(239, 68, 68, 0.03)", border: "1px solid rgba(239, 68, 68, 0.25)", borderRadius: "16px", padding: "18px 20px" }}>
              <strong style={{ display: "block", color: "#f87171", fontSize: "1rem", marginBottom: "6px" }}>
                Dashboard Manager Link (Private) 🔑
              </strong>
              <p style={{ fontSize: "0.85rem", color: "rgba(243, 252, 247, 0.6)", margin: "0 0 12px", lineHeight: 1.4 }}>
                Bookmark this link! Since there are no emails or passwords, you will need this specific link to manage your bookings and block rest days.
              </p>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", width: "100%", minWidth: 0 }}>
                <code style={{ flex: 1, minWidth: 0, background: "rgba(0, 0, 0, 0.4)", padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {typeof window !== "undefined" ? `${window.location.origin}${successData.dashboardUrl}` : successData.dashboardUrl}
                </code>
                <CopyButton
                  content={typeof window !== "undefined" ? `${window.location.origin}${successData.dashboardUrl}` : successData.dashboardUrl}
                  successMessage="Dashboard Manage Link copied successfully! 🔑"
                  style={{
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    background: "rgba(239, 68, 68, 0.05)",
                    color: "#f87171"
                  }}
                />
              </div>
            </div>

          </div>

          <div style={{
            padding: "14px 18px",
            background: "rgba(251, 191, 36, 0.08)",
            border: "1px solid rgba(251, 191, 36, 0.25)",
            borderRadius: "14px",
            color: "#fbbf24",
            fontSize: "0.9rem",
            lineHeight: 1.5,
            marginBottom: "32px",
            textAlign: "left"
          }}>
            <strong>⚠️ Important reminder:</strong> Please bookmark the dashboard link above right now! Anyone with that link can manage the wedding calendar.
          </div>

          <Link href="/couple" className={styles.primaryButton} style={{ textDecoration: "none", display: "block", width: "100%", textAlign: "center", border: 0, padding: "16px" }}>
            Go to Dashboard & View Feasts
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.shell} style={{ minHeight: "100vh", padding: "48px 0" }}>
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

      <header className={styles.hero} style={{ padding: "0 0 28px", maxWidth: "700px", margin: "0 auto", textAlign: "center" }}>
        <div className={styles.eyebrow} style={{ color: "#34d399", margin: "0 auto 8px" }}>Newlyweds Portal</div>
        <h1 style={{ fontFamily: "var(--bv-font-display)", fontSize: "2.8rem", margin: "8px 0 6px", color: "#fff" }}>
          Wedding Feast Planner
        </h1>
        <p style={{ color: "rgba(243, 252, 247, 0.65)", margin: 0 }}>
          Set up your available post-wedding Sadhya slots in 3 quick steps!
        </p>

        {/* Wizard progress tracker */}
        <Progress
          value={step === 1 ? 33 : step === 2 ? 66 : 100}
          style={{ width: "100%", maxWidth: "360px", margin: "24px auto 0" }}
        />
      </header>

      <section className={styles.section} style={{ maxWidth: "700px", margin: "0 auto", position: "relative" }}>
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

        <div className={`${styles.panel} ${animatingOut ? "animate-fade-out" : "animate-fade-in"}`} style={{ padding: "40px" }}>
          {step === 1 && (
            <div>
              <h2 style={{ fontFamily: "var(--bv-font-display)", fontSize: "2.2rem", color: "#34d399", margin: "0 0 8px", textAlign: "center" }}>
                Who are the happy newlyweds? 💖
              </h2>
              <p style={{ color: "rgba(243, 252, 247, 0.6)", fontSize: "0.95rem", textAlign: "center", marginBottom: "32px" }}>
                Enter your names to generate your custom feast calendar schedule.
              </p>

              <div style={{ display: "grid", gap: "24px", marginBottom: "36px" }}>
                <div style={{ display: "grid", gap: "8px" }}>
                  <label htmlFor="husbandName" style={labelStyle}>Husband's Name 🤵</label>
                  <input
                    id="husbandName"
                    type="text"
                    required
                    placeholder="e.g. Joyal"
                    value={husbandName}
                    onChange={(e) => {
                      setHusbandName(e.target.value);
                      if (e.target.value.length === 1) {
                        const hostUrl = process.env.NEXT_PUBLIC_API_URL 
                          ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, "") 
                          : "http://localhost:4000";
                        fetch(`${hostUrl}/health`).catch(() => {});
                      }
                    }}
                    style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = "#34d399"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(52, 211, 153, 0.25)"}
                  />
                </div>

                <div style={{ display: "grid", gap: "8px" }}>
                  <label htmlFor="wifeName" style={labelStyle}>Wife's Name 👰</label>
                  <input
                    id="wifeName"
                    type="text"
                    required
                    placeholder="e.g. Anjali"
                    value={wifeName}
                    onChange={(e) => setWifeName(e.target.value)}
                    style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = "#34d399"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(52, 211, 153, 0.25)"}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleStepTransition(2);
                      }
                    }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => handleStepTransition(2, e)}
                className={styles.primaryButton}
                style={{ width: "100%", border: 0, padding: "14px", fontSize: "1.05rem" }}
              >
                Continue to Availability ➔
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 style={{ fontFamily: "var(--bv-font-display)", fontSize: "2.2rem", color: "#34d399", margin: "0 0 8px", textAlign: "center" }}>
                When are you available for feasts? 📅
              </h2>
              <p style={{ color: "rgba(243, 252, 247, 0.6)", fontSize: "0.95rem", textAlign: "center", marginBottom: "32px" }}>
                Define the overall date range you are open to be invited to host family homes.
              </p>

              <div style={{ display: "grid", gap: "24px", marginBottom: "36px" }}>
                <div className={styles.formTwoCol}>
                  <div style={{ display: "grid", gap: "8px" }}>
                    <label style={labelStyle}>Available From</label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      style={inputStyle}
                      onFocus={(e) => e.target.style.borderColor = "#34d399"}
                      onBlur={(e) => e.target.style.borderColor = "rgba(52, 211, 153, 0.25)"}
                    />
                  </div>
                  <div style={{ display: "grid", gap: "8px" }}>
                    <label style={labelStyle}>Available Until</label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      style={inputStyle}
                      onFocus={(e) => e.target.style.borderColor = "#34d399"}
                      onBlur={(e) => e.target.style.borderColor = "rgba(52, 211, 153, 0.25)"}
                    />
                  </div>
                </div>

                <hr style={{ border: 0, borderTop: "1px solid rgba(52, 211, 153, 0.12)", margin: "8px 0" }} />

                {/* Rest Date Blocker */}
                <div style={{ display: "grid", gap: "8px" }}>
                  <label style={labelStyle}>Do you have any private rest dates? 🚫</label>
                  <p style={{ color: "rgba(243, 252, 247, 0.5)", fontSize: "0.82rem", margin: "0 0 6px" }}>
                    Add specific days (e.g. your honeymoon or rest days) you want to pre-block and completely hide from relatives.
                  </p>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <input
                      type="date"
                      value={restDateInput}
                      onChange={(e) => setRestDateInput(e.target.value)}
                      style={{ ...inputStyle, flex: 1 }}
                      onFocus={(e) => e.target.style.borderColor = "#34d399"}
                      onBlur={(e) => e.target.style.borderColor = "rgba(52, 211, 153, 0.25)"}
                    />
                    <button
                      type="button"
                      onClick={addRestDate}
                      style={{
                        padding: "0 18px",
                        borderRadius: "14px",
                        border: "1px solid rgba(52, 211, 153, 0.3)",
                        background: "rgba(52, 211, 153, 0.08)",
                        color: "#34d399",
                        fontWeight: 600,
                        fontSize: "0.9rem",
                        cursor: "pointer"
                      }}
                    >
                      + Block Date
                    </button>
                  </div>

                  {blockedDates.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px", padding: "12px", background: "rgba(239, 68, 68, 0.03)", border: "1px dashed rgba(239, 68, 68, 0.2)", borderRadius: "12px" }}>
                      {blockedDates.map((date) => (
                        <span
                          key={date}
                          className="animate-scale-pop"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 12px",
                            borderRadius: "99px",
                            background: "rgba(239, 68, 68, 0.12)",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            color: "#f87171",
                            fontSize: "0.8rem",
                            fontWeight: 600
                          }}
                        >
                          🚫 {new Date(date).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                          <button
                            type="button"
                            onClick={() => removeRestDate(date)}
                            style={{
                              border: 0,
                              background: "none",
                              color: "#f87171",
                              cursor: "pointer",
                              padding: 0,
                              fontSize: "0.95rem",
                              lineHeight: 1,
                              marginLeft: "4px"
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.wizardButtons}>
                <button
                  type="button"
                  onClick={() => handleStepTransition(1)}
                  className={styles.secondaryButton}
                  style={{ width: "100%", padding: "14px" }}
                >
                  ⬅ Back
                </button>
                <button
                  type="button"
                  onClick={(e) => handleStepTransition(3, e)}
                  className={styles.primaryButton}
                  style={{ width: "100%", border: 0, padding: "14px", fontSize: "1.05rem" }}
                >
                  Continue to Preferences ➔
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleSubmit}>
              <h2 style={{ fontFamily: "var(--bv-font-display)", fontSize: "2.2rem", color: "#34d399", margin: "0 0 8px", textAlign: "center" }}>
                Select Feast Settings 🍛
              </h2>
              <p style={{ color: "rgba(243, 252, 247, 0.6)", fontSize: "0.95rem", textAlign: "center", marginBottom: "32px" }}>
                Choose meal times, dietary preferences, and set contact details.
              </p>

              <div style={{ display: "grid", gap: "28px", marginBottom: "36px" }}>
                {/* Available Meals */}
                <div>
                  <label style={{ ...labelStyle, display: "block", marginBottom: "12px" }}>Available Meals 🕒</label>
                  <div className={styles.formTwoCol} style={{ gap: "14px" }}>
                    {/* Lunch */}
                    <button
                      type="button"
                      onClick={() => setEnableLunch(!enableLunch)}
                      style={{
                        padding: "16px",
                        borderRadius: "14px",
                        border: enableLunch ? "2px solid #34d399" : "1px solid rgba(255,255,255,0.08)",
                        background: enableLunch ? "rgba(52, 211, 153, 0.08)" : "rgba(255,255,255,0.02)",
                        color: enableLunch ? "#fff" : "rgba(243, 252, 247, 0.6)",
                        cursor: "pointer",
                        textAlign: "center",
                        transition: "all 200ms ease",
                        boxShadow: enableLunch ? "0 0 15px rgba(52, 211, 153, 0.25)" : "none",
                        transform: enableLunch ? "scale(1.02)" : "scale(1)"
                      }}
                    >
                      <strong style={{ display: "block", fontSize: "1rem", marginBottom: "4px" }}>Lunch (Sadhya) 🍛</strong>
                      <span style={{ fontSize: "0.78rem", opacity: 0.8 }}>12:00 PM - 3:00 PM</span>
                    </button>

                    {/* Dinner */}
                    <button
                      type="button"
                      onClick={() => setEnableDinner(!enableDinner)}
                      style={{
                        padding: "16px",
                        borderRadius: "14px",
                        border: enableDinner ? "2px solid #34d399" : "1px solid rgba(255,255,255,0.08)",
                        background: enableDinner ? "rgba(52, 211, 153, 0.08)" : "rgba(255,255,255,0.02)",
                        color: enableDinner ? "#fff" : "rgba(243, 252, 247, 0.6)",
                        cursor: "pointer",
                        textAlign: "center",
                        transition: "all 200ms ease",
                        boxShadow: enableDinner ? "0 0 15px rgba(52, 211, 153, 0.25)" : "none",
                        transform: enableDinner ? "scale(1.02)" : "scale(1)"
                      }}
                    >
                      <strong style={{ display: "block", fontSize: "1rem", marginBottom: "4px" }}>Dinner (Virunnu) 🍽️</strong>
                      <span style={{ fontSize: "0.78rem", opacity: 0.8 }}>7:00 PM - 10:00 PM</span>
                    </button>
                  </div>
                </div>

                <hr style={{ border: 0, borderTop: "1px solid rgba(52, 211, 153, 0.12)", margin: 0 }} />

                {/* Dietary Restrictions */}
                <div>
                  <label style={{ ...labelStyle, display: "block", marginBottom: "8px" }}>Newlyweds Dietary Preferences 🥗</label>
                  <p style={{ color: "rgba(243, 252, 247, 0.5)", fontSize: "0.82rem", margin: "0 0 14px" }}>
                    Select any food preferences/restrictions. Relatives will see this notice prominently when booking a slot!
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {DIETARY_OPTIONS.map((opt) => {
                      const isSelected = selectedDiet.includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => toggleDietary(opt.value)}
                          style={{
                            padding: "10px 16px",
                            borderRadius: "12px",
                            border: isSelected ? "2px solid #34d399" : "1px solid rgba(255,255,255,0.08)",
                            background: isSelected ? "rgba(52, 211, 153, 0.08)" : "rgba(255,255,255,0.02)",
                            color: isSelected ? "#fff" : "rgba(243, 252, 247, 0.7)",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 150ms ease",
                            boxShadow: isSelected ? "0 0 10px rgba(52, 211, 153, 0.15)" : "none",
                            transform: isSelected ? "scale(1.03)" : "scale(1)"
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ display: "grid", gap: "8px", marginTop: "16px" }}>
                    <label htmlFor="customDiet" style={{ fontSize: "0.85rem", color: "rgba(243, 252, 247, 0.75)", fontWeight: 500 }}>
                      Other Dietary Restrictions / Allergies (Optional)
                    </label>
                    <input
                      id="customDiet"
                      type="text"
                      placeholder="e.g. Lactose intolerant, Gluten-free, custom notes..."
                      value={customDiet}
                      onChange={(e) => setCustomDiet(e.target.value)}
                      style={inputStyle}
                      onFocus={(e) => e.target.style.borderColor = "#34d399"}
                      onBlur={(e) => e.target.style.borderColor = "rgba(52, 211, 153, 0.25)"}
                    />
                  </div>
                </div>

                <hr style={{ border: 0, borderTop: "1px solid rgba(52, 211, 153, 0.12)", margin: 0 }} />

                {/* Phone */}
                <div style={{ display: "grid", gap: "8px" }}>
                  <label htmlFor="phone" style={labelStyle}>Contact Number (Optional, for host relatives)</label>
                  <input
                    id="phone"
                    type="text"
                    placeholder="e.g. +91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = "#34d399"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(52, 211, 153, 0.25)"}
                  />
                </div>
              </div>

              <div className={styles.wizardButtons}>
                <button
                  type="button"
                  onClick={() => handleStepTransition(2)}
                  className={styles.secondaryButton}
                  style={{ width: "100%", padding: "14px" }}
                >
                  ⬅ Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={styles.primaryButton}
                  style={{ width: "100%", border: 0, padding: "14px", fontSize: "1.05rem", cursor: loading ? "not-allowed" : "pointer" }}
                >
                  {loading ? "Creating Feast Calendar..." : "Generate Available Slots ✨"}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
