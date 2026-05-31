"use client";

import React from "react";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  label?: string;
  showValue?: boolean;
}

export function Progress({
  value,
  label,
  showValue = false,
  className,
  style,
  ...props
}: ProgressProps) {
  const percent = Math.min(Math.max(value, 0), 100);

  return (
    <div
      className={className}
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        ...style
      }}
      {...props}
    >
      {(label || showValue) && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.85rem",
            color: "rgba(243, 252, 247, 0.85)",
            fontWeight: 500
          }}
        >
          {label && <span>{label}</span>}
          {showValue && <span style={{ color: "#34d399", fontWeight: 600 }}>{percent}%</span>}
        </div>
      )}
      <div
        style={{
          width: "100%",
          height: "6px",
          background: "rgba(255, 255, 255, 0.06)",
          borderRadius: "99px",
          overflow: "hidden",
          position: "relative",
          border: "1px solid rgba(255, 255, 255, 0.04)"
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${percent}%`,
            background: "linear-gradient(90deg, #34d399 0%, #059669 100%)",
            borderRadius: "99px",
            transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "0 0 10px rgba(52, 211, 153, 0.6)"
          }}
        />
      </div>
    </div>
  );
}
