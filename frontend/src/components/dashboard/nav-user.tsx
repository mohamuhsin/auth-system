"use client";

import {
  IconCreditCard,
  IconLogout,
  IconNotification,
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
   🧩 Refined NavUser (Pixel-aligned with Header & Sidebar)
============================================================ */
export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent/60 transition-all duration-150"
          )}
        >
          {/* Avatar — matches header icon scale */}
          <Avatar className="h-8 w-8 rounded-md">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="rounded-md bg-muted text-[10px] font-medium">
              MM
            </AvatarFallback>
          </Avatar>

          {/* Name (visible only on md+) */}
          <span className="hidden sm:inline text-[15px] font-medium truncate max-w-[110px] text-foreground">
            {user.name}
          </span>

          {/* Dots Icon — same visual weight as Bell */}
          <IconDotsVertical className="size-5 text-muted-foreground hidden sm:block" />
        </Button>
      </DropdownMenuTrigger>

      {/* Dropdown Content */}
      <DropdownMenuContent
        className="min-w-56 rounded-lg shadow-md"
        side="bottom"
        align="end"
        sideOffset={8}
      >
        {/* User summary */}
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar className="h-9 w-9 rounded-md">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="rounded-md bg-muted">
                MM
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col leading-tight">
              <span className="text-[15px] font-medium">{user.name}</span>
              <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                {user.email}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Menu items */}
        <DropdownMenuGroup>
          <DropdownMenuItem className="text-[14.5px]">
            <IconUserCircle className="size-4 mr-2 opacity-80" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem className="text-[14.5px]">
            <IconNotification className="size-4 mr-2 opacity-80" />
            Security
          </DropdownMenuItem>
          <DropdownMenuItem className="text-[14.5px]">
            <IconCreditCard className="size-4 mr-2 opacity-80" />
            Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem className="text-[14.5px] text-red-600 focus:text-red-600">
          <IconLogout className="size-4 mr-2 opacity-90" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
