"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Bell } from "lucide-react";
import { NavUser } from "@/components/dashboard/nav-user";
import { PageBreadcrumb } from "./breadcrumbs";

export function SiteHeader() {
  return (
    <header className="flex h-[58px] shrink-0 items-center border-b bg-background/80 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60 transition-all">
      <div className="flex w-full items-center justify-between px-4 lg:px-6">
        {/* 🔹 Left: Sidebar trigger + title (restored compact layout) */}
        <div className="flex items-center gap-1">
          <SidebarTrigger className="-ml-1 size-9 hover:bg-accent/50 rounded-md transition" />
          <Separator
            orientation="vertical"
            className="mx-2 h-4 data-[orientation=vertical]:h-4 bg-border/80"
          />
          <PageBreadcrumb />
        </div>

        {/* 🔸 Right: Actions */}
        <div className="ml-auto flex items-center gap-3 sm:gap-4">
          {/* 🔔 Notification */}
          <Button
            variant="ghost"
            size="icon"
            className="relative flex size-9 items-center justify-center rounded-md hover:bg-accent/60 active:scale-[0.98] transition-all"
          >
            <Bell className="size-5 text-muted-foreground stroke-[1.6]" />
            <span className="absolute top-[7px] right-[8px] h-2 w-2 rounded-full bg-[#0070f5] ring-[2px] ring-background" />
          </Button>

          {/* 👤 User Menu */}
          <div className="flex h-9 items-center justify-center pl-1 sm:pl-2">
            <div className="scale-[0.95] opacity-95 hover:opacity-100 transition-opacity">
              <NavUser
                user={{
                  name: "Moha Muhsin",
                  email: "muhsin@iventics.com",
                  avatar: "/avatars/admin.png",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
