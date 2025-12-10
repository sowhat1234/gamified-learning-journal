// Re-export cn from lib/utils for convenience
export { cn } from "@/lib/utils";

// localStorage utilities
export {
  load,
  save,
  remove,
  exists,
  loadOrCreate,
  update,
  clearAll,
  getAllKeys,
  getStorageSize,
  createStorage,
} from "./localStorage";

// Format date utility
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

// Format relative time
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return formatDate(date);
}

// Delay utility for animations
export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Export/Import utilities
export {
  exportAll,
  importAll,
  resetAllData,
  gatherExportData,
  validateImportData,
  readFileAsJSON,
  type ExportData,
  type ImportOptions,
  type ImportResult,
  type ValidationResult,
} from "./export";
