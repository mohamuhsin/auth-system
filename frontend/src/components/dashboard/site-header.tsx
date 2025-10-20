"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, CheckSquare2 } from "lucide-react";
import { NavUser } from "@/components/dashboard/nav-user";
import { PageBreadcrumb } from "./breadcrumbs";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-[58px] shrink-0 items-center border-b bg-background/80 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60 transition-all">
      <div className="flex w-full items-center justify-between px-3 sm:px-4 md:px-6">
        {/* ============================================================
           🔹 LEFT: Sidebar Trigger + Breadcrumb
        ============================================================ */}
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          {/* Sidebar toggle */}
          <SidebarTrigger className="-ml-0.5 size-9 rounded-md hover:bg-accent/50 active:scale-[0.98] transition-all" />

          {/* Divider — always visible */}
          <Separator
            orientation="vertical"
            className="mx-2 h-4 data-[orientation=vertical]:h-4 bg-border/70"
          />

          {/* Breadcrumb */}
          <div className="truncate">
            <PageBreadcrumb />
          </div>
        </div>

        {/* ============================================================
           🔸 RIGHT: Header Actions (Notifications / Tasks / User)
        ============================================================ */}
        <div className="ml-auto flex items-center gap-4 sm:gap-5 md:gap-7 lg:gap-8">
          {/* 🔔 Notifications */}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Notifications"
            className="relative flex size-9 items-center justify-center rounded-md hover:bg-accent/60 active:scale-[0.97] transition-all duration-150"
          >
            <Bell className="size-5 text-muted-foreground stroke-[1.6]" />
            <span className="absolute top-[7px] right-[8px] h-2 w-2 rounded-full bg-[#0070f5] ring-[2px] ring-background" />
          </Button>

          {/* ✅ Tasks */}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Tasks"
            className="relative flex size-9 items-center justify-center rounded-md hover:bg-accent/60 active:scale-[0.97] transition-all duration-150"
          >
            <CheckSquare2 className="size-5 text-muted-foreground stroke-[1.6]" />
            <span className="absolute top-[7px] right-[8px] h-2 w-2 rounded-full bg-amber-500 ring-[2px] ring-background" />
          </Button>

          {/* 👤 User Menu */}
          <div className="flex h-9 items-center justify-center pl-2 sm:pl-3 md:pl-4">
            <div className="scale-[0.95] opacity-95 hover:opacity-100 transition-opacity duration-150">
              <NavUser
                user={{
                  name: "Moha Muhsin",
                  email: "muhsin@iventics.com",
                  avatar: "/avatars/admin.png",
                  role: "Admin",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
