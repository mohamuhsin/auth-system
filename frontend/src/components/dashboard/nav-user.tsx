"use client";

import {
  IconLogout,
  IconShieldLock,
  IconUserCircle,
  IconSettings,
} from "@tabler/icons-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/authContext";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function NavUser() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const { isMobile } = useSidebar();

  /* 🌀 Loading */
  if (loading)
    return (
      <div className="flex items-center justify-center h-10 w-10">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      </div>
    );

  /* 🔑 Not logged in */
  if (!user)
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            className="justify-center text-sm font-medium"
            onClick={() => router.push("/login")}
          >
            Login
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );

  /* 🧩 Initials + Role Color */
  const initials =
    user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "US";

  const roleColor = cn(
    "border border-border/40 text-[10.5px] font-semibold px-1.5 py-[1px] rounded-md capitalize leading-none whitespace-nowrap",
    user.role?.toLowerCase() === "admin" && "bg-primary/15 text-primary",
    user.role?.toLowerCase() === "creator" &&
      "bg-emerald-500/15 text-emerald-500",
    user.role?.toLowerCase() === "merchant" && "bg-amber-500/15 text-amber-600",
    user.role?.toLowerCase() === "user" && "bg-muted text-muted-foreground"
  );

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  /* 🌟 Sidebar-Compatible Dropdown */
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              {/* Avatar */}
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage src={user.avatarUrl || ""} alt={user.name || ""} />
                <AvatarFallback className="rounded-lg text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {/* User Info */}
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {user.email}
                </span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="min-w-56 rounded-lg border border-border/40 bg-popover/95 backdrop-blur-md shadow-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            {/* 🧩 Header */}
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-2 py-2 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg ring-1 ring-border/40">
                  <AvatarImage
                    src={user.avatarUrl || ""}
                    alt={user.name || "User"}
                  />
                  <AvatarFallback className="rounded-lg text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="truncate font-medium text-foreground">
                      {user.name}
                    </span>
                    {user.role && (
                      <span className={roleColor}>{user.role}</span>
                    )}
                  </div>
                  <span className="text-muted-foreground truncate text-xs">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            {/* 🧭 Menu Items */}
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="flex items-center gap-2 text-[14px] cursor-pointer px-2.5 py-1.5 transition-colors hover:bg-accent/50"
                onClick={() => router.push("/profile")}
              >
                <IconUserCircle className="size-4 text-muted-foreground/80" />
                Profile
              </DropdownMenuItem>

              <DropdownMenuItem
                className="flex items-center gap-2 text-[14px] cursor-pointer px-2.5 py-1.5 transition-colors hover:bg-accent/50"
                onClick={() => router.push("/security")}
              >
                <IconShieldLock className="size-4 text-muted-foreground/80" />
                Security
              </DropdownMenuItem>

              <DropdownMenuItem
                className="flex items-center gap-2 text-[14px] cursor-pointer px-2.5 py-1.5 transition-colors hover:bg-accent/50"
                onClick={() => router.push("/settings")}
              >
                <IconSettings className="size-4 text-muted-foreground/80" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            {/* 🔴 Logout */}
            <DropdownMenuItem
              onClick={handleLogout}
              className={cn(
                "flex items-center gap-2 text-[14px] cursor-pointer px-2.5 py-1.5 font-medium",
                "text-destructive hover:bg-destructive/10 transition-colors"
              )}
            >
              <IconLogout className="size-4 opacity-90" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
