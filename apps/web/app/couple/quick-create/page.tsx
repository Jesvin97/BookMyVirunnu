"use client";

import { useState, useEffect } from "react";
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
  const [step, setStep] = useState<number>(1);
  const [animatingOut, setAnimatingOut] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  // Form states
  const [husbandName, setHusbandName] = useState("");
  const [wifeName, setWifeName] = useState("");
  
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [restDateInput, setRestDateInput] = useState("");
  const [restDateEnd, setRestDateEnd] = useState("");
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  
  const [phone, setPhone] = useState("");
  const [enableBreakfast, setEnableBreakfast] = useState(false);
  const [enableLunch, setEnableLunch] = useState(false);
  const [enableDinner, setEnableDinner] = useState(false);
  const [selectedDiet, setSelectedDiet] = useState<string[]>([]);

  const [copiedBooking, setCopiedBooking] = useState(false);
  const [copiedDashboard, setCopiedDashboard] = useState(false);
  const [customDiet, setCustomDiet] = useState("");

  const [backendConnected, setBackendConnected] = useState(false);
  const [pinging, setPinging] = useState(false);

  // Celebratory particles splash
  const triggerParticles = (clientX: number, clientY: number) => {
    const symbols = ["✨", "🌸", "💍", "🎉", "🌾", "🍛"];
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

  useEffect(() => {
    if (step === 2 && !backendConnected && !pinging) {
      setPinging(true);
      const healthUrl = typeof window !== "undefined"
        ? "/proxy-health"
        : (() => {
            const hostUrl = process.env.NEXT_PUBLIC_API_URL 
              ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, "") 
              : "http://localhost:4000";
            return `${hostUrl}/health`;
          })();

      const checkConnection = async () => {
        try {
          const res = await fetch(healthUrl);
          if (res.ok) {
            setBackendConnected(true);
            setPinging(false);
            toast.success("Connection to backend established! 🌿");
            return;
          }
        } catch (err) {
          console.error("Backend ping failed, retrying...", err);
        }
        setTimeout(checkConnection, 3000);
      };
      checkConnection();
    }
  }, [step, backendConnected, pinging]);

  const handleStepTransition = (nextStep: number, e?: React.MouseEvent) => {
    // Validate current step
    if (step === 1 && nextStep > 1) {
      if (!husbandName.trim() || !wifeName.trim()) {
        setError("Please enter both Husband's and Wife's names.");
        return;
      }
    }
    if (step === 2 && nextStep > 2) {
      if (!startDate || !endDate) {
        setError("Please select both start and end dates.");
        return;
      }
      if (new Date(endDate) <= new Date(startDate)) {
        setError("End date must be after the start date.");
        return;
      }
    }
    if (step === 4 && nextStep > 4) {
      if (!enableBreakfast && !enableLunch && !enableDinner) {
        setError("Please enable at least one feast meal block (Breakfast, Lunch or Dinner).");
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
    setError("");

    let datesToAdd = [restDateInput];
    
    if (restDateEnd) {
      const start = new Date(restDateInput);
      const end = new Date(restDateEnd);
      
      if (end < start) {
        setError("End date must be on or after the start date.");
        return;
      }
      
      datesToAdd = [];
      const current = new Date(start);
      while (current <= end) {
        datesToAdd.push(current.toISOString().split("T")[0]);
        current.setDate(current.getDate() + 1);
      }
    }

    const newBlocks = [...blockedDates];
    let addedAny = false;
    
    datesToAdd.forEach(d => {
      if (!newBlocks.includes(d)) {
        newBlocks.push(d);
        addedAny = true;
      }
    });

    if (!addedAny) {
      setError(datesToAdd.length === 1 ? "This date is already blocked." : "All dates in this range are already blocked.");
      return;
    }

    newBlocks.sort();
    
    setBlockedDates(newBlocks);
    setRestDateInput("");
    setRestDateEnd("");
  };

  const removeRestDate = (dateToRemove: string) => {
    setBlockedDates(blockedDates.filter((d) => d !== dateToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!enableBreakfast && !enableLunch && !enableDinner) {
      setError("Please enable at least one feast meal block (Breakfast, Lunch or Dinner) for booking.");
      return;
    }
    
    if (!phone.trim()) {
      setError("Contact number is required.");
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
        enableBreakfast,
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

  // Progressive Sadhya progress calculation
  let progressPercent = 0;
  let progressText = "";

  if (step === 1) {
    if (husbandName.trim() && wifeName.trim()) {
      progressPercent = 16;
      progressText = "Banana chips came...";
    } else if (husbandName.trim()) {
      progressPercent = 8;
      progressText = "Placing a banana leaf...";
    } else {
      progressPercent = 0;
      progressText = "Preparing the feast hall...";
    }
  } else if (step === 2) {
    if (startDate && endDate) {
      progressPercent = 33;
      progressText = "Pickles placed...";
    } else {
      progressPercent = 16;
      progressText = "Banana chips came...";
    }
  } else if (step === 3) {
    progressPercent = 50;
    progressText = "Papad came...";
  } else if (step === 4) {
    if (enableBreakfast || enableLunch || enableDinner) {
      progressPercent = 66;
      progressText = "Kootans came in...";
    } else {
      progressPercent = 50;
      progressText = "Papad came...";
    }
  } else if (step === 5) {
    progressPercent = 83;
    progressText = "Rice came...";
  } else if (step === 6) {
    if (phone.trim().length >= 10) {
      progressPercent = 100;
      progressText = "Sambar came!";
    } else {
      progressPercent = 90;
      progressText = "Rice came...";
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 18px",
    borderRadius: "14px",
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#000",
    outline: "none",
    fontSize: "1rem",
    transition: "border-color 200ms ease, box-shadow 200ms ease"
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "0.9rem",
    color: "#000",
    fontWeight: 500
  };

  if (successData) {
    return (
      <main className={styles.shell} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 0" }}>
        <div className={styles.backgroundGlow} aria-hidden="true" />
        
        <div className={`${styles.panel} animate-scale-pop`} style={{ width: "min(560px, calc(100% - 32px))", padding: "clamp(20px, 6vw, 40px)", textAlign: "center", minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h2 style={{ fontFamily: "var(--bv-font-display)", fontSize: "clamp(1.8rem, 6vw, 2.8rem)", margin: "0 0 12px", color: "var(--color-primary)", lineHeight: 1.1, textAlign: "center" }}>
            Feast Slots Live!
          </h2>
          <p style={{ color: "var(--color-primary)", fontSize: "1.05rem", margin: "0 0 32px", lineHeight: 1.5, textAlign: "center" }}>
            Congratulations, {husbandName} & {wifeName}! Your post-wedding feast slots are now generated. Please save the links below:
          </p>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "24px", textAlign: "center", marginBottom: "32px", width: "100%" }}>
            
            {/* Booking Link */}
            <div style={{ background: "#f9fafb", border: "1px solid #d1d5db", borderRadius: "16px", padding: "clamp(12px, 4vw, 20px)", width: "100%", overflowWrap: "anywhere", wordBreak: "break-word" }}>
              <strong style={{ display: "block", color: "var(--color-primary)", fontSize: "1rem", marginBottom: "12px", textAlign: "center" }}>
                Send this to relative
              </strong>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", width: "100%", justifyContent: "center" }}>
                <code style={{ flexGrow: 1, flexShrink: 1, flexBasis: "0%", minWidth: 0, background: "#fff", padding: "10px 14px", borderRadius: "8px", border: "1px solid #e5e7eb", color: "#000", fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {typeof window !== "undefined" ? `${window.location.origin}${successData.bookingUrl}` : successData.bookingUrl}
                </code>
                <CopyButton
                  content={typeof window !== "undefined" ? `${window.location.origin}${successData.bookingUrl}` : successData.bookingUrl}
                  successMessage="Relative Booking Link copied successfully! 🍛"
                />
              </div>
            </div>

            {/* Dashboard Link */}
            <div style={{ background: "#f9fafb", border: "1px solid #d1d5db", borderRadius: "16px", padding: "clamp(12px, 4vw, 20px)", width: "100%", overflowWrap: "anywhere", wordBreak: "break-word" }}>
              <strong style={{ display: "block", color: "var(--color-primary)", fontSize: "1rem", marginBottom: "12px", textAlign: "center" }}>
                This is for You
              </strong>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", width: "100%", justifyContent: "center" }}>
                <code style={{ flexGrow: 1, flexShrink: 1, flexBasis: "0%", minWidth: 0, background: "#fff", padding: "10px 14px", borderRadius: "8px", border: "1px solid #e5e7eb", color: "#000", fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {typeof window !== "undefined" ? `${window.location.origin}${successData.dashboardUrl}` : successData.dashboardUrl}
                </code>
                <CopyButton
                  content={typeof window !== "undefined" ? `${window.location.origin}${successData.dashboardUrl}` : successData.dashboardUrl}
                  successMessage="Dashboard Manage Link copied successfully! 🔑"
                />
              </div>
            </div>

          </div>

          <Link href="/couple" className={styles.primaryButton} style={{ textDecoration: "none", display: "block", width: "100%", textAlign: "center", border: 0, padding: "16px" }}>
            Go to Dashboard & View Feasts
          </Link>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px", opacity: 0.35, fontSize: "0.8rem", color: "#34d399" }}>🌿</div>
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
        <div className={styles.eyebrow} style={{ color: "var(--color-primary-dark)", margin: "0 auto 8px" }}>Newlyweds Portal</div>
        <h1 style={{ fontFamily: "var(--bv-font-display)", fontSize: "2.8rem", margin: "8px 0 6px", color: "#000" }}>
          Wedding Feast Planner
        </h1>


        {/* Wizard progress tracker */}
        <Progress
          value={progressPercent}
          style={{ width: "100%", maxWidth: "360px", margin: "24px auto 0" }}
        />
        {progressText && (
          <div style={{ marginTop: "12px", fontSize: "0.9rem", color: "#34d399", fontWeight: 600, fontStyle: "italic" }} className="animate-pulse">
            {progressText}
          </div>
        )}
      </header>

      <section className={styles.section} style={{ maxWidth: "700px", margin: "0 auto", position: "relative", paddingTop: "16px" }}>
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
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <h2 style={{ fontFamily: "var(--bv-font-display)", fontSize: "clamp(1.6rem, 5vw, 2.2rem)", color: "#000", margin: "0 0 8px", textAlign: "center", whiteSpace: "nowrap" }}>
                Who are the newlyweds?
              </h2>
              <p style={{ color: "#000", fontSize: "0.95rem", textAlign: "center", marginBottom: "32px", maxWidth: "80%" }}>
                Enter your names to generate your custom feast calendar schedule.
              </p>

              <div style={{ display: "grid", gap: "24px", marginBottom: "36px", width: "100%" }}>
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
                        const healthUrl = typeof window !== "undefined" ? "/proxy-health" : (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, "") + "/health" : "http://localhost:4000/health");
                        fetch(healthUrl).catch(() => {});
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
                    placeholder="sneha"
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
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 style={{ fontFamily: "var(--bv-font-display)", fontSize: "clamp(1.2rem, 4vw, 2.2rem)", color: "#000", margin: "0 0 8px", textAlign: "center", whiteSpace: "nowrap" }}>
                When are you available for feasts?
              </h2>
              <p style={{ color: "#000", fontSize: "0.95rem", textAlign: "center", marginBottom: "32px" }}>
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
                  disabled={!backendConnected}
                  onClick={(e) => handleStepTransition(3, e)}
                  className={styles.primaryButton}
                  style={{
                    flex: 1,
                    border: 0,
                    padding: "14px",
                    fontSize: "1.05rem",
                    cursor: !backendConnected ? "not-allowed" : "pointer",
                    opacity: !backendConnected ? 0.6 : 1
                  }}
                >
                  {backendConnected ? "Continue" : pinging ? "Connecting..." : "Awaiting..."}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <h2 style={{ fontFamily: "var(--bv-font-display)", fontSize: "clamp(1.2rem, 4vw, 2.2rem)", color: "#000", margin: "0 0 8px", textAlign: "center", whiteSpace: "nowrap" }}>
                Do you have any private rest dates?
              </h2>
              <p style={{ color: "#000", fontSize: "0.95rem", textAlign: "center", marginBottom: "32px", maxWidth: "80%" }}>
                Add specific days (e.g. your honeymoon or rest days) you want to pre-block and completely hide from relatives.
              </p>

              <div style={{ display: "grid", gap: "24px", marginBottom: "36px", width: "100%" }}>
                {/* Rest Date Blocker */}
                <div style={{ display: "grid", gap: "8px" }}>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    <input
                      type="date"
                      value={restDateInput}
                      onChange={(e) => setRestDateInput(e.target.value)}
                      style={{ ...inputStyle, flex: 1, minWidth: "130px" }}
                    />
                    <span style={{ color: "#000", fontWeight: 500 }}>to</span>
                    <input
                      type="date"
                      value={restDateEnd}
                      onChange={(e) => setRestDateEnd(e.target.value)}
                      style={{ ...inputStyle, flex: 1, minWidth: "130px" }}
                    />
                    <button
                      type="button"
                      onClick={addRestDate}
                      className={styles.primaryButton}
                      style={{ padding: "14px 18px", border: 0, height: "100%" }}
                    >
                      + Block
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
                  type="button"
                  onClick={(e) => handleStepTransition(4, e)}
                  className={styles.primaryButton}
                  style={{ flex: 1, border: 0, padding: "14px", fontSize: "1.05rem" }}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <h2 style={{ fontFamily: "var(--bv-font-display)", fontSize: "clamp(1.2rem, 4vw, 2.2rem)", color: "#000", margin: "0 0 8px", textAlign: "center", whiteSpace: "nowrap" }}>
                Select Feast Settings
              </h2>
              <p style={{ color: "#000", fontSize: "0.95rem", textAlign: "center", marginBottom: "32px", maxWidth: "80%" }}>
                Choose meal times you are available for.
              </p>

              <div style={{ display: "grid", gap: "28px", marginBottom: "36px", width: "100%" }}>
                {/* Available Meals */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <label style={{ ...labelStyle, display: "block", marginBottom: "12px", textAlign: "center" }}>Available Meals</label>
                  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "14px", width: "100%" }}>
                    {/* Breakfast */}
                    <button
                      type="button"
                      onClick={() => setEnableBreakfast(!enableBreakfast)}
                      style={{
                        padding: "16px",
                        borderRadius: "14px",
                        border: enableBreakfast ? "2px solid #34d399" : "1px solid #d1d5db",
                        background: enableBreakfast ? "rgba(52, 211, 153, 0.08)" : "#f9fafb",
                        color: enableBreakfast ? "#065f46" : "#000",
                        cursor: "pointer",
                        textAlign: "center",
                        transition: "all 200ms ease",
                        boxShadow: enableBreakfast ? "0 0 15px rgba(52, 211, 153, 0.25)" : "none",
                        transform: enableBreakfast ? "scale(1.02)" : "scale(1)",
                        flex: "1 1 100px"
                      }}
                    >
                      <strong style={{ display: "block", fontSize: "1rem" }}>Breakfast</strong>
                    </button>

                    {/* Lunch */}
                    <button
                      type="button"
                      onClick={() => setEnableLunch(!enableLunch)}
                      style={{
                        padding: "16px",
                        borderRadius: "14px",
                        border: enableLunch ? "2px solid #34d399" : "1px solid #d1d5db",
                        background: enableLunch ? "rgba(52, 211, 153, 0.08)" : "#f9fafb",
                        color: enableLunch ? "#065f46" : "#000",
                        cursor: "pointer",
                        textAlign: "center",
                        transition: "all 200ms ease",
                        boxShadow: enableLunch ? "0 0 15px rgba(52, 211, 153, 0.25)" : "none",
                        transform: enableLunch ? "scale(1.02)" : "scale(1)",
                        flex: "1 1 100px"
                      }}
                    >
                      <strong style={{ display: "block", fontSize: "1rem" }}>Lunch</strong>
                    </button>

                    {/* Dinner */}
                    <button
                      type="button"
                      onClick={() => setEnableDinner(!enableDinner)}
                      style={{
                        padding: "16px",
                        borderRadius: "14px",
                        border: enableDinner ? "2px solid #34d399" : "1px solid #d1d5db",
                        background: enableDinner ? "rgba(52, 211, 153, 0.08)" : "#f9fafb",
                        color: enableDinner ? "#065f46" : "#000",
                        cursor: "pointer",
                        textAlign: "center",
                        transition: "all 200ms ease",
                        boxShadow: enableDinner ? "0 0 15px rgba(52, 211, 153, 0.25)" : "none",
                        transform: enableDinner ? "scale(1.02)" : "scale(1)",
                        flex: "1 1 100px"
                      }}
                    >
                      <strong style={{ display: "block", fontSize: "1rem" }}>Dinner</strong>
                    </button>
                  </div>
                </div>
              </div>

              <div className={styles.wizardButtons} style={{ display: "flex", gap: "12px", flexDirection: "row" }}>
                <button
                  type="button"
                  onClick={() => handleStepTransition(3)}
                  className={styles.secondaryButton}
                  style={{ flex: 1, padding: "14px" }}
                >
                  ⬅ Back
                </button>
                <button
                  type="button"
                  onClick={(e) => handleStepTransition(5, e)}
                  className={styles.primaryButton}
                  style={{ flex: 1, border: 0, padding: "14px", fontSize: "1.05rem" }}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <h2 style={{ fontFamily: "var(--bv-font-display)", fontSize: "clamp(1.2rem, 4vw, 2.2rem)", color: "#000", margin: "0 0 8px", textAlign: "center", whiteSpace: "nowrap" }}>
                Newlyweds Dietary Preferences
              </h2>
              <p style={{ color: "#000", fontSize: "0.95rem", textAlign: "center", marginBottom: "32px", maxWidth: "80%" }}>
                Select any food preferences/restrictions. Relatives will see this notice prominently when booking a slot!
              </p>

              <div style={{ display: "grid", gap: "28px", marginBottom: "36px", width: "100%" }}>
                {/* Dietary Restrictions */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px" }}>
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
                            border: isSelected ? "2px solid #34d399" : "1px solid #d1d5db",
                            background: isSelected ? "rgba(52, 211, 153, 0.08)" : "#f9fafb",
                            color: isSelected ? "#065f46" : "#000",
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
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", marginTop: "16px", width: "100%" }}>
                    <label htmlFor="customDiet" style={{ fontSize: "0.85rem", color: "#000", fontWeight: 500 }}>
                      Other Dietary Restrictions / Allergies (Optional)
                    </label>
                    <input
                      id="customDiet"
                      type="text"
                      placeholder="e.g. Lactose intolerant, Gluten-free, custom notes..."
                      value={customDiet}
                      onChange={(e) => setCustomDiet(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.wizardButtons} style={{ display: "flex", gap: "12px", flexDirection: "row" }}>
                <button
                  type="button"
                  onClick={() => handleStepTransition(4)}
                  className={styles.secondaryButton}
                  style={{ flex: 1, padding: "14px" }}
                >
                  ⬅ Back
                </button>
                <button
                  type="button"
                  onClick={(e) => handleStepTransition(6, e)}
                  className={styles.primaryButton}
                  style={{ flex: 1, border: 0, padding: "14px", fontSize: "1.05rem" }}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 6 && (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <h2 style={{ fontFamily: "var(--bv-font-display)", fontSize: "clamp(1.6rem, 5vw, 2.2rem)", color: "#000", margin: "0 0 8px", textAlign: "center", whiteSpace: "nowrap" }}>
                Contact Number
              </h2>
              <p style={{ color: "#000", fontSize: "0.95rem", textAlign: "center", marginBottom: "32px", maxWidth: "80%" }}>
                Provide a number for your relatives to contact you regarding the feast.
              </p>

              <div style={{ display: "grid", gap: "28px", marginBottom: "36px", width: "100%" }}>
                {/* Phone */}
                <div style={{ display: "grid", gap: "8px" }}>
                  <label htmlFor="phone" style={labelStyle}>Contact Number</label>
                  <input
                    id="phone"
                    type="text"
                    required
                    placeholder="e.g. +91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div className={styles.wizardButtons} style={{ display: "flex", gap: "12px", flexDirection: "row", width: "100%" }}>
                <button
                  type="button"
                  onClick={() => handleStepTransition(5)}
                  className={styles.secondaryButton}
                  style={{ flex: 1, padding: "14px" }}
                >
                  ⬅ Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={styles.primaryButton}
                  style={{ flex: 1, border: 0, padding: "14px", fontSize: "1.05rem", cursor: loading ? "not-allowed" : "pointer" }}
                >
                  {loading ? "Creating Feast Calendar..." : "Generate Link"}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
