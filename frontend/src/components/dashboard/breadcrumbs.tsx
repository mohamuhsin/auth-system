"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export function PageBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // ✅ Configurable app/system name
  const systemName = process.env.NEXT_PUBLIC_APP_NAME || "Auth System";

  // 🧭 Build breadcrumb trail
  const crumbs = [
    { name: systemName, href: "/" },
    ...segments.map((segment, index) => ({
      name:
        segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " "),
      href: "/" + segments.slice(0, index + 1).join("/"),
    })),
  ];

  // 🧩 Last page name for small screens
  const currentPage = crumbs[crumbs.length - 1]?.name || systemName;

  return (
    <Breadcrumb>
      {/* 👇 Full breadcrumb (desktop & tablet) */}
      <BreadcrumbList className="hidden md:flex">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;

          return (
            <BreadcrumbItem key={crumb.href}>
              {!isLast ? (
                <>
                  <BreadcrumbLink
                    href={crumb.href}
                    className="text-muted-foreground hover:text-foreground transition"
                  >
                    {crumb.name}
                  </BreadcrumbLink>
                  <BreadcrumbSeparator />
                </>
              ) : (
                <BreadcrumbPage className="font-medium text-foreground">
                  {crumb.name}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>

      {/* 👇 Condensed version (mobile) */}
      <div className="block md:hidden font-medium text-foreground">
        {currentPage}
      </div>
    </Breadcrumb>
  );
}
