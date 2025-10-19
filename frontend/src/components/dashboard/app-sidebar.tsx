"use client";

import * as React from "react";
import {
  LayoutDashboard,
  Users,
  Shield,
  FileText,
  Settings,
  ShieldCheck,
  Lock,
  Fingerprint,
  BarChart3,
  Plug,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-provider/theme-toggle";

/* ============================================================
   🧭 Navigation Data (Level 2 – Optimized)
============================================================ */
const data = {
  sections: [
    {
      title: "General",
      items: [
        { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
        { title: "Users", url: "/dashboard/users", icon: Users },
        { title: "Roles & Permissions", url: "/dashboard/roles", icon: Lock },
      ],
    },
    {
      title: "Security",
      items: [
        { title: "Sessions", url: "/dashboard/sessions", icon: Shield },
        {
          title: "Login Attempts",
          url: "/dashboard/login-attempts",
          icon: Fingerprint,
        },
        { title: "Audit Logs", url: "/dashboard/audit-logs", icon: FileText },
      ],
    },
    {
      title: "Monitoring",
      items: [
        { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3 },
      ],
    },
    {
      title: "System",
      items: [
        { title: "Settings", url: "/dashboard/settings", icon: Settings },
        { title: "Integrations", url: "/dashboard/integrations", icon: Plug },
      ],
    },
  ],
};

/* ============================================================
   🧩 Component
============================================================ */
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      {/* 🌐 Brand Header */}
      <SidebarHeader className="px-5 pt-6 pb-4 border-b border-border/40">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 group transition-all duration-200"
        >
          {/* Icon */}
          <div className="relative flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-all">
            <ShieldCheck className="size-5" />
            <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-primary/20" />
          </div>

          {/* Brand Text */}
          <div className="flex flex-col leading-tight">
            <span className="text-[15.5px] font-semibold tracking-tight">
              Auth by Iventics
            </span>
            <span className="text-[12px] text-muted-foreground tracking-wide">
              Secure Access Platform
            </span>
          </div>
        </Link>
      </SidebarHeader>

      {/* 🧭 Navigation Sections */}
      <SidebarContent className="px-3 pt-3 pb-4">
        {data.sections.map((section, i) => (
          <div key={section.title} className={cn("mt-6 first:mt-2")}>
            <p className="px-3 mb-2 text-[11px] font-semibold uppercase text-muted-foreground/80 tracking-wider">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname.startsWith(item.url);
                return (
                  <SidebarMenu key={item.title}>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-md text-[15px] font-medium transition-all",
                          "hover:bg-accent/60 hover:text-accent-foreground active:scale-[0.99]",
                          isActive &&
                            "bg-accent text-accent-foreground shadow-sm"
                        )}
                      >
                        <Link href={item.url}>
                          <item.icon
                            className={cn(
                              "size-5 shrink-0",
                              isActive ? "opacity-100" : "opacity-80"
                            )}
                          />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                );
              })}
            </div>

            {i < data.sections.length - 1 && (
              <div className="mx-3 mt-5 border-t border-border/40" />
            )}
          </div>
        ))}
      </SidebarContent>

      {/* 🩺 System Status + Theme Toggle Footer */}
      <SidebarFooter className="border-t border-border mt-auto px-3 py-2">
        <div className="flex items-center justify-between w-full">
          {/* 🔵 System Status */}
          <Link
            href="/dashboard/health"
            className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-accent/30 transition-all duration-150"
          >
            <div
              className="size-2.5 rounded-full animate-pulse"
              style={{ backgroundColor: "#0070f5" }}
            />
            <span
              className="text-[12.5px] font-medium tracking-tight"
              style={{ color: "#0070f5" }}
            >
              All systems normal
            </span>
          </Link>

          {/* 🌗 Theme Toggle */}
          <div className="scale-[0.75] opacity-90 hover:opacity-100 transition-transform duration-150">
            <ThemeToggle />
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
