import React from "react";
import type { Metadata } from "next";

import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import {
  Geist_Mono,
  Inter as V0_Font_Inter,
  Geist_Mono as V0_Font_Geist_Mono,
} from "next/font/google";
import { NextAuthSessionProvider } from "@/components/providers/next-auth-provider";
import PrimaryColorSetter from "@/components/providers/PrimaryColorSetter";
import DynamicFavicon from "@/components/providers/DynamicFavicon";
import { TooltipProvider } from "@/components/ui/tooltip";

// Initialize fonts
const _inter = V0_Font_Inter({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});
const _geistMono = V0_Font_Geist_Mono({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Spa Management System - Admin Portal",
  description:
    "Comprehensive spa management platform for bookings, staff, inventory and analytics",
  generator: "v0.app",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <NextAuthSessionProvider>
          <DynamicFavicon />
          <TooltipProvider>{children}</TooltipProvider>

          <PrimaryColorSetter />
        </NextAuthSessionProvider>
        <Analytics />
      </body>
    </html>
  );
}
