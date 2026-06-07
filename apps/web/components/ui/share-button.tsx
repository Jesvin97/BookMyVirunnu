"use client";

import React, { useState } from "react";
import { toast } from "./sonner";

export interface ShareButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  url: string;
  title: string;
  text?: string;
  children?: React.ReactNode;
}

export function ShareButton({
  url,
  title,
  text = "Join us for our post-wedding feast celebrations!",
  children,
  style,
  ...props
}: ShareButtonProps) {
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title,
      text,
      url: typeof window !== "undefined" ? `${window.location.origin}${url}` : url
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      setSharing(true);
      try {
        await navigator.share(shareData);
        toast.success("Shared successfully!");
      } catch (err) {
        console.log("User cancelled sharing or native share error:", err);
      } finally {
        setSharing(false);
      }
    } else {
      // Graceful fallback to copying url
      try {
        await navigator.clipboard.writeText(shareData.url);
        toast.success("Link copied to clipboard for sharing! ");
      } catch (err) {
        console.error("Fallback sharing failed:", err);
        toast.error("Unable to share or copy link.");
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={sharing}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "8px 14px",
        borderRadius: "10px",
        border: "1px solid rgba(52, 211, 153, 0.3)",
        background: "rgba(52, 211, 153, 0.05)",
        color: "#34d399",
        fontSize: "0.85rem",
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.2s ease",
        gap: "6px",
        outline: "none",
        ...style
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(52, 211, 153, 0.12)";
        e.currentTarget.style.boxShadow = "0 0 10px rgba(52, 211, 153, 0.2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(52, 211, 153, 0.05)";
        e.currentTarget.style.boxShadow = "none";
      }}
      {...props}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          transform: sharing ? "rotate(30deg) scale(0.9)" : "none",
          transition: "transform 0.2s ease"
        }}
      >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
      <span>{children || "Share"}</span>
    </button>
  );
}
