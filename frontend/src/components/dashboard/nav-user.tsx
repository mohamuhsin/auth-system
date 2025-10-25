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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/authContext";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function NavUser() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

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
      <Button
        size="sm"
        onClick={() => router.push("/login")}
        className="text-sm"
      >
        Login
      </Button>
    );

  /* 🧩 Initials + Role color */
  const initials =
    user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "US";

  const roleColor = cn(
    "border border-border/40 text-[11px] font-semibold px-1.5 py-[1px] rounded-md capitalize leading-none whitespace-nowrap",
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

  /* 🌟 UI */
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="User menu"
          className={cn(
            "relative flex size-[38px] items-center justify-center rounded-full overflow-hidden",
            "border border-border bg-background/50 hover:bg-accent/50",
            "hover:ring-2 hover:ring-accent/30 active:scale-[0.97]",
            "shadow-sm transition-all duration-150"
          )}
        >
          <Avatar className="size-full rounded-full">
            <AvatarImage
              src={user.avatarUrl || ""}
              alt={user.name || "User"}
              className="object-cover"
            />
            <AvatarFallback className="size-full rounded-full bg-muted text-[11px] font-semibold uppercase flex items-center justify-center">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="bottom"
        align="end"
        sideOffset={8}
        className={cn(
          "w-[--radix-dropdown-menu-trigger-width] min-w-max rounded-lg border border-border/50",
          "bg-popover/95 backdrop-blur-md shadow-lg animate-in fade-in-0 zoom-in-95"
        )}
      >
        {/* Header */}
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <Avatar className="h-10 w-10 rounded-full ring-1 ring-border/40 shrink-0">
              <AvatarImage src={user.avatarUrl || ""} alt={user.name || ""} />
              <AvatarFallback className="rounded-full bg-muted text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[15px] font-medium text-foreground truncate">
                  {user.name || "User"}
                </span>
                {user.role && <span className={roleColor}>{user.role}</span>}
              </div>
              <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                {user.email}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="my-1 h-[1px] bg-border/80" />

        {/* Menu Items */}
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="flex items-center gap-2 text-[14px] cursor-pointer whitespace-nowrap px-2.5 py-1.5 font-medium transition-colors hover:bg-accent/50"
            onClick={() => router.push("/profile")}
          >
            <IconUserCircle className="size-4 text-muted-foreground/80 shrink-0" />
            <span className="truncate">Profile</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="flex items-center gap-2 text-[14px] cursor-pointer whitespace-nowrap px-2.5 py-1.5 font-medium transition-colors hover:bg-accent/50"
            onClick={() => router.push("/security")}
          >
            <IconShieldLock className="size-4 text-muted-foreground/80 shrink-0" />
            <span className="truncate">Security</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="flex items-center gap-2 text-[14px] cursor-pointer whitespace-nowrap px-2.5 py-1.5 font-medium transition-colors hover:bg-accent/50"
            onClick={() => router.push("/settings")}
          >
            <IconSettings className="size-4 text-muted-foreground/80 shrink-0" />
            <span className="truncate">Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="my-1 h-[1px] bg-border/80" />

        {/* Logout */}
        <DropdownMenuItem
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-2 text-[14px] cursor-pointer whitespace-nowrap px-2.5 py-1.5 font-medium",
            "text-destructive hover:bg-destructive/10 transition-colors"
          )}
        >
          <IconLogout className="size-4 shrink-0 opacity-90" />
          <span className="truncate">Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
