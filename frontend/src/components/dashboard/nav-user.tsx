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

  // 🌀 Loading state
  if (loading)
    return (
      <div className="flex items-center justify-center h-10 w-10">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      </div>
    );

  // 🔑 Not logged in
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
          "w-auto max-w-[18rem] min-w-[13rem] rounded-lg border border-border/50 bg-popover/95 backdrop-blur-md shadow-lg",
          "animate-in fade-in-0 zoom-in-95"
        )}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <Avatar className="h-10 w-10 rounded-full ring-1 ring-border/40 shrink-0">
              <AvatarImage src={user.avatarUrl || ""} alt={user.name || ""} />
              <AvatarFallback className="rounded-full bg-muted text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col min-w-0 max-w-[12rem]">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[15px] font-medium text-foreground truncate">
                  {user.name || "User"}
                </span>
                {user.role && <span className={roleColor}>{user.role}</span>}
              </div>
              <span className="text-xs text-muted-foreground truncate">
                {user.email}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="my-1 h-[1px] bg-border/80" />

        <DropdownMenuGroup>
          {[
            {
              label: "Profile",
              icon: IconUserCircle,
              action: () => router.push("/profile"),
            },
            {
              label: "Security",
              icon: IconShieldLock,
              action: () => router.push("/security"),
            },
            {
              label: "Settings",
              icon: IconSettings,
              action: () => router.push("/settings"),
            },
          ].map(({ label, icon: Icon, action }) => (
            <DropdownMenuItem
              key={label}
              onClick={action}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-[14px] font-medium cursor-pointer select-none",
                "transition-all duration-150 rounded-md",
                "hover:bg-accent/60 hover:text-foreground",
                "active:bg-accent/70 active:scale-[0.99]"
              )}
            >
              <Icon className="size-4 text-muted-foreground/80 shrink-0" />
              <span className="truncate">{label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="my-1 h-[1px] bg-border/80" />

        <DropdownMenuItem
          onClick={handleLogout}
          className={cn(
            "flex w-full items-center gap-2 px-3 py-2 text-[14px] font-medium cursor-pointer select-none",
            "text-destructive hover:bg-destructive/10 hover:text-destructive active:bg-destructive/15",
            "rounded-md transition-all duration-150"
          )}
        >
          <IconLogout className="size-4 shrink-0 opacity-90" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
