"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
  Sun,
  Moon,
  Monitor,
  Palette,
  Lock,
  Check,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useGamification } from "@/hooks/useGamification";
import { useOwnsAnyTheme } from "@/components/RewardShop";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

type ThemeColor = "default" | "rose" | "blue" | "green" | "orange" | "violet";

interface ThemeOption {
  id: ThemeColor;
  name: string;
  colors: {
    primary: string;
    accent: string;
  };
}

// ============================================================================
// Constants
// ============================================================================

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "default",
    name: "Default",
    colors: { primary: "bg-zinc-900 dark:bg-zinc-50", accent: "bg-zinc-700" },
  },
  {
    id: "rose",
    name: "Rose",
    colors: { primary: "bg-rose-500", accent: "bg-rose-400" },
  },
  {
    id: "blue",
    name: "Ocean",
    colors: { primary: "bg-blue-500", accent: "bg-blue-400" },
  },
  {
    id: "green",
    name: "Forest",
    colors: { primary: "bg-emerald-500", accent: "bg-emerald-400" },
  },
  {
    id: "orange",
    name: "Sunset",
    colors: { primary: "bg-orange-500", accent: "bg-orange-400" },
  },
  {
    id: "violet",
    name: "Amethyst",
    colors: { primary: "bg-violet-500", accent: "bg-violet-400" },
  },
];

// ============================================================================
// Theme Color Switcher Component
// ============================================================================

