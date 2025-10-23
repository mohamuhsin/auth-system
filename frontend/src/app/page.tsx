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
   🌐 Auth by Iventics — Open-Source Authentication System
   ------------------------------------------------------------
   Secure. Scalable. Plug & Play.
   Built with Next.js 15+, Firebase Admin, and Prisma.
============================================================ */
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground font-sans scroll-smooth">
      {/* 🧭 NAVBAR */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 transition-all">
        <div className="mx-auto flex h-[60px] w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* 🔰 Brand */}
          <Link
            href="/"
            className="group flex items-center gap-2 font-semibold tracking-tight transition-all hover:opacity-90"
          >
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-border/40 group-hover:bg-primary/20 transition-colors">
              <ShieldCheck className="size-4" />
            </div>
            <span className="text-sm sm:text-base">Auth by Iventics</span>
          </Link>

          {/* 🌗 Desktop Actions */}
          <div className="hidden sm:flex items-center justify-end flex-1">
            <div className="flex items-center gap-3 mr-6">
              <Link href="/login">
                <Button size="sm" className="font-medium">
                  Live Demo
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
            <Separator
              orientation="vertical"
              className="mx-4 h-6 bg-border/60"
            />
            <ModeToggle />
          </div>

          {/* 📱 Mobile Menu */}
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
                <nav className="flex flex-col space-y-1 px-6 py-6">
                  <Link
                    href="/"
                    className="rounded-md px-2 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    Home
                  </Link>
                  <Link
                    href="/login"
                    className="rounded-md px-2 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    Live Demo
                  </Link>
                  <Link
                    href="https://github.com/mohamuhsin/auth-system"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md px-2 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    Docs on GitHub
                  </Link>

                  <Separator className="my-6" />

                  <div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Appearance
                    </p>
                    <ThemeToggle />
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* 🌟 HERO */}
      <section className="relative flex flex-col items-center text-center px-4 sm:px-6 lg:px-8 pt-28 pb-24 overflow-hidden">
        {/* ✨ Background Glow */}
        <div className="absolute inset-0 -z-10 flex justify-center">
          <div className="h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-primary/30 via-purple-500/20 to-blue-500/10 blur-3xl opacity-40 animate-pulse" />
        </div>

        {/* 🛡️ Icon */}
        <div className="relative flex size-20 items-center justify-center rounded-3xl bg-primary/10 text-primary ring-1 ring-border/40 shadow-inner hover:scale-105 transition-transform duration-300">
          <ShieldCheck className="size-9" />
        </div>

        <h1 className="mt-8 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
          Secure Auth. Universal Identity.
        </h1>

        <p className="mt-4 max-w-2xl text-base sm:text-lg text-muted-foreground">
          An open-source authentication system for modern web apps - fully
          extensible, production-ready, and easy to clone for any project.
        </p>

        {/* 🔘 CTA Buttons */}
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/login">
            <Button size="lg" className="font-medium w-full sm:w-auto">
              Try Live Demo
            </Button>
          </Link>
          <Link
            href="https://github.com/mohamuhsin/auth-system"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto hover:bg-accent/60"
            >
              Clone on GitHub
            </Button>
          </Link>
        </div>

        {/* ⚙️ Tech Badges */}
        <div className="mt-8 flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
          {[
            "Next.js 15+",
            "Firebase Auth + Admin",
            "Prisma ORM",
            "Express API",
          ].map((badge) => (
            <span
              key={badge}
              className="rounded-full border border-border/40 px-3 py-1 hover:border-primary/50 transition-colors"
            >
              {badge}
            </span>
          ))}
        </div>
      </section>

      {/* ⚡ FEATURES */}
      <section className="w-full bg-muted/40 py-20">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 sm:px-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: <Lock className="size-6 text-primary" />,
              title: "Secure Session Handling",
              desc: "Encrypted cookies and Firebase Admin verification ensure total session integrity.",
            },
            {
              icon: <Users className="size-6 text-primary" />,
              title: "Role-Based Access",
              desc: "Admins, Merchants, and Creators - each with personalized, secure dashboards.",
            },
            {
              icon: <Zap className="size-6 text-primary" />,
              title: "Plug & Play Architecture",
              desc: "Integrate instantly into any app - one configuration, endless scalability.",
            },
          ].map((f) => (
            <Card
              key={f.title}
              className="text-center shadow-sm hover:shadow-md transition-shadow duration-300"
            >
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
                desc: "Unified login between frontend and backend - secure and consistent across subdomains.",
              },
              {
                icon: <KeyRound className="size-6 text-primary" />,
                title: "Firebase Identity",
                desc: "Email & Google OAuth powered by Firebase Auth and Admin SDK.",
              },
              {
                icon: <Code2 className="size-6 text-primary" />,
                title: "Next.js + Prisma Core",
                desc: "Modern full-stack foundation optimized for reliability, type-safety, and speed.",
              },
            ].map((item) => (
              <Card
                key={item.title}
                className="text-center shadow-sm hover:shadow-md transition-shadow duration-300"
              >
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
        <p>
          © {new Date().getFullYear()}{" "}
          <span className="font-medium text-foreground">
            Auth by Iventics Technologies
          </span>
        </p>
        <div className="mt-3 flex justify-center gap-6 text-xs">
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
