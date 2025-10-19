"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Monitor, Sun, Moon } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // ✅ Ensure we only render after hydration
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const options = [
    { value: "system", icon: Monitor, label: "System" },
    { value: "light", icon: Sun, label: "Light" },
    { value: "dark", icon: Moon, label: "Dark" },
  ];

  // 🧩 If not mounted, render static placeholder to match SSR
  if (!mounted) {
    return (
      <div className="flex overflow-hidden rounded-md border border-border/70 shadow-sm backdrop-blur-sm bg-background/70 size-8">
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <Monitor className="size-[15px]" />
        </div>
      </div>
    );
  }

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
              !isLast && "border-r border-border/60",
              isFirst && "rounded-l-md",
              isLast && "rounded-r-md"
            )}
          >
            <Icon className="size-[15px]" />
            {/* ✅ Always render span for consistent SSR → CSR structure */}
            <span
              className={cn(
                "absolute inset-0 rounded-md ring-1 ring-inset ring-accent/50 transition-opacity",
                isActive ? "opacity-100" : "opacity-0"
              )}
            />
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}
