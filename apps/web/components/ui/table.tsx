"use client";

import React from "react";

export function Table({
  children,
  style,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div
      style={{
        width: "100%",
        overflowX: "auto",
        borderRadius: "16px",
        border: "1px solid rgba(255, 255, 255, 0.06)",
        background: "rgba(255, 255, 255, 0.01)",
        backdropFilter: "blur(10px)",
        boxShadow: "0 4px 30px rgba(0, 0, 0, 0.2)"
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          borderSpacing: 0,
          textAlign: "left",
          fontSize: "0.9rem",
          ...style
        }}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export function TableHeader({
  children,
  style,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      style={{
        background: "rgba(52, 211, 153, 0.04)",
        borderBottom: "1px solid rgba(52, 211, 153, 0.15)",
        ...style
      }}
      {...props}
    >
      {children}
    </thead>
  );
}

export function TableBody({
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props}>{children}</tbody>;
}

export function TableRow({
  children,
  style,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      style={{
        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
        transition: "background 0.2s ease",
        ...style
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({
  children,
  style,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      style={{
        padding: "16px 20px",
        fontWeight: 600,
        color: "#34d399",
        fontSize: "0.85rem",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        ...style
      }}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({
  children,
  style,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      style={{
        padding: "16px 20px",
        color: "rgba(243, 252, 247, 0.85)",
        verticalAlign: "middle",
        ...style
      }}
      {...props}
    >
      {children}
    </td>
  );
}

export function TableCaption({
  children,
  style,
  ...props
}: React.HTMLAttributes<HTMLTableCaptionElement>) {
  return (
    <caption
      style={{
        padding: "16px",
        color: "rgba(243, 252, 247, 0.5)",
        fontSize: "0.8rem",
        ...style
      }}
      {...props}
    >
      {children}
    </caption>
  );
}
