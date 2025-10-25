import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider/theme-provider";
import { AuthProvider } from "@/context/authContext";

const interSans = Inter({
  variable: "--font-inter-sans",
  subsets: ["latin"],
  display: "swap",
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Auth by Iventics",
  description: "Secure authentication system for all Iventics apps",
};

/**
 * 🌍 Root Layout (Level 2.0 Hardened)
 * ------------------------------------------------------------
 * - Wraps entire app with AuthProvider + ThemeProvider
 * - Provides global font + theme + toast
 * - Handles hydration safely with `suppressHydrationWarning`
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${interSans.variable} ${interTight.variable} 
          font-sans antialiased min-h-screen bg-background text-foreground`}
      >
        {/* 🔐 Auth Context must wrap everything */}
        <AuthProvider>
          {/* 🌓 Theme provider handles light/dark mode */}
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {/* 🧩 App children (pages, layouts, etc.) */}
            {children}

            {/* 🔔 Global toast notifications */}
            <Toaster richColors position="top-right" closeButton />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
