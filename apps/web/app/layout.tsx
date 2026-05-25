import type { ReactNode } from "react";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--bv-font-body",
  display: "swap"
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--bv-font-display",
  display: "swap"
});

export const metadata = {
  title: "BookMyVirunnu",
  description: "Ceremonial hospitality booking for Kerala virunnu experiences."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable}`}>
      <body>{children}</body>
    </html>
  );
}
