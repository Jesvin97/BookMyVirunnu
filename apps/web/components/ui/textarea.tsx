"use client";

import React, { forwardRef } from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  isInvalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ isInvalid = false, style, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        style={{
          width: "100%",
          minHeight: "100px",
          padding: "14px 18px",
          borderRadius: "14px",
          border: isInvalid
            ? "1px solid rgba(239, 68, 68, 0.4)"
            : "1px solid rgba(52, 211, 153, 0.25)",
          background: "rgba(4, 9, 6, 0.5)",
          color: "#fff",
          outline: "none",
          fontSize: "1rem",
          fontFamily: "inherit",
          resize: "vertical",
          transition: "border-color 200ms ease, box-shadow 200ms ease",
          boxShadow: isInvalid ? "0 0 10px rgba(239, 68, 68, 0.1)" : "none",
          ...style
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = isInvalid ? "#f87171" : "#34d399";
          e.currentTarget.style.boxShadow = isInvalid
            ? "0 0 15px rgba(239, 68, 68, 0.25)"
            : "0 0 15px rgba(52, 211, 153, 0.25)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = isInvalid
            ? "rgba(239, 68, 68, 0.4)"
            : "rgba(52, 211, 153, 0.25)";
          e.currentTarget.style.boxShadow = isInvalid
            ? "0 0 10px rgba(239, 68, 68, 0.1)"
            : "none";
        }}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