function ThemeColorSwitcher({
  isUnlocked,
  requiredLevel,
}: {
  isUnlocked: boolean;
  requiredLevel: number;
}) {
  const [selectedColor, setSelectedColor] = useState<ThemeColor>("default");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme-color");
    if (saved && isUnlocked) {
      setSelectedColor(saved as ThemeColor);
      document.documentElement.setAttribute("data-theme-color", saved);
    }
  }, [isUnlocked]);

  const handleSelectColor = (color: ThemeColor) => {
    if (!isUnlocked) return;
    setSelectedColor(color);
    localStorage.setItem("theme-color", color);
    document.documentElement.setAttribute("data-theme-color", color);
    setIsOpen(false);
  };

  const currentTheme = THEME_OPTIONS.find((t) => t.id === selectedColor);

  if (!isUnlocked) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 opacity-50 cursor-not-allowed"
              disabled
            >
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">Themes</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Unlock at Level {requiredLevel}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="gap-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className={cn("h-4 w-4 rounded-full", currentTheme?.colors.primary)} />
        <span className="hidden sm:inline">{currentTheme?.name}</span>
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border bg-popover p-2 shadow-lg"
            >
              <div className="mb-2 flex items-center gap-2 border-b px-2 pb-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  Color Theme
                </span>
              </div>
              <div className="space-y-1">
                {THEME_OPTIONS.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => handleSelectColor(theme.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      selectedColor === theme.id
                        ? "bg-accent"
                        : "hover:bg-accent/50"
                    )}
                  >
                    <div
                      className={cn(
                        "h-5 w-5 rounded-full shadow-inner",
                        theme.colors.primary
                      )}
                    />
                    <span className="flex-1 text-left">{theme.name}</span>
                    {selectedColor === theme.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Main Theme Switcher Component
// ============================================================================

interface ThemeSwitcherProps {
  showLabels?: boolean;
  className?: string;
  variant?: "default" | "compact" | "full";
}

export function ThemeSwitcher({
  showLabels = false,
  className,
  variant = "default",
}: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();
  const { isUnlocked, level } = useGamification();
  const ownsShopTheme = useOwnsAnyTheme();
  const [mounted, setMounted] = useState(false);

  const darkModeUnlocked = isUnlocked("dark-mode");
  // Themes unlocked either by level OR by purchasing from shop
  const themesUnlocked = isUnlocked("themes") || ownsShopTheme;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Force light mode if dark mode not unlocked (only run once when mounted changes)
  useEffect(() => {
    if (mounted && !darkModeUnlocked && theme === "dark") {
      setTheme("light");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, darkModeUnlocked]);

  if (!mounted) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Button variant="ghost" size="icon" className="h-9 w-9" disabled>
          <Sun className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // Compact variant - just the toggle
  if (variant === "compact") {
    if (!darkModeUnlocked) {
      return (
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 opacity-50 cursor-not-allowed"
                disabled
              >
                <Lock className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Dark Mode unlocks at Level 3</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full variant - with theme colors
  if (variant === "full") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {/* Dark Mode Toggle */}
        {darkModeUnlocked ? (
          <div className="flex items-center rounded-lg border bg-muted/50 p-1">
            <button
              onClick={() => setTheme("light")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-all",
                theme === "light"
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Sun className="h-4 w-4" />
              {showLabels && <span>Light</span>}
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-all",
                theme === "dark"
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Moon className="h-4 w-4" />
              {showLabels && <span>Dark</span>}
            </button>
            <button
              onClick={() => setTheme("system")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-all",
                theme === "system"
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Monitor className="h-4 w-4" />
              {showLabels && <span>System</span>}
            </button>
          </div>
        ) : (
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 opacity-50">
                  <Lock className="h-4 w-4" />
                  <span className="text-sm">Dark Mode</span>
                  <Sparkles className="h-3 w-3 text-amber-500" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reach Level 3 to unlock Dark Mode</p>
                <p className="text-xs text-muted-foreground">
                  Current: Level {level}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Theme Color Selector */}
        <ThemeColorSwitcher isUnlocked={themesUnlocked} requiredLevel={5} />
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Dark Mode Toggle */}
      {darkModeUnlocked ? (
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 opacity-50 cursor-not-allowed"
                disabled
              >
                <Lock className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <div className="flex items-center gap-2">
                <Lock className="h-3 w-3" />
                <span>Unlock at Level 3</span>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Theme Colors */}
      {themesUnlocked && <ThemeColorSwitcher isUnlocked={true} requiredLevel={5} />}
    </div>
  );
}

// ============================================================================
// Unlock Status Component (for settings/display)
// ============================================================================

export function ThemeUnlockStatus({ className }: { className?: string }) {
  const { isUnlocked, level } = useGamification();
  const darkModeUnlocked = isUnlocked("dark-mode");
  const themesUnlocked = isUnlocked("themes");

  return (
    <div className={cn("space-y-3", className)}>
      {/* Dark Mode Status */}
      <div
        className={cn(
          "flex items-center justify-between rounded-lg border p-3",
          darkModeUnlocked
            ? "border-emerald-500/50 bg-emerald-500/5"
            : "border-muted bg-muted/30"
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              darkModeUnlocked
                ? "bg-emerald-500 text-white"
                : "bg-muted text-muted-foreground"
            )}
          >
            {darkModeUnlocked ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Lock className="h-5 w-5" />
            )}
          </div>
          <div>
            <p className="font-medium">Dark Mode</p>
            <p className="text-xs text-muted-foreground">
              {darkModeUnlocked ? "Unlocked!" : `Unlocks at Level 3`}
            </p>
          </div>
        </div>
        {darkModeUnlocked ? (
          <Check className="h-5 w-5 text-emerald-500" />
        ) : (
          <span className="text-sm text-muted-foreground">
            Level {level}/3
          </span>
        )}
      </div>

      {/* Themes Status */}
      <div
        className={cn(
          "flex items-center justify-between rounded-lg border p-3",
          themesUnlocked
            ? "border-emerald-500/50 bg-emerald-500/5"
            : "border-muted bg-muted/30"
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              themesUnlocked
                ? "bg-emerald-500 text-white"
                : "bg-muted text-muted-foreground"
            )}
          >
            {themesUnlocked ? (
              <Palette className="h-5 w-5" />
            ) : (
              <Lock className="h-5 w-5" />
            )}
          </div>
          <div>
            <p className="font-medium">Color Themes</p>
            <p className="text-xs text-muted-foreground">
              {themesUnlocked ? "Unlocked!" : `Unlocks at Level 5`}
            </p>
          </div>
        </div>
        {themesUnlocked ? (
          <Check className="h-5 w-5 text-emerald-500" />
        ) : (
          <span className="text-sm text-muted-foreground">
            Level {level}/5
          </span>
        )}
      </div>
    </div>
  );
}

