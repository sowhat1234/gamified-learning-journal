"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Palette,
  PartyPopper,
  Award,
  Coins,
  Check,
  ShoppingBag,
  Sparkles,
  Lock,
  Gift,
  Wand2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGamification, useGamificationStore } from "@/hooks/useGamification";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

export type ShopItemId =
  | "theme-pack-ocean"
  | "theme-pack-forest"
  | "theme-pack-sunset"
  | "confetti-stars"
  | "confetti-hearts"
  | "confetti-fireworks"
  | "badge-scholar"
  | "badge-explorer"
  | "badge-champion";

export type ShopItemCategory = "themes" | "confetti" | "badges";

export interface ShopItem {
  id: ShopItemId;
  name: string;
  description: string;
  price: number;
  category: ShopItemCategory;
  icon: string;
  color: string;
  preview?: string;
}

interface ShopState {
  ownedItems: ShopItemId[];
  purchaseHistory: { itemId: ShopItemId; purchasedAt: string }[];
  activeTheme: ShopItemId | null;
  activeConfetti: ShopItemId | null;
  activeBadge: ShopItemId | null;
}

interface RewardShopProps {
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = "reward-shop-storage";

const SHOP_ITEMS: ShopItem[] = [
  // Theme Packs
  {
    id: "theme-pack-ocean",
    name: "Ocean Theme",
    description: "Cool blue tones inspired by the deep sea",
    price: 10,
    category: "themes",
    icon: "🌊",
    color: "cyan",
    preview: "Linear gradient from cyan to blue",
  },
  {
    id: "theme-pack-forest",
    name: "Forest Theme",
    description: "Calming green palette from nature",
    price: 10,
    category: "themes",
    icon: "🌲",
    color: "emerald",
    preview: "Linear gradient from emerald to green",
  },
  {
    id: "theme-pack-sunset",
    name: "Sunset Theme",
    description: "Warm orange and pink gradients",
    price: 10,
    category: "themes",
    icon: "🌅",
    color: "orange",
    preview: "Linear gradient from orange to pink",
  },
  // Confetti Styles
  {
    id: "confetti-stars",
    name: "Star Burst",
    description: "Celebration with golden stars",
    price: 20,
    category: "confetti",
    icon: "⭐",
    color: "amber",
  },
  {
    id: "confetti-hearts",
    name: "Love Shower",
    description: "Raining hearts for achievements",
    price: 20,
    category: "confetti",
    icon: "💖",
    color: "pink",
  },
  {
    id: "confetti-fireworks",
    name: "Fireworks",
    description: "Explosive celebration effects",
    price: 20,
    category: "confetti",
    icon: "🎆",
    color: "violet",
  },
  // Avatar Badges
  {
    id: "badge-scholar",
    name: "Scholar Badge",
    description: "Show off your dedication to learning",
    price: 15,
    category: "badges",
    icon: "📚",
    color: "blue",
  },
  {
    id: "badge-explorer",
    name: "Explorer Badge",
    description: "For curious minds who explore",
    price: 15,
    category: "badges",
    icon: "🧭",
    color: "teal",
  },
  {
    id: "badge-champion",
    name: "Champion Badge",
    description: "The mark of a true achiever",
    price: 15,
    category: "badges",
    icon: "🏆",
    color: "yellow",
  },
];

const CATEGORY_INFO: Record<
  ShopItemCategory,
  { name: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  themes: { name: "Theme Packs", icon: Palette, color: "violet" },
  confetti: { name: "Confetti Styles", icon: PartyPopper, color: "amber" },
  badges: { name: "Avatar Badges", icon: Award, color: "emerald" },
};

const INITIAL_STATE: ShopState = {
  ownedItems: [],
  purchaseHistory: [],
  activeTheme: null,
  activeConfetti: null,
  activeBadge: null,
};

// ============================================================================
// Animation Variants
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24,
    },
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

