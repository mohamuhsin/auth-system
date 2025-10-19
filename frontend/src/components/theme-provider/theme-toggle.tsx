"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Monitor, Sun, Moon } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: "system", icon: Monitor, label: "System" },
    { value: "light", icon: Sun, label: "Light" },
    { value: "dark", icon: Moon, label: "Dark" },
  ];

  return (
    <ToggleGroup
      type="single"
      value={theme}
      onValueChange={(val) => val && setTheme(val)}
      className={cn(
        "flex overflow-hidden rounded-md border border-border/70 shadow-sm backdrop-blur-sm",
        "bg-background/70 transition-all duration-200 hover:border-border/90"
      )}
    >
      {options.map(({ value, icon: Icon, label }, index) => {
        const isActive = theme === value;
        const isFirst = index === 0;
        const isLast = index === options.length - 1;

        return (
          <ToggleGroupItem
            key={value}
            value={value}
            aria-label={label}
            className={cn(
              "relative flex items-center justify-center size-8 transition-all duration-200",
              "hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              "text-muted-foreground",
              isActive && "bg-accent text-accent-foreground shadow-sm",
              // ensure border divisions between items are crisp
              !isLast && "border-r border-border/60",
              // perfectly attach each button to container borders
              isFirst && "rounded-l-md",
              isLast && "rounded-r-md"
            )}
          >
            <Icon className="size-[15px]" />
            {isActive && (
              <span className="absolute inset-0 rounded-md ring-1 ring-inset ring-accent/50" />
            )}
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}
