// Layout components
export * from "./layout";

// Providers
export * from "./providers";

// Feature components
export { GuidedJournalForm } from "./GuidedJournalForm";
export { XPBar } from "./XPBar";
export { AchievementBadge } from "./AchievementBadge";
export { Heatmap } from "./Heatmap";
export { ThemeSwitcher, ThemeUnlockStatus } from "./ThemeSwitcher";
export { InsightFeed } from "./InsightFeed";
export {
  SimpleCharts,
  FocusLineChart,
  EntriesBarChart,
  generateChartData,
  type DataPoint,
  type ChartData,
} from "./SimpleCharts";
export { TemplateSelector, TemplateInfo } from "./TemplateSelector";
export {
  RewardShop,
  useOwnedShopItems,
  useShopItem,
  SHOP_ITEMS,
  type ShopItemId,
  type ShopItemCategory,
  type ShopItem,
} from "./RewardShop";
export {
  Skeleton,
  CardSkeleton,
  XPBarSkeleton,
  EntryCardSkeleton,
  StatCardSkeleton,
  HeatmapSkeleton,
  PageSkeleton,
} from "./Skeleton";

// UI components (from shadcn)
export * from "./ui/button";
export * from "./ui/tooltip";
export * from "./ui/separator";
export * from "./ui/sheet";
export * from "./ui/card";
export * from "./ui/input";
export * from "./ui/textarea";
export * from "./ui/slider";
export * from "./ui/badge";
export * from "./ui/label";
export * from "./ui/dialog";
export * from "./ui/alert-dialog";
