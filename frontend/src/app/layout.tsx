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
  icons: { icon: "/favicon.ico" },
  manifest: undefined,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${interSans.variable} ${interTight.variable} 
          font-sans antialiased min-h-screen bg-background text-foreground`}
      >
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <main className="min-h-screen">{children}</main>
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
