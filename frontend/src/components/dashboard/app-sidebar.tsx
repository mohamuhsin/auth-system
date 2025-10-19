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
   🧭 Navigation Structure
============================================================ */
const navData = [
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
];

/* ============================================================
   🧩 Sidebar Component
============================================================ */
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      {/* 🌐 Brand Header */}
      <SidebarHeader className="px-5 pt-6 pb-5">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 group transition-all duration-200"
        >
          <div className="relative flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-all">
            <ShieldCheck className="size-5" />
            <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-primary/20" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[15.5px] font-semibold tracking-tight">
              Auth by Iventics
            </span>
            <span className="text-[12px] text-muted-foreground tracking-wide">
              Secure Access Platform
            </span>
          </div>
        </Link>

        {/* ✨ Subtle Separator Below Brand */}
        <div className="mt-5 h-px bg-border/50 rounded-full" />
      </SidebarHeader>

      {/* 🧭 Navigation Sections */}
      <SidebarContent className="px-3 pt-4 pb-6">
        {navData.map((section, i) => (
          <div key={i} className={cn("mt-6 first:mt-3")}>
            <p className="px-3 mb-2 text-[11px] font-semibold uppercase text-muted-foreground/70 tracking-wider">
              {section.title}
            </p>

            <div className="flex flex-col gap-1.5">
              {section.items.map((item) => {
                const isActive = pathname.startsWith(item.url);

                return (
                  <SidebarMenu key={item.title}>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        className={cn(
                          // Layout
                          "flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[15px] font-medium transition-all duration-150",
                          // Hover + active
                          "hover:bg-accent/40 hover:text-foreground active:scale-[0.98]",
                          isActive &&
                            "bg-accent text-accent-foreground shadow-sm ring-1 ring-accent/40"
                        )}
                      >
                        <Link href={item.url}>
                          <item.icon
                            className={cn(
                              "size-[18px] shrink-0 transition-opacity duration-150",
                              isActive
                                ? "opacity-100 text-accent-foreground"
                                : "opacity-70 text-muted-foreground group-hover/item:opacity-100"
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
          </div>
        ))}
      </SidebarContent>

      {/* 🩺 Footer */}
      <SidebarFooter className="mt-auto px-4 py-3 border-t border-border/40">
        <div className="flex items-center justify-between w-full">
          {/* 🔵 System Status */}
          <Link
            href="/dashboard/health"
            className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-accent/30 transition-all duration-150"
          >
            <div
              className="size-2.5 rounded-full animate-pulse"
              style={{ backgroundColor: "#00bfa6" }}
            />
            <span
              className="text-[12.5px] font-medium tracking-tight"
              style={{ color: "#00bfa6" }}
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
