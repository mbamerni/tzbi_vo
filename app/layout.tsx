import React from "react"
import type { Metadata, Viewport } from "next";
import { Amiri } from "next/font/google";

import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const _amiri = Amiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "tzbi_v0",
  description: "tzbi_v0 - Your Digital Tasbeeh",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "أذكاري",
  },
};

export const viewport: Viewport = {
  themeColor: "#6b7f3a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // iOS specific
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="bg-background" suppressHydrationWarning>
      <body className={`font-sans antialiased ${_amiri.variable}`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
