"use client";

import {
  IconCreditCard,
  IconLogout,
  IconShieldLock,
  IconUserCircle,
  IconDotsVertical,
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

/* ============================================================
   👤 NavUser — Premium Polished Version (Iventics Standard)
============================================================ */
export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar?: string;
    role?: string;
  };
}) {
  const initials =
    user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "US";

  // 🎨 Role-based badge styling
  const roleColor = cn(
    "border border-border/40 text-[11px] font-semibold px-1.5 py-[1px] rounded-md capitalize leading-none",
    user.role?.toLowerCase() === "admin" && "bg-primary/15 text-primary",
    user.role?.toLowerCase() === "creator" &&
      "bg-emerald-500/15 text-emerald-500",
    user.role?.toLowerCase() === "merchant" && "bg-amber-500/15 text-amber-600",
    !user.role && "bg-muted text-muted-foreground"
  );

  return (
    <DropdownMenu>
      {/* ========================== 🔘 Trigger ========================== */}
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 transition-all duration-150",
            "hover:bg-accent/60 focus-visible:ring-1 focus-visible:ring-ring"
          )}
        >
          {/* Avatar */}
          <Avatar className="h-8 w-8 rounded-md ring-1 ring-border/50">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="rounded-md bg-muted text-[10px] font-medium uppercase">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Name (md+) */}
          <span className="hidden sm:inline text-[15px] font-medium truncate max-w-[110px] text-foreground">
            {user.name}
          </span>

          {/* Dots */}
          <IconDotsVertical
            className="hidden sm:block size-5 text-muted-foreground transition-opacity duration-150 group-hover:opacity-90"
            strokeWidth={1.5}
          />
        </Button>
      </DropdownMenuTrigger>

      {/* ========================== 📋 Dropdown ========================== */}
      <DropdownMenuContent
        side="bottom"
        align="end"
        sideOffset={8}
        className={cn(
          "min-w-56 rounded-lg border border-border/50 bg-popover/95 backdrop-blur-md shadow-lg",
          "animate-in fade-in-0 zoom-in-95"
        )}
      >
        {/* User summary */}
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <Avatar className="h-9 w-9 rounded-md ring-1 ring-border/40">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="rounded-md bg-muted text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col min-w-0 leading-tight">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-medium text-foreground truncate">
                  {user.name}
                </span>
                {user.role && <span className={roleColor}>{user.role}</span>}
              </div>
              <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                {user.email}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Menu group */}
        <DropdownMenuGroup>
          <DropdownMenuItem className="text-[14.5px] cursor-pointer hover:bg-accent/50 transition-colors">
            <IconUserCircle className="size-4 mr-2 text-muted-foreground/80" />
            Profile
          </DropdownMenuItem>

          <DropdownMenuItem className="text-[14.5px] cursor-pointer hover:bg-accent/50 transition-colors">
            <IconShieldLock className="size-4 mr-2 text-muted-foreground/80" />
            Security
          </DropdownMenuItem>

          <DropdownMenuItem className="text-[14.5px] cursor-pointer hover:bg-accent/50 transition-colors">
            <IconCreditCard className="size-4 mr-2 text-muted-foreground/80" />
            Billing & Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem
          className={cn(
            "text-[14.5px] text-destructive focus:text-destructive cursor-pointer font-medium",
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
