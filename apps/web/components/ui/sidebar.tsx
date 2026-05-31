"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface SidebarContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  isMobile: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

export function SidebarProvider({
  children,
  defaultOpen = true,
  style,
  ...props
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
  style?: React.CSSProperties;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setOpen(false);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggleSidebar = () => setOpen((prev) => !prev);

  return (
    <SidebarContext.Provider value={{ open, setOpen, toggleSidebar, isMobile }}>
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          width: "100%",
          position: "relative",
          ...style
        }}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

export function Sidebar({ children }: { children: React.ReactNode }) {
  const { open, isMobile, setOpen } = useSidebar();

  const desktopWidth = open ? "280px" : "80px";
  const mobileWidth = open ? "280px" : "0px";

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isMobile && open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 90,
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            transition: "opacity 0.2s ease"
          }}
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        style={{
          position: isMobile ? "fixed" : "sticky",
          top: 0,
          left: 0,
          bottom: 0,
          height: "100vh",
          zIndex: 100,
          width: isMobile ? mobileWidth : desktopWidth,
          minWidth: isMobile ? mobileWidth : desktopWidth,
          background: "rgba(4, 9, 6, 0.95)",
          backdropFilter: "blur(20px)",
          borderRight: "1px solid rgba(52, 211, 153, 0.12)",
          display: "flex",
          flexDirection: "column",
          transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            width: "280px" // Static inner width to avoid content squishing during transition
          }}
        >
          {children}
        </div>
      </aside>
    </>
  );
}

export function SidebarHeader({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        padding: "24px 20px",
        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
        ...style
      }}
    >
      {children}
    </div>
  );
}

export function SidebarContent({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "20px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        ...style
      }}
    >
      {children}
    </div>
  );
}

export function SidebarFooter({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        padding: "20px 16px",
        borderTop: "1px solid rgba(255, 255, 255, 0.05)",
        ...style
      }}
    >
      {children}
    </div>
  );
}

export function SidebarGroup({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {children}
    </div>
  );
}

export function SidebarGroupLabel({ children }: { children: React.ReactNode }) {
  const { open } = useSidebar();
  if (!open) return null;
  return (
    <div
      style={{
        fontSize: "0.75rem",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color: "rgba(243, 252, 247, 0.4)",
        paddingLeft: "8px"
      }}
    >
      {children}
    </div>
  );
}

export function SidebarMenu({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {children}
    </div>
  );
}

export function SidebarMenuItem({ children }: { children: React.ReactNode }) {
  return <div style={{ position: "relative" }}>{children}</div>;
}

export function SidebarMenuButton({
  children,
  isActive = false,
  onClick,
  style,
  ...props
}: {
  children: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  const { open } = useSidebar();
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px 16px",
        borderRadius: "12px",
        border: isActive ? "1px solid rgba(52, 211, 153, 0.35)" : "1px solid transparent",
        background: isActive ? "rgba(52, 211, 153, 0.08)" : "transparent",
        color: isActive ? "#fff" : "rgba(243, 252, 247, 0.75)",
        cursor: "pointer",
        textAlign: "left",
        fontSize: "0.95rem",
        fontWeight: isActive ? 600 : 500,
        transition: "all 0.2s ease",
        outline: "none",
        ...style
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
          e.currentTarget.style.color = "#fff";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "rgba(243, 252, 247, 0.75)";
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
}

export function SidebarTrigger() {
  const { toggleSidebar } = useSidebar();
  return (
    <button
      onClick={toggleSidebar}
      aria-label="Toggle Sidebar"
      style={{
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "10px",
        padding: "8px 12px",
        color: "#fff",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s ease"
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(52, 211, 153, 0.08)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)")}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>
  );
}
