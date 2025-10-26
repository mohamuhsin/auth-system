import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import "./globals.css";

import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider/theme-provider";
import { AuthProvider } from "@/context/authContext";

/* ============================================================
   🎨 Fonts — Inter Sans + Tight (for headings)
============================================================ */
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

/* ============================================================
   🧭 Metadata — for SEO + Browser title
============================================================ */
export const metadata: Metadata = {
  title: "Auth by Iventics",
  description: "Secure authentication system for all Iventics apps",
  icons: {
    icon: "/favicon.ico",
  },
  manifest: "/manifest.json",
};

/* ============================================================
   🌍 Root Layout — Unified Global Providers (Level 2.0)
   ------------------------------------------------------------
   • Provides global font + theme + toast
   • Wraps all routes in AuthProvider
   • Prevents hydration mismatch warnings
============================================================ */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${interSans.variable} ${interTight.variable}
          font-sans antialiased min-h-screen bg-background text-foreground`}
      >
        {/* 🔐 Auth Context wraps the entire app */}
        <AuthProvider>
          {/* 🌓 ThemeProvider handles dark/light mode */}
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {/* 🌐 Main Application */}
            {children}

            {/* 🔔 Global toast notifications */}
            <Toaster
              richColors
              position="top-right"
              closeButton
              toastOptions={{
                duration: 4000,
                style: { fontSize: "0.875rem" },
              }}
            />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
