"use client";

import {
  IconCreditCard,
  IconLogout,
  IconShieldLock,
  IconUserCircle,
} from "@tabler/icons-react";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/authContext";
import { useRouter } from "next/navigation";

/* ============================================================
   🌐 NavUser — Compact + Responsive Profile Dropdown
============================================================ */
export function NavUser() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  // 🚦 Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-10 w-10">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      </div>
    );

  if (!user)
    return (
      <Button
        size="sm"
        onClick={() => router.push("/login")}
        className="text-sm"
      >
        Login
      </Button>
    );

  const initials =
    user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "US";

  const roleColor = cn(
    "border border-border/40 text-[10.5px] font-semibold px-1.5 py-[1px] rounded-md capitalize leading-none whitespace-nowrap",
    user.role === "ADMIN" && "bg-primary/15 text-primary",
    user.role === "CREATOR" && "bg-emerald-500/15 text-emerald-500",
    user.role === "MERCHANT" && "bg-amber-500/15 text-amber-600",
    user.role === "USER" && "bg-muted text-muted-foreground"
  );

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  /* ============================================================
     🌟 UI
  ============================================================ */
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          aria-label="User menu"
          className={cn(
            "relative flex items-center rounded-full overflow-hidden",
            "border border-border bg-background/50 hover:bg-accent/50",
            "hover:ring-2 hover:ring-accent/30 active:scale-[0.97]",
            "shadow-sm transition-all duration-150 px-1.5 sm:px-2"
          )}
        >
          {/* 🧩 Avatar */}
          <Avatar className="size-8 sm:size-9 rounded-full">
            <AvatarImage
              src={user.avatarUrl || ""}
              alt={user.name || "User"}
              className="object-cover"
            />
            <AvatarFallback className="rounded-full bg-muted text-[11px] font-semibold uppercase flex items-center justify-center">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* 🧱 Username (shown only on mobile) */}
          <span className="ml-2 text-sm font-medium text-foreground truncate sm:hidden max-w-[90px]">
            {user.name || "User"}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="bottom"
        align="end"
        sideOffset={8}
        className={cn(
          "min-w-56 rounded-lg border border-border/50 bg-popover/95 backdrop-blur-md shadow-lg",
          "animate-in fade-in-0 zoom-in-95"
        )}
      >
        {/* Header */}
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2.5 px-3 py-2">
            <Avatar className="h-9 w-9 rounded-full ring-1 ring-border/40 shrink-0">
              <AvatarImage src={user.avatarUrl || ""} alt={user.name || ""} />
              <AvatarFallback className="rounded-full bg-muted text-[11px] font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col leading-tight min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[14.5px] font-medium truncate max-w-[130px]">
                  {user.name || "User"}
                </span>
                {user.role && <span className={roleColor}>{user.role}</span>}
              </div>
              <span className="text-[12px] text-muted-foreground truncate max-w-[160px]">
                {user.email}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="my-1 h-[1px] bg-border/80" />

        {/* Menu Items */}
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="text-[14px] cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => router.push("/profile")}
          >
            <IconUserCircle className="size-4 mr-2 text-muted-foreground/80" />
            Profile
          </DropdownMenuItem>

          <DropdownMenuItem
            className="text-[14px] cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => router.push("/security")}
          >
            <IconShieldLock className="size-4 mr-2 text-muted-foreground/80" />
            Security
          </DropdownMenuItem>

          <DropdownMenuItem
            className="text-[14px] cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => router.push("/billing")}
          >
            <IconCreditCard className="size-4 mr-2 text-muted-foreground/80" />
            Billing & Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="my-1 h-[1px] bg-border/80" />

        {/* Logout */}
        <DropdownMenuItem
          onClick={handleLogout}
          className={cn(
            "text-[14px] text-destructive focus:text-destructive cursor-pointer font-medium",
            "hover:bg-destructive/10 transition-colors"
          )}
        >
          <IconLogout className="size-4 mr-2 opacity-90" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
