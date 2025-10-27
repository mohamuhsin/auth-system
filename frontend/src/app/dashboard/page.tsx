"use client";

export const dynamic = "force-dynamic"; // ✅ ensures no static caching

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/context/authContext";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { ChartAreaInteractive } from "@/components/dashboard/chart-area-interactive";
import { DataTable } from "@/components/dashboard/data-table";
import { SectionCards } from "@/components/dashboard/section-cards";
import { SiteHeader } from "@/components/dashboard/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import data from "./data.json";

/* ============================================================
   🧭 Dashboard Page (Protected)
   ------------------------------------------------------------
   • Requires active authenticated session
   • Uses unified sidebar + header layout
   • Displays analytics + data table
============================================================ */
export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  // 🧭 Optional: redirect if user role isn’t allowed (RBAC ready)
  useEffect(() => {
    if (user && user.role === "MERCHANT") {
      router.replace("/merchant");
    }
  }, [user, router]);

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
        {/* 🧭 Sidebar */}
        <AppSidebar variant="inset" />

        {/* 📊 Main Dashboard Area */}
        <SidebarInset>
          <SiteHeader />

          <div className="flex flex-1 flex-col overflow-y-auto scroll-smooth">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                {/* 🔹 Summary cards */}
                <SectionCards />

                {/* 📈 Analytics */}
                <div className="px-4 lg:px-6">
                  <ChartAreaInteractive />
                </div>

                {/* 🗂️ Data Table */}
                <DataTable data={data} />
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