function loadShopState(): ShopState {
  if (typeof window === "undefined") return INITIAL_STATE;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ownedItems: parsed.ownedItems || [],
        purchaseHistory: parsed.purchaseHistory || [],
        activeTheme: parsed.activeTheme || null,
        activeConfetti: parsed.activeConfetti || null,
        activeBadge: parsed.activeBadge || null,
      };
    }
  } catch (error) {
    console.error("Failed to load shop state:", error);
  }
  return INITIAL_STATE;
}

function saveShopState(state: ShopState): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save shop state:", error);
  }
}

function getItemColorClasses(color: string) {
  const colorMap: Record<string, { bg: string; border: string; text: string; badge: string }> = {
    cyan: {
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/30 hover:border-cyan-500",
      text: "text-cyan-500",
      badge: "bg-cyan-500",
    },
    emerald: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30 hover:border-emerald-500",
      text: "text-emerald-500",
      badge: "bg-emerald-500",
    },
    orange: {
      bg: "bg-orange-500/10",
      border: "border-orange-500/30 hover:border-orange-500",
      text: "text-orange-500",
      badge: "bg-orange-500",
    },
    amber: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/30 hover:border-amber-500",
      text: "text-amber-500",
      badge: "bg-amber-500",
    },
    pink: {
      bg: "bg-pink-500/10",
      border: "border-pink-500/30 hover:border-pink-500",
      text: "text-pink-500",
      badge: "bg-pink-500",
    },
    violet: {
      bg: "bg-violet-500/10",
      border: "border-violet-500/30 hover:border-violet-500",
      text: "text-violet-500",
      badge: "bg-violet-500",
    },
    blue: {
      bg: "bg-blue-500/10",
      border: "border-blue-500/30 hover:border-blue-500",
      text: "text-blue-500",
      badge: "bg-blue-500",
    },
    teal: {
      bg: "bg-teal-500/10",
      border: "border-teal-500/30 hover:border-teal-500",
      text: "text-teal-500",
      badge: "bg-teal-500",
    },
    yellow: {
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/30 hover:border-yellow-500",
      text: "text-yellow-500",
      badge: "bg-yellow-500",
    },
  };

  return colorMap[color] || colorMap.violet;
}

// ============================================================================
// Shop Item Card Component
// ============================================================================

interface ShopItemCardProps {
  item: ShopItem;
  owned: boolean;
  active: boolean;
  canAfford: boolean;
  onPurchase: () => void;
  onApply: () => void;
}

