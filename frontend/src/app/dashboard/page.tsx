"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { ChartAreaInteractive } from "@/components/dashboard/chart-area-interactive";
import { DataTable } from "@/components/dashboard/data-table";
import { SectionCards } from "@/components/dashboard/section-cards";
import { SiteHeader } from "@/components/dashboard/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import data from "./data.json";

/**
 * 🧭 Dashboard Page (Protected)
 * ------------------------------------------------------------
 * - Requires user to be authenticated (via ProtectedRoute)
 * - Uses shared Sidebar + Header layout
 * - Renders dashboard widgets and data table
 */
export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        {/* 🧭 Left Sidebar */}
        <AppSidebar variant="inset" />

        {/* 📊 Main Dashboard Area */}
        <SidebarInset>
          {/* 🧩 Sticky Header (includes NavUser, notifications, etc.) */}
          <SiteHeader />

          {/* 🧱 Main Content */}
          <div className="flex flex-1 flex-col overflow-y-auto">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                {/* Quick summary cards */}
                <SectionCards />

                {/* Analytics section */}
                <div className="px-4 lg:px-6">
                  <ChartAreaInteractive />
                </div>

                {/* Data table section */}
                <DataTable data={data} />
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
