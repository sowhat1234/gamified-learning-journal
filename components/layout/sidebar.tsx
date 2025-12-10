"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  Trophy,
  Menu,
  Sparkles,
  Settings,
  ShoppingBag,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { XPBar } from "@/components/XPBar";
import { useState } from "react";

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Journal",
    href: "/journal",
    icon: BookOpen,
  },
  {
    title: "Review",
    href: "/journal/review",
    icon: ClipboardList,
  },
  {
    title: "Stats",
    href: "/stats",
    icon: BarChart3,
  },
  {
    title: "Achievements",
    href: "/achievements",
    icon: Trophy,
  },
  {
    title: "Shop",
    href: "/shop",
    icon: ShoppingBag,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

function NavItem({
  item,
  isActive,
  collapsed = false,
}: {
  item: (typeof navItems)[0];
  isActive: boolean;
  collapsed?: boolean;
}) {
  const Icon = item.icon;

  const content = (
    <Link
      href={item.href}
      aria-label={`Navigate to ${item.title}`}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      {isActive && (
        <motion.div
          layoutId="activeNav"
          className="absolute inset-0 rounded-xl bg-primary"
          initial={false}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
      )}
      <Icon
        className={cn(
          "relative z-10 h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110",
          isActive && "text-primary-foreground"
        )}
      />
      {!collapsed && (
        <span className="relative z-10 truncate">{item.title}</span>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {item.title}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <TooltipProvider>
      <aside className="hidden h-screen w-64 flex-col border-r bg-card/50 backdrop-blur-xl lg:flex">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">App</span>
        </div>

        <Separator />

        {/* XP Progress */}
        <div className="px-3 py-3">
          <XPBar variant="compact" />
        </div>

        <Separator />

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              isActive={pathname === item.href || (item.href !== "/journal" && pathname.startsWith(item.href))}
            />
          ))}
        </nav>

        <Separator />

        {/* Footer - Theme Switcher */}
        <div className="flex items-center justify-between px-4 py-4">
          <ThemeSwitcher variant="default" />
        </div>
      </aside>
    </TooltipProvider>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">App</span>
          </SheetTitle>
        </SheetHeader>

        {/* XP Progress */}
        <div className="border-b px-4 py-3">
          <XPBar variant="compact" />
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          <TooltipProvider>
            {navItems.map((item) => (
              <div key={item.href} onClick={() => setOpen(false)}>
                <NavItem item={item} isActive={pathname === item.href} />
              </div>
            ))}
          </TooltipProvider>
        </nav>
        <Separator />
        <div className="flex items-center px-4 py-4">
          <TooltipProvider>
            <ThemeSwitcher variant="default" />
          </TooltipProvider>
        </div>
      </SheetContent>
    </Sheet>
  );
}