function ShopItemCard({ item, owned, active, canAfford, onPurchase, onApply }: ShopItemCardProps) {
  const colors = getItemColorClasses(item.color);

  return (
    <motion.div variants={itemVariants}>
      <Card
        className={cn(
          "group relative overflow-hidden border-2 transition-all",
          colors.border,
          owned && "bg-muted/30",
          active && "ring-2 ring-emerald-500 ring-offset-2"
        )}
      >
        {/* Owned/Active badge */}
        {owned && (
          <div className="absolute right-2 top-2 z-10">
            <Badge className={cn("gap-1 text-white", active ? "bg-emerald-500" : "bg-emerald-500/80")}>
              <Check className="h-3 w-3" />
              {active ? "Active" : "Owned"}
            </Badge>
          </div>
        )}

        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl transition-transform group-hover:scale-110",
                colors.bg
              )}
            >
              {item.icon}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold">{item.name}</h4>
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                {item.description}
              </p>
            </div>
          </div>

          {/* Price and action */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Coins className={cn("h-4 w-4", colors.text)} />
              <span className="font-bold">{item.price}</span>
              <span className="text-xs text-muted-foreground">XP</span>
            </div>

            {owned ? (
              active ? (
                <Button variant="outline" size="sm" disabled className="gap-1">
                  <Check className="h-3.5 w-3.5" />
                  Active
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={onApply}
                  className={cn("gap-1", colors.badge, "text-white hover:opacity-90")}
                >
                  <Wand2 className="h-3.5 w-3.5" />
                  Apply
                </Button>
              )
            ) : (
              <Button
                size="sm"
                onClick={onPurchase}
                disabled={!canAfford}
                className={cn(
                  "gap-1 transition-all",
                  canAfford && colors.badge,
                  canAfford && "text-white hover:opacity-90"
                )}
              >
                {canAfford ? (
                  <>
                    <ShoppingBag className="h-3.5 w-3.5" />
                    Buy
                  </>
                ) : (
                  <>
                    <Lock className="h-3.5 w-3.5" />
                    {item.price - useGamificationStore.getState().xp} more
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// Purchase Success Dialog
// ============================================================================

interface PurchaseDialogProps {
  item: ShopItem | null;
  open: boolean;
  onClose: () => void;
}

function PurchaseDialog({ item, open, onClose }: PurchaseDialogProps) {
  if (!item) return null;

  const colors = getItemColorClasses(item.color);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-emerald-500" />
            Purchase Complete!
          </DialogTitle>
          <DialogDescription>
            You&apos;ve unlocked a new item for your collection.
          </DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="flex flex-col items-center py-6"
        >
          <div
            className={cn(
              "mb-4 flex h-20 w-20 items-center justify-center rounded-2xl text-4xl",
              colors.bg
            )}
          >
            {item.icon}
          </div>
          <h3 className="text-xl font-bold">{item.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
          <div className="mt-4 flex items-center gap-1.5 text-sm">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="font-medium">-{item.price} XP</span>
          </div>
        </motion.div>

        <Button onClick={onClose} className="w-full">
          Awesome!
        </Button>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function RewardShop({ className }: RewardShopProps) {
  const { xp, spendXP } = useGamification();
  const [shopState, setShopState] = useState<ShopState>(INITIAL_STATE);
  const [purchasedItem, setPurchasedItem] = useState<ShopItem | null>(null);
  const [mounted, setMounted] = useState(false);

  // Load state on mount
  useEffect(() => {
    setShopState(loadShopState());
    setMounted(true);
  }, []);

  // Apply theme when active theme changes
  useEffect(() => {
    if (shopState.activeTheme) {
      // Map shop theme IDs to theme colors
      const themeColorMap: Record<string, string> = {
        "theme-pack-ocean": "blue",
        "theme-pack-forest": "green",
        "theme-pack-sunset": "orange",
      };
      const color = themeColorMap[shopState.activeTheme];
      if (color) {
        localStorage.setItem("theme-color", color);
        document.documentElement.setAttribute("data-theme-color", color);
      }
    }
  }, [shopState.activeTheme]);

  // Group items by category
  const itemsByCategory = useMemo(() => {
    const grouped: Record<ShopItemCategory, ShopItem[]> = {
      themes: [],
      confetti: [],
      badges: [],
    };

    SHOP_ITEMS.forEach((item) => {
      grouped[item.category].push(item);
    });

    return grouped;
  }, []);

  // Check if item is owned
  const isOwned = useCallback(
    (itemId: ShopItemId) => {
      return shopState.ownedItems.includes(itemId);
    },
    [shopState.ownedItems]
  );

  // Check if item is active
  const isActive = useCallback(
    (item: ShopItem) => {
      if (item.category === "themes") return shopState.activeTheme === item.id;
      if (item.category === "confetti") return shopState.activeConfetti === item.id;
      if (item.category === "badges") return shopState.activeBadge === item.id;
      return false;
    },
    [shopState.activeTheme, shopState.activeConfetti, shopState.activeBadge]
  );

  // Handle purchase
  const handlePurchase = useCallback(
    (item: ShopItem) => {
      if (xp < item.price || isOwned(item.id)) return;

      // Deduct XP using spendXP
      const success = spendXP(item.price);
      if (!success) return;

      // Update shop state
      const newState: ShopState = {
        ...shopState,
        ownedItems: [...shopState.ownedItems, item.id],
        purchaseHistory: [
          ...shopState.purchaseHistory,
          { itemId: item.id, purchasedAt: new Date().toISOString() },
        ],
      };
      setShopState(newState);
      saveShopState(newState);

      // Show success dialog
      setPurchasedItem(item);
    },
    [xp, shopState, isOwned, spendXP]
  );

  // Handle apply
  const handleApply = useCallback(
    (item: ShopItem) => {
      if (!isOwned(item.id)) return;

      const newState = { ...shopState };

      if (item.category === "themes") {
        newState.activeTheme = item.id;
      } else if (item.category === "confetti") {
        newState.activeConfetti = item.id;
      } else if (item.category === "badges") {
        newState.activeBadge = item.id;
      }

      setShopState(newState);
      saveShopState(newState);
    },
    [shopState, isOwned]
  );

  // Stats
  const ownedCount = shopState.ownedItems.length;
  const totalItems = SHOP_ITEMS.length;

  if (!mounted) {
    return null;
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <ShoppingBag className="h-6 w-6 text-violet-500" />
            Reward Shop
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Spend your earned XP on cosmetic rewards
          </p>
        </div>

        {/* XP Balance */}
        <Card className="border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20">
              <Coins className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Your Balance</p>
              <p className="text-xl font-bold">{xp.toLocaleString()} XP</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Collection progress */}
      <Card className="bg-muted/30">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-violet-500" />
            <span className="font-medium">Collection Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full bg-gradient-to-r from-violet-500 to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: `${(ownedCount / totalItems) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <span className="text-sm font-medium">
              {ownedCount}/{totalItems}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      {(Object.entries(itemsByCategory) as [ShopItemCategory, ShopItem[]][]).map(
        ([category, items]) => {
          const categoryInfo = CATEGORY_INFO[category];
          const CategoryIcon = categoryInfo.icon;

          return (
            <div key={category}>
              <div className="mb-4 flex items-center gap-2">
                <CategoryIcon
                  className={cn(
                    "h-5 w-5",
                    category === "themes" && "text-violet-500",
                    category === "confetti" && "text-amber-500",
                    category === "badges" && "text-emerald-500"
                  )}
                />
                <h3 className="font-semibold">{categoryInfo.name}</h3>
                <Badge variant="secondary" className="text-xs">
                  {items.filter((i) => isOwned(i.id)).length}/{items.length}
                </Badge>
              </div>

              <motion.div
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {items.map((item) => (
                  <ShopItemCard
                    key={item.id}
                    item={item}
                    owned={isOwned(item.id)}
                    active={isActive(item)}
                    canAfford={xp >= item.price}
                    onPurchase={() => handlePurchase(item)}
                    onApply={() => handleApply(item)}
                  />
                ))}
              </motion.div>
            </div>
          );
        }
      )}

      {/* Purchase success dialog */}
      <PurchaseDialog
        item={purchasedItem}
        open={!!purchasedItem}
        onClose={() => setPurchasedItem(null)}
      />
    </div>
  );
}

// ============================================================================
// Utility Hook for Owned Items
// ============================================================================

export function useOwnedShopItems(): ShopItemId[] {
  const [owned, setOwned] = useState<ShopItemId[]>([]);

  useEffect(() => {
    const state = loadShopState();
    setOwned(state.ownedItems);
  }, []);

  return owned;
}

export function useShopItem(itemId: ShopItemId): ShopItem | undefined {
  return SHOP_ITEMS.find((item) => item.id === itemId);
}

// Hook to get active theme from shop
export function useActiveShopTheme(): { activeTheme: ShopItemId | null; themeColor: string | null } {
  const [activeTheme, setActiveTheme] = useState<ShopItemId | null>(null);

  useEffect(() => {
    const state = loadShopState();
    setActiveTheme(state.activeTheme);
  }, []);

  const themeColorMap: Record<string, string> = {
    "theme-pack-ocean": "blue",
    "theme-pack-forest": "green",
    "theme-pack-sunset": "orange",
  };

  return {
    activeTheme,
    themeColor: activeTheme ? themeColorMap[activeTheme] || null : null,
  };
}

// Hook to check if user owns any themes (bypasses level requirement)
export function useOwnsAnyTheme(): boolean {
  const [ownsTheme, setOwnsTheme] = useState(false);

  useEffect(() => {
    const state = loadShopState();
    const themeItems = SHOP_ITEMS.filter((item) => item.category === "themes");
    const hasTheme = themeItems.some((item) => state.ownedItems.includes(item.id));
    setOwnsTheme(hasTheme);
  }, []);

  return ownsTheme;
}

export { SHOP_ITEMS, loadShopState };
export default RewardShop;

