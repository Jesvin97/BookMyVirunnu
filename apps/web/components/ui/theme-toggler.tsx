"use client";

import React, { useEffect, useState } from "react";

export function ThemeTogglerButton() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    // Read theme from localStorage or document class
    const savedTheme = localStorage.getItem("bv_theme") as "dark" | "light" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("bv_theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);

    // Apply simple visual variables change
    if (nextTheme === "light") {
      document.body.style.background = "#f4fcf8";
      document.body.style.color = "#040906";
    } else {
      document.body.style.background = "#040906";
      document.body.style.color = "#f3fcf7";
    }
  };

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle Theme Mode"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "8px 12px",
        borderRadius: "10px",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        background: "rgba(255, 255, 255, 0.03)",
        color: "#fff",
        cursor: "pointer",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        outline: "none"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(52, 211, 153, 0.08)";
        e.currentTarget.style.borderColor = "rgba(52, 211, 153, 0.25)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
      }}
    >
      <span
        style={{
          display: "flex",
          transform: theme === "dark" ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
        }}
      >
        {theme === "dark" ? (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#34d399"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        ) : (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#059669"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </span>
    </button>
  );
}
