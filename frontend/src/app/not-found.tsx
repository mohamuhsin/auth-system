"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex h-screen flex-col items-center justify-center px-6 text-center bg-background relative">
      {/* 🔰 Logo / Brand Section */}
      <div className="flex flex-col items-center justify-center mb-8">
        <div className="relative flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
          <ShieldCheck className="size-7" />
          <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-primary/20" />
        </div>

        <h2 className="mt-3 text-sm font-semibold text-muted-foreground tracking-wide">
          Auth by <span className="text-primary font-semibold">Iventics</span>
        </h2>
      </div>

      {/* 🧭 Heading + Description */}
      <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">
        404 — Page Not Found
      </h1>
      <p className="text-sm text-muted-foreground max-w-sm leading-relaxed mb-8">
        The page you’re looking for doesn’t exist or may have been moved.
        <br />
        Please check the URL or navigate back to a safe page.
      </p>

      {/* 🪄 Actions */}
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/login">
          <Button className="min-w-[120px]">Back to Login</Button>
        </Link>
        <Link href="/">
          <Button variant="outline" className="min-w-[120px]">
            Go Home
          </Button>
        </Link>
      </div>

      {/* ⚙️ Footer */}
      <footer className="mt-12 text-xs text-muted-foreground/80">
        &copy; {new Date().getFullYear()}{" "}
        <span className="font-medium text-foreground">
          Auth by Iventics Technologies
        </span>{" "}
        — All rights reserved
      </footer>

      {/* 🌫️ Subtle gradient background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-accent/5 to-background" />
    </main>
  );
}
