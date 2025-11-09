"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, CheckSquare2 } from "lucide-react";
import { NavUser } from "@/components/dashboard/nav-user";
import { PageBreadcrumb } from "./breadcrumbs";

export function SiteHeader() {
  return (
    <header
      className="sticky top-0 z-50 flex h-[60px] shrink-0 items-center 
      border-b bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80 
      px-4 lg:px-6 transition-all duration-200"
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2.5">
          <SidebarTrigger
            className="flex size-[38px] items-center justify-center rounded-full 
            border border-border bg-background/50 hover:bg-accent/50 
            hover:ring-2 hover:ring-accent/30 
            active:scale-[0.97] shadow-sm transition-all duration-150"
          />

          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />

          <PageBreadcrumb />
        </div>

        <div className="ml-auto flex items-center gap-3.5 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Notifications"
            className="relative flex size-[38px] items-center justify-center rounded-full 
            border border-border bg-background/50 hover:bg-accent/50 
            hover:ring-2 hover:ring-accent/30 
            active:scale-[0.97] shadow-sm transition-all duration-150"
          >
            <Bell className="size-[18px] text-foreground/90 stroke-[1.6]" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Tasks"
            className="relative flex size-[38px] items-center justify-center rounded-full 
            border border-border bg-background/50 hover:bg-accent/50 
            hover:ring-2 hover:ring-accent/30 
            active:scale-[0.97] shadow-sm transition-all duration-150"
          >
            <CheckSquare2 className="size-[18px] text-foreground/90 stroke-[1.6]" />
          </Button>

          <div className="flex items-center justify-center">
            <NavUser />
          </div>
        </div>
      </div>
    </header>
  );
}
