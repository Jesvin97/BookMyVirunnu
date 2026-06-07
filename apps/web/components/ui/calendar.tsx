"use client";

import React, { useState } from "react";

interface CalendarProps {
  mode?: "single";
  selected?: Date | null;
  onSelect?: (date: Date) => void;
  className?: string;
  availableDates?: string[]; // "Sun, Jun 9, 2026" formats to match page.tsx logic
}

export function Calendar({ selected, onSelect, className, availableDates = [] }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    return selected ? new Date(selected.getFullYear(), selected.getMonth(), 1) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  });

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
  }

  const isSelected = (day: Date | null) => {
    if (!day || !selected) return false;
    return day.getDate() === selected.getDate() &&
           day.getMonth() === selected.getMonth() &&
           day.getFullYear() === selected.getFullYear();
  };

  const isAvailable = (day: Date | null) => {
    if (!day) return false;
    const dateStr = day.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    });
    return availableDates.includes(dateStr);
  };

  return (
    <div style={{ padding: "16px", background: "#fff", borderRadius: "12px", border: "1px solid #d1d5db", width: "320px", margin: "0 auto", fontFamily: "inherit" }} className={className}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <button type="button" onClick={prevMonth} style={{ background: "none", border: "none", cursor: "pointer", padding: "8px", borderRadius: "8px" }}>
          &larr;
        </button>
        <span style={{ fontWeight: 600, fontSize: "1.1rem" }}>
          {currentMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </span>
        <button type="button" onClick={nextMonth} style={{ background: "none", border: "none", cursor: "pointer", padding: "8px", borderRadius: "8px" }}>
          &rarr;
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", textAlign: "center", marginBottom: "8px" }}>
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
          <div key={d} style={{ fontSize: "0.8rem", color: "#6b7280", fontWeight: 600 }}>{d}</div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", textAlign: "center" }}>
        {days.map((day, i) => {
          if (!day) return <div key={i} />;
          const selectedFlag = isSelected(day);
          const availableFlag = isAvailable(day);

          return (
            <button
              key={i}
              type="button"
              disabled={!availableFlag}
              onClick={() => {
                if (onSelect) onSelect(day);
              }}
              style={{
                padding: "8px",
                borderRadius: "8px",
                border: selectedFlag ? "2px solid #34d399" : "1px solid transparent",
                background: selectedFlag ? "rgba(52, 211, 153, 0.1)" : availableFlag ? "#f3fcf7" : "transparent",
                color: availableFlag ? (selectedFlag ? "#065f46" : "#000") : "#d1d5db",
                cursor: availableFlag ? "pointer" : "not-allowed",
                fontWeight: selectedFlag ? 700 : 500,
                fontSize: "0.9rem",
                transition: "all 0.2s"
              }}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
