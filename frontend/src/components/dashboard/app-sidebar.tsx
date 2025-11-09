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

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://auth-api.iventics.com/api";

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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  type HealthState = "ok" | "degraded" | "maintenance" | "error" | "loading";
  const [health, setHealth] = React.useState<HealthState>("loading");

  React.useEffect(() => {
    const checkHealth = async () => {
      try {
        const start = performance.now();
        const res = await fetch(`${API_BASE}/health`);
        const latency = Math.round(performance.now() - start);
        const data = await res.json();

        if (!res.ok) return setHealth("error");

        if (data.maintenance) setHealth("maintenance");
        else if (latency > 800) setHealth("degraded");
        else if (data.ok) setHealth("ok");
        else setHealth("error");
      } catch {
        setHealth("error");
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const statusMap = {
    ok: { color: "#006ef5", label: "System Healthy" },
    degraded: { color: "#FACC15", label: "System Degraded" },
    maintenance: { color: "#FB923C", label: "Maintaining" },
    error: { color: "#EF4444", label: "System Offline" },
    loading: { color: "#9CA3AF", label: "Checking System..." },
  } as const;

  const { color, label } = statusMap[health];

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="px-5 pt-6 pb-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 group transition-all duration-200"
        >
          <div
            className="relative flex size-9 items-center justify-center rounded-xl
            bg-primary/10 text-primary ring-1 ring-inset ring-border/40
            shadow-[inset_0_0_6px_rgba(0,0,0,0.05)]
            group-hover:bg-primary/15 group-hover:scale-[1.05]
            transition-all duration-200 ease-out"
          >
            <ShieldCheck className="size-5 drop-shadow-sm" />
            <div
              className="absolute inset-0 rounded-xl ring-1 ring-inset ring-primary/25 
              group-hover:ring-primary/40 transition-all duration-200"
            />
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

        <div className="mt-4 h-[1px] w-full bg-gradient-to-r from-transparent via-border/70 to-transparent rounded-full" />
      </SidebarHeader>

      <SidebarContent className="px-3 pt-4 pb-6">
        {navData.map((section, i) => (
          <div key={i} className={cn("relative", i > 0 && "mt-6 pt-6")}>
            {i > 0 && (
              <div className="absolute -top-3 left-3 right-3 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent rounded-full" />
            )}
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
                          "flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[14.5px] font-medium transition-all duration-150",
                          "hover:bg-accent/40 hover:text-foreground active:scale-[0.98]",
                          isActive &&
                            "bg-accent text-accent-foreground shadow-sm ring-1 ring-accent/40"
                        )}
                      >
                        <Link href={item.url}>
                          <item.icon
                            className={cn(
                              "size-[18px] shrink-0 transition-colors duration-150",
                              isActive
                                ? "text-accent-foreground"
                                : "text-muted-foreground"
                            )}
                          />
                          <span className="truncate">{item.title}</span>
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
          {/* ✅ Compact System Health */}
          <Link
            href="/dashboard/health"
            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent/30 transition-all duration-200"
            aria-label="System Health Status"
          >
            <div
              className={cn(
                "relative flex size-2.5 rounded-full ring-2 ring-background/90 shadow-[0_0_8px_var(--tw-shadow-color)] transition-all duration-300",
                health === "loading" && "animate-pulse"
              )}
              style={
                {
                  backgroundColor: color,
                  "--tw-shadow-color": color,
                } as React.CSSProperties
              }
            />
            <span
              className={cn(
                "text-[13px] font-medium tracking-tight",
                health === "ok" && "text-blue-500",
                health === "degraded" && "text-yellow-500",
                health === "maintenance" && "text-orange-500",
                health === "error" && "text-red-500",
                health === "loading" && "text-muted-foreground"
              )}
            >
              {label}
            </span>
          </Link>
          <div className="scale-[0.9] opacity-90 hover:opacity-100 transition-opacity duration-150">
            <ThemeToggle />
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
