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
  ArrowUpRight,
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
   🏁 Auth by Iventics — Modern, Clean Landing Page
============================================================ */
export default function Home() {
  const year = new Date().getFullYear();

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground font-sans overflow-x-hidden scroll-smooth">
      {/* 🧭 NAVBAR */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 transition-all">
        <div className="mx-auto flex h-[60px] max-w-[1400px] items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* 🔰 Brand */}
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight hover:opacity-90 transition-opacity"
          >
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-border/40 hover:bg-primary/20 transition-colors">
              <ShieldCheck className="size-4" />
            </div>
            <span className="text-sm sm:text-base whitespace-nowrap">
              Auth by Iventics
            </span>
          </Link>

          {/* 🌐 Desktop Menu */}
          <div className="hidden sm:flex items-center gap-5">
            <div className="flex items-center gap-3">
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
                <Button
                  variant="outline"
                  size="sm"
                  className="font-medium flex items-center gap-1.5"
                >
                  Docs
                  <ArrowUpRight className="size-3 opacity-70" />
                </Button>
              </Link>
            </div>

            <Separator
              orientation="vertical"
              className="h-5 mx-4 bg-border/100"
            />

            <ModeToggle />
          </div>

          {/* 📱 Mobile Menu */}
          <div className="sm:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Open menu"
                  className="hover:bg-accent/50"
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>

              <SheetContent
                side="right"
                className="w-full max-w-[80vw] sm:max-w-[320px] p-0"
              >
                <SheetHeader className="border-b border-border/50 px-6 py-4">
                  <SheetTitle className="flex items-center gap-2 text-sm font-medium">
                    <ShieldCheck className="size-4 text-primary" />
                    Auth by Iventics
                  </SheetTitle>
                </SheetHeader>

                <nav className="flex flex-col space-y-1 px-6 py-6">
                  {[
                    { name: "Home", href: "/" },
                    { name: "Live Demo", href: "/login" },
                    {
                      name: "Docs on GitHub",
                      href: "https://github.com/mohamuhsin/auth-system",
                      external: true,
                    },
                  ].map(({ name, href, external }) => (
                    <Link
                      key={name}
                      href={href}
                      target={external ? "_blank" : "_self"}
                      rel={external ? "noopener noreferrer" : undefined}
                      className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <span>{name}</span>
                      {external && (
                        <ArrowUpRight className="size-4 opacity-70" />
                      )}
                    </Link>
                  ))}

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

      {/* HERO */}
      <section className="relative flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 pt-24 pb-20 overflow-hidden">
        {/* Glow Background */}
        <div className="absolute inset-0 -z-10 flex justify-center items-center">
          <div className="h-[400px] sm:h-[600px] w-[400px] sm:w-[600px] rounded-full bg-gradient-to-tr from-primary/25 via-purple-500/20 to-blue-500/10 blur-3xl opacity-40 animate-pulse" />
        </div>

        <div className="relative flex size-16 sm:size-20 md:size-24 items-center justify-center rounded-3xl bg-primary/10 text-primary ring-1 ring-border/40 shadow-inner hover:scale-105 transition-transform duration-300">
          <ShieldCheck className="size-8 sm:size-9 md:size-10" />
        </div>

        <h1 className="mt-8 text-[clamp(1.8rem,4vw,3.5rem)] font-bold tracking-tight bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent leading-tight max-w-[90vw]">
          Secure Auth. Universal Identity.
        </h1>

        <p className="mt-4 max-w-[680px] text-[clamp(0.9rem,1.8vw,1.1rem)] text-muted-foreground px-2">
          An open-source authentication system for modern web apps — fully
          extensible, production-ready, and easy to clone for any project.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/login">
            <Button size="lg" className="font-medium">
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
              className="flex items-center gap-2 group"
            >
              Clone on GitHub
              <ArrowUpRight className="size-4 opacity-70 group-hover:translate-x-[2px] group-hover:-translate-y-[2px] transition-transform duration-200" />
            </Button>
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground px-2">
          {[
            "Next.js 15+",
            "Firebase Auth + Admin",
            "Prisma ORM",
            "Express API",
          ].map((tech) => (
            <span
              key={tech}
              className="rounded-full border border-border/40 px-3 py-1 hover:border-primary/50 transition-colors whitespace-nowrap"
            >
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="w-full bg-muted/40 py-20">
        <div className="mx-auto max-w-[1400px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4 sm:px-6">
          {[
            {
              icon: <Lock className="size-6 text-primary" />,
              title: "Secure Session Handling",
              desc: "Encrypted cookies and Firebase Admin verification ensure complete session integrity.",
            },
            {
              icon: <Users className="size-6 text-primary" />,
              title: "Role-Based Access",
              desc: "Admins, Merchants, and Creators — each with secure and personalized dashboards.",
            },
            {
              icon: <Zap className="size-6 text-primary" />,
              title: "Plug & Play Architecture",
              desc: "Integrate instantly into any app — minimal setup, maximum scalability.",
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
                <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                  {f.desc}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* INTEGRATIONS */}
      <section className="w-full bg-accent/30 py-20">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 text-center">
          <h2 className="text-xl sm:text-2xl font-semibold mb-12">
            Seamless Integrations
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Globe className="size-6 text-primary" />,
                title: "Cross-Domain Sessions",
                desc: "Unified login between frontend and backend — secure, consistent, and cookie-safe across subdomains.",
              },
              {
                icon: <KeyRound className="size-6 text-primary" />,
                title: "Firebase Identity",
                desc: "Email & Google OAuth powered by Firebase Auth and Admin SDK.",
              },
              {
                icon: <Code2 className="size-6 text-primary" />,
                title: "Next.js + Prisma Core",
                desc: "Modern, type-safe full-stack foundation optimized for reliability and speed.",
              },
            ].map((i) => (
              <Card
                key={i.title}
                className="text-center shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <CardHeader className="flex flex-col items-center gap-3">
                  {i.icon}
                  <CardTitle className="text-base sm:text-lg font-semibold">
                    {i.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                    {i.desc}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/40 bg-background py-10 text-center text-sm text-muted-foreground px-4">
        <p>
          © {year}{" "}
          <span className="font-medium text-foreground">
            Auth by Iventics Technologies
          </span>
        </p>

        <div className="mt-3 flex flex-wrap justify-center gap-4 text-xs sm:text-sm">
          <Link
            href="mailto:support@iventics.com"
            className="hover:underline underline-offset-4"
          >
            Contact Support
          </Link>
          <Link
            href="https://github.com/mohamuhsin/auth-system"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:underline underline-offset-4"
          >
            GitHub Repo
            <ArrowUpRight className="size-3 opacity-70" />
          </Link>
        </div>
      </footer>
    </main>
  );
}

// @plugin "tailwindcss-animate";

// @import "tailwindcss";

// @custom-variant dark (&:is(.dark *));

// @theme inline {
//   --font-sans: var(--font-inter-sans);
//   --font-mono: var(--font-inter-tight);

//   --color-background: var(--background);
//   --color-foreground: var(--foreground);
//   --color-border: var(--border);
//   --color-input: var(--input);
//   --color-ring: var(--ring);

//   --color-primary: var(--primary);
//   --color-primary-foreground: var(--primary-foreground);
//   --color-accent: var(--accent);
//   --color-accent-foreground: var(--accent-foreground);
//   --color-secondary: var(--secondary);
//   --color-secondary-foreground: var(--secondary-foreground);
//   --color-muted: var(--muted);
//   --color-muted-foreground: var(--muted-foreground);
//   --color-destructive: var(--destructive);
//   --color-destructive-foreground: var(--destructive-foreground);

//   --color-card: var(--card);
//   --color-card-foreground: var(--card-foreground);
//   --color-popover: var(--popover);
//   --color-popover-foreground: var(--popover-foreground);

//   --color-sidebar: var(--sidebar);
//   --color-sidebar-foreground: var(--sidebar-foreground);
//   --color-sidebar-border: var(--sidebar-border);
//   --color-sidebar-primary: var(--sidebar-primary);
//   --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
//   --color-sidebar-accent: var(--sidebar-accent);
//   --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
//   --color-sidebar-ring: var(--sidebar-ring);

//   --radius-sm: calc(var(--radius) - 4px);
//   --radius-md: calc(var(--radius) - 2px);
//   --radius-lg: var(--radius);
//   --radius-xl: calc(var(--radius) + 4px);
// }

// :root {
//   --radius: 0.625rem;

//   --background: #f9fafb;
//   --foreground: #0f172a;

//   --card: #ffffff;
//   --card-foreground: #0f172a;
//   --popover: #ffffff;
//   --popover-foreground: #0f172a;

//   --primary: #375dfb;
//   --primary-foreground: #ffffff;

//   --accent: #eef2ff;
//   --accent-foreground: #1e293b;
//   --secondary: #f3f4f6;
//   --secondary-foreground: #0f172a;

//   --muted: #f4f4f5;
//   --muted-foreground: #6b7280;
//   --border: #e5e7eb;
//   --input: #e5e7eb;
//   --ring: #375dfb;

//   --destructive: #ef4444;
//   --destructive-foreground: #ffffff;

//   --sidebar: #f9fafb;
//   --sidebar-foreground: #0f172a;
//   --sidebar-border: #e5e7eb;
//   --sidebar-primary: #375dfb;
//   --sidebar-primary-foreground: #ffffff;
//   --sidebar-accent: #eef2ff;
//   --sidebar-accent-foreground: #0f172a;
//   --sidebar-ring: #375dfb;
// }

// .dark {
//   --background: #0d1017;
//   --foreground: #f3f4f6;

//   --card: #161a22;
//   --card-foreground: #f9fafb;
//   --popover: #161a22;
//   --popover-foreground: #f9fafb;

//   --primary: #375dfb;
//   --primary-foreground: #ffffff;

//   --accent: #2a3040;
//   --accent-foreground: #f3f4f6;
//   --secondary: #1c2029;
//   --secondary-foreground: #f9fafb;

//   --muted: #1a1e27;
//   --muted-foreground: #9ca3af;
//   --border: #2a2f3c;
//   --input: #2a2f3c;
//   --ring: #4f6cff;

//   --destructive: #ef4444;
//   --destructive-foreground: #ffffff;

//   --sidebar: #151922;
//   --sidebar-foreground: #f3f4f6;
//   --sidebar-border: #20242e;
//   --sidebar-primary: #375dfb;
//   --sidebar-primary-foreground: #ffffff;
//   --sidebar-accent: #222738;
//   --sidebar-accent-foreground: #f3f4f6;
//   --sidebar-ring: #4f6cff;
// }

// @layer base {
//   * {
//     @apply border-border outline-ring/50;
//   }

//   body {
//     @apply bg-background text-foreground font-sans antialiased;
//   }
// }

// @layer base {
//   [data-orientation="horizontal"] {
//     height: 1px;
//     width: 100%;
//     background-color: hsl(var(--border));
//   }

//   [data-orientation="vertical"] {
//     width: 1.5px;
//     height: 100%;
//     background-color: hsl(var(--border));
//   }
// }
