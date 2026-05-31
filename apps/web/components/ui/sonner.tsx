"use client";

import React, { useState, useEffect } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  type?: ToastType;
  description?: string;
}

let listeners: Array<(toasts: Toast[]) => void> = [];
let memoryToasts: Toast[] = [];

export const toast = (message: string, options?: { type?: ToastType; description?: string }) => {
  const id = Math.random().toString(36).substring(2, 9);
  const newToast: Toast = {
    id,
    message,
    type: options?.type || "info",
    description: options?.description
  };

  memoryToasts = [...memoryToasts, newToast];
  listeners.forEach((listener) => listener(memoryToasts));

  // Auto dismiss after 4 seconds
  setTimeout(() => {
    memoryToasts = memoryToasts.filter((t) => t.id !== id);
    listeners.forEach((listener) => listener(memoryToasts));
  }, 4000);

  return id;
};

toast.success = (message: string, description?: string) =>
  toast(message, { type: "success", description });

toast.error = (message: string, description?: string) =>
  toast(message, { type: "error", description });

toast.info = (message: string, description?: string) =>
  toast(message, { type: "info", description });

toast.warning = (message: string, description?: string) =>
  toast(message, { type: "warning", description });

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handleUpdate = (newToasts: Toast[]) => {
      setToasts(newToasts);
    };

    listeners.push(handleUpdate);
    // Sync initial state if any toasts are already fired
    setToasts([...memoryToasts]);

    return () => {
      listeners = listeners.filter((l) => l !== handleUpdate);
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes toastSlideIn {
          from {
            transform: translateY(20px) scale(0.95);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
      `}} />
      <div
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          width: "360px",
          maxWidth: "calc(100vw - 48px)",
          pointerEvents: "none"
        }}
      >
        {toasts.map((t) => {
          // Define borders and glows based on toast type
          const isSuccess = t.type === "success";
          const isError = t.type === "error";
          const isWarning = t.type === "warning";

          const accentColor = isSuccess
            ? "#34d399"
            : isError
            ? "#f87171"
            : isWarning
            ? "#fbbf24"
            : "#60a5fa";

          return (
            <div
              key={t.id}
              style={{
                pointerEvents: "auto",
                background: "rgba(4, 9, 6, 0.9)",
                backdropFilter: "blur(16px)",
                border: `1px solid rgba(255, 255, 255, 0.08)`,
                borderLeft: `4px solid ${accentColor}`,
                borderRadius: "14px",
                padding: "16px 20px",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5), 0 1px 1px rgba(255, 255, 255, 0.05) inset",
                color: "#fff",
                animation: "toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                display: "flex",
                flexDirection: "column",
                gap: "4px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {isSuccess && (
                  <span style={{ color: "#34d399", fontSize: "1.1rem" }}>✓</span>
                )}
                {isError && (
                  <span style={{ color: "#f87171", fontSize: "1.1rem" }}>🛇</span>
                )}
                {isWarning && (
                  <span style={{ color: "#fbbf24", fontSize: "1.1rem" }}>⚠</span>
                )}
                <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{t.message}</span>
              </div>
              {t.description && (
                <div style={{ fontSize: "0.85rem", color: "rgba(243, 252, 247, 0.65)", paddingLeft: "20px" }}>
                  {t.description}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
