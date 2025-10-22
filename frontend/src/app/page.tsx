"use client";

import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Zap,
  Users,
  Globe,
  KeyRound,
  Code2,
  Menu,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "@/components/theme-provider/mode-toggle";
import { ThemeToggle } from "@/components/theme-provider/theme-toggle";

/* ============================================================
   🌐 Auth by Iventics — Responsive Landing Page (Pure ShadCN)
============================================================ */
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground font-sans">
      {/* 🧭 NAVBAR */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-[60px] w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* 🔰 Brand */}
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight hover:opacity-90 transition-opacity"
          >
            <div className="relative flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-border/40">
              <ShieldCheck className="size-4" />
            </div>
            <span className="text-sm sm:text-base">Auth by Iventics</span>
          </Link>

          {/* 🌗 Desktop actions */}
          <div className="hidden sm:flex items-center justify-end flex-1">
            {/* Action Buttons (Left side of toggle) */}
            <div className="flex items-center gap-4 mr-6">
              <Link href="/login">
                <Button size="sm" className="font-medium">
                  Login
                </Button>
              </Link>
              <Link
                href="https://github.com/mohamuhsin/auth-system"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="font-medium">
                  Docs
                </Button>
              </Link>
            </div>

            {/* Separator + ModeToggle (Far right) */}
            <Separator
              orientation="vertical"
              className="mx-5 h-6 bg-border/60 opacity-70"
            />
            <div className="flex items-center justify-center">
              <ModeToggle />
            </div>
          </div>

          {/* 📱 Mobile menu */}
          <div className="sm:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>

              <SheetContent side="right" className="w-72 sm:w-80 p-0">
                <SheetHeader className="border-b border-border/50 px-6 py-4">
                  <SheetTitle className="flex items-center gap-2 text-sm font-medium tracking-tight">
                    <ShieldCheck className="size-4 text-primary" />
                    Auth by Iventics
                  </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col py-6">
                  {/* 🔗 Nav Links */}
                  <nav className="flex flex-col space-y-2 px-6">
                    <Link
                      href="/"
                      className="py-2 text-sm font-medium hover:text-primary"
                    >
                      Home
                    </Link>

                    <Link
                      href="https://github.com/mohamuhsin/auth-system"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 text-sm font-medium hover:text-primary"
                    >
                      Docs on GitHub
                    </Link>

                    <Link
                      href="/login"
                      className="py-2 text-sm font-medium hover:text-primary"
                    >
                      Login
                    </Link>
                  </nav>

                  <Separator className="my-6" />

                  {/* 🌗 Mode Toggle */}
                  <div className="px-6">
                    <p className="text-xs text-muted-foreground mb-2">
                      Appearance
                    </p>
                    <div className="flex items-center justify-between">
                      <ThemeToggle />
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* 🌟 HERO */}
      <section className="flex flex-col items-center text-center px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <div className="relative flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-border shadow-inner">
          <ShieldCheck className="size-7" />
        </div>

        <h1 className="mt-6 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
          Auth by Iventics
        </h1>
        <p className="mt-3 max-w-2xl text-sm sm:text-base md:text-lg text-muted-foreground">
          Secure, scalable authentication & user management for modern apps -
          powered by Next.js 15+, Firebase, and Prisma.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/login">
            <Button size="lg" className="font-medium w-full sm:w-auto">
              Get Started
            </Button>
          </Link>
          <Link
            href="https://github.com/mohamuhsin/auth-system"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              View on GitHub
            </Button>
          </Link>
        </div>
      </section>

      {/* ⚡ FEATURES */}
      <section className="w-full bg-muted/40 py-20">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 sm:px-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: <Lock className="size-6 text-primary" />,
              title: "Secure Session Handling",
              desc: "Encrypted cookies and Firebase Admin verification ensure session integrity.",
            },
            {
              icon: <Users className="size-6 text-primary" />,
              title: "Role-Based Access",
              desc: "Supports Admins, Merchants, and Creators - each with tailored dashboards.",
            },
            {
              icon: <Zap className="size-6 text-primary" />,
              title: "Plug & Play Architecture",
              desc: "Integrates easily into existing modern apps with minimal setup.",
            },
          ].map((f) => (
            <Card key={f.title} className="text-center shadow-sm">
              <CardHeader className="flex flex-col items-center gap-3">
                {f.icon}
                <CardTitle className="text-base sm:text-lg">
                  {f.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                  {f.desc}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 🔗 INTEGRATIONS */}
      <section className="w-full bg-accent/30 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center">
          <h2 className="text-xl sm:text-2xl font-semibold mb-12">
            Seamless Integrations
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: <Globe className="size-6 text-primary" />,
                title: "Cross-Domain Sessions",
                desc: "Unified login between backend domain and frontend domain.",
              },
              {
                icon: <KeyRound className="size-6 text-primary" />,
                title: "Firebase Identity",
                desc: "Email/password & Google OAuth powered by Firebase Auth + Admin SDK.",
              },
              {
                icon: <Code2 className="size-6 text-primary" />,
                title: "Next.js + Prisma Core",
                desc: "Modern full-stack foundation optimized for performance and type safety.",
              },
            ].map((item) => (
              <Card key={item.title} className="text-center shadow-sm">
                <CardHeader className="flex flex-col items-center gap-3">
                  {item.icon}
                  <CardTitle className="text-base sm:text-lg font-semibold">
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                    {item.desc}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 🧭 FOOTER */}
      <footer className="border-t border-border/40 bg-background py-10 text-center text-sm text-muted-foreground">
        <p className="px-4">
          © {new Date().getFullYear()}{" "}
          <span className="font-medium text-foreground">
            Auth by Iventics Technologies
          </span>{" "}
          - Secure Access. Simplified.
        </p>
        <div className="mt-3 flex justify-center gap-6 text-xs">
          <Link href="/privacy" className="hover:underline underline-offset-4">
            Privacy
          </Link>
          <Link href="/terms" className="hover:underline underline-offset-4">
            Terms
          </Link>
          <Link
            href="mailto:support@iventics.com"
            className="hover:underline underline-offset-4"
          >
            Contact Support
          </Link>
        </div>
      </footer>
    </main>
  );
}
