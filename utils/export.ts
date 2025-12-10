"use client";

// ============================================================================
// Types
// ============================================================================

export interface ExportData {
  version: string;
  exportedAt: string;
  journal: {
    entries: unknown[];
    activeTemplateId: string;
  };
  gamification: {
    xp: number;
    totalEntries: number;
    totalFocusMinutes: number;
    mathTaggedEntries: number;
    streak: number;
    lastEntryDate: string | null;
    longestStreak: number;
    achievements: Record<string, unknown>;
    unlocks: Record<string, unknown>;
    quests: Record<string, unknown>;
    weeklyEntriesCount: number;
    weeklyHighFocusDays: number;
    weekStartDate: string | null;
  };
  shop: {
    ownedItems: string[];
    purchaseHistory: { itemId: string; purchasedAt: string }[];
  };
  settings: {
    theme: string | null;
    colorTheme: string | null;
  };
}

export interface ImportOptions {
  mode: "merge" | "replace";
}

export interface ImportResult {
  success: boolean;
  message: string;
  stats?: {
    entriesImported: number;
    achievementsImported: number;
    xpImported: number;
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// Constants
// ============================================================================

const EXPORT_VERSION = "1.0.0";

const STORAGE_KEYS = {
  journal: "journal-storage",
  gamification: "gamification-storage",
  shop: "reward-shop-storage",
  theme: "theme",
  colorTheme: "color-theme",
};

// ============================================================================
// Helper Functions
// ============================================================================

function safeJSONParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function downloadJSON(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function generateFilename(): string {
  const date = new Date().toISOString().split("T")[0];
  return `learning-journal-backup-${date}.json`;
}

// ============================================================================
// Validation
// ============================================================================

export function validateImportData(data: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Invalid data format: expected an object"], warnings: [] };
  }

  const obj = data as Record<string, unknown>;

  // Check version
  if (!obj.version) {
    warnings.push("No version found in export data");
  } else if (typeof obj.version !== "string") {
    errors.push("Invalid version format");
  }

  // Check exportedAt
  if (!obj.exportedAt) {
    warnings.push("No export timestamp found");
  }

  // Validate journal section
  if (obj.journal) {
    if (typeof obj.journal !== "object") {
      errors.push("Invalid journal data format");
    } else {
      const journal = obj.journal as Record<string, unknown>;
      if (journal.entries && !Array.isArray(journal.entries)) {
        errors.push("Journal entries must be an array");
      }
    }
  }

  // Validate gamification section
  if (obj.gamification) {
    if (typeof obj.gamification !== "object") {
      errors.push("Invalid gamification data format");
    } else {
      const gam = obj.gamification as Record<string, unknown>;
      if (gam.xp !== undefined && typeof gam.xp !== "number") {
        errors.push("XP must be a number");
      }
      if (gam.streak !== undefined && typeof gam.streak !== "number") {
        errors.push("Streak must be a number");
      }
    }
  }

  // Validate shop section
  if (obj.shop) {
    if (typeof obj.shop !== "object") {
      errors.push("Invalid shop data format");
    } else {
      const shop = obj.shop as Record<string, unknown>;
      if (shop.ownedItems && !Array.isArray(shop.ownedItems)) {
        errors.push("Shop owned items must be an array");
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// Export Functions
// ============================================================================

export function gatherExportData(): ExportData {
  if (typeof window === "undefined") {
    throw new Error("Export can only be performed in browser environment");
  }

  // Gather journal data
  const journalRaw = localStorage.getItem(STORAGE_KEYS.journal);
  const journalData = safeJSONParse(journalRaw, { state: { entries: [], activeTemplateId: "full" } });
  const journalState = (journalData as { state?: { entries?: unknown[]; activeTemplateId?: string } }).state || {};

  // Gather gamification data
  const gamificationRaw = localStorage.getItem(STORAGE_KEYS.gamification);
  const gamificationData = safeJSONParse(gamificationRaw, { state: {} });
  const gamificationState = (gamificationData as { state?: Record<string, unknown> }).state || {};

  // Gather shop data
  const shopRaw = localStorage.getItem(STORAGE_KEYS.shop);
  const shopData = safeJSONParse(shopRaw, { ownedItems: [], purchaseHistory: [] });

  // Gather settings
  const theme = localStorage.getItem(STORAGE_KEYS.theme);
  const colorTheme = localStorage.getItem(STORAGE_KEYS.colorTheme);

  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    journal: {
      entries: journalState.entries || [],
      activeTemplateId: journalState.activeTemplateId || "full",
    },
    gamification: {
      xp: (gamificationState.xp as number) || 0,
      totalEntries: (gamificationState.totalEntries as number) || 0,
      totalFocusMinutes: (gamificationState.totalFocusMinutes as number) || 0,
      mathTaggedEntries: (gamificationState.mathTaggedEntries as number) || 0,
      streak: (gamificationState.streak as number) || 0,
      lastEntryDate: (gamificationState.lastEntryDate as string | null) || null,
      longestStreak: (gamificationState.longestStreak as number) || 0,
      achievements: (gamificationState.achievements as Record<string, unknown>) || {},
      unlocks: (gamificationState.unlocks as Record<string, unknown>) || {},
      quests: (gamificationState.quests as Record<string, unknown>) || {},
      weeklyEntriesCount: (gamificationState.weeklyEntriesCount as number) || 0,
      weeklyHighFocusDays: (gamificationState.weeklyHighFocusDays as number) || 0,
      weekStartDate: (gamificationState.weekStartDate as string | null) || null,
    },
    shop: {
      ownedItems: (shopData as { ownedItems?: string[] }).ownedItems || [],
      purchaseHistory: (shopData as { purchaseHistory?: { itemId: string; purchasedAt: string }[] }).purchaseHistory || [],
    },
    settings: {
      theme,
      colorTheme,
    },
  };
}

export function exportAll(): void {
  try {
    const data = gatherExportData();
    const filename = generateFilename();
    downloadJSON(data, filename);
  } catch (error) {
    console.error("Export failed:", error);
    throw new Error("Failed to export data. Please try again.");
  }
}

// ============================================================================
// Import Functions
// ============================================================================

export function importAll(
  jsonBlob: string | ExportData,
  options: ImportOptions = { mode: "replace" }
): ImportResult {
  if (typeof window === "undefined") {
    return { success: false, message: "Import can only be performed in browser environment" };
  }

  try {
    // Parse if string
    const data: ExportData =
      typeof jsonBlob === "string" ? JSON.parse(jsonBlob) : jsonBlob;

    // Validate
    const validation = validateImportData(data);
    if (!validation.valid) {
      return {
        success: false,
        message: `Validation failed: ${validation.errors.join(", ")}`,
      };
    }

    const stats = {
      entriesImported: 0,
      achievementsImported: 0,
      xpImported: 0,
    };

    if (options.mode === "replace") {
      // Replace mode: Clear and set new data

      // Import journal
      if (data.journal) {
        const journalStorage = {
          state: {
            entries: data.journal.entries || [],
            activeTemplateId: data.journal.activeTemplateId || "full",
          },
          version: 0,
        };
        localStorage.setItem(STORAGE_KEYS.journal, JSON.stringify(journalStorage));
        stats.entriesImported = (data.journal.entries || []).length;
      }

      // Import gamification
      if (data.gamification) {
        const gamificationStorage = {
          state: {
            xp: data.gamification.xp || 0,
            totalEntries: data.gamification.totalEntries || 0,
            totalFocusMinutes: data.gamification.totalFocusMinutes || 0,
            mathTaggedEntries: data.gamification.mathTaggedEntries || 0,
            streak: data.gamification.streak || 0,
            lastEntryDate: data.gamification.lastEntryDate,
            longestStreak: data.gamification.longestStreak || 0,
            achievements: data.gamification.achievements || {},
            unlocks: data.gamification.unlocks || {},
            quests: data.gamification.quests || {},
            weeklyEntriesCount: data.gamification.weeklyEntriesCount || 0,
            weeklyHighFocusDays: data.gamification.weeklyHighFocusDays || 0,
            weekStartDate: data.gamification.weekStartDate,
          },
          version: 0,
        };
        localStorage.setItem(STORAGE_KEYS.gamification, JSON.stringify(gamificationStorage));
        stats.xpImported = data.gamification.xp || 0;
        stats.achievementsImported = Object.values(data.gamification.achievements || {}).filter(
          (a: unknown) => (a as { unlocked?: boolean })?.unlocked
        ).length;
      }

      // Import shop
      if (data.shop) {
        const shopStorage = {
          ownedItems: data.shop.ownedItems || [],
          purchaseHistory: data.shop.purchaseHistory || [],
        };
        localStorage.setItem(STORAGE_KEYS.shop, JSON.stringify(shopStorage));
      }

      // Import settings
      if (data.settings) {
        if (data.settings.theme) {
          localStorage.setItem(STORAGE_KEYS.theme, data.settings.theme);
        }
        if (data.settings.colorTheme) {
          localStorage.setItem(STORAGE_KEYS.colorTheme, data.settings.colorTheme);
        }
      }
    } else {
      // Merge mode: Combine with existing data

      // Merge journal entries
      if (data.journal?.entries) {
        const existingJournalRaw = localStorage.getItem(STORAGE_KEYS.journal);
        const existingJournal = safeJSONParse(existingJournalRaw, { state: { entries: [] } });
        const existingEntries = ((existingJournal as { state?: { entries?: unknown[] } }).state?.entries || []) as { id: string }[];
        const existingIds = new Set(existingEntries.map((e) => e.id));

        const newEntries = (data.journal.entries as { id: string }[]).filter(
          (e) => !existingIds.has(e.id)
        );

        const mergedJournal = {
          state: {
            entries: [...existingEntries, ...newEntries],
            activeTemplateId: data.journal.activeTemplateId || "full",
          },
          version: 0,
        };
        localStorage.setItem(STORAGE_KEYS.journal, JSON.stringify(mergedJournal));
        stats.entriesImported = newEntries.length;
      }

      // Merge shop items
      if (data.shop?.ownedItems) {
        const existingShopRaw = localStorage.getItem(STORAGE_KEYS.shop);
        const existingShop = safeJSONParse(existingShopRaw, { ownedItems: [], purchaseHistory: [] });
        const existingItems = new Set((existingShop as { ownedItems?: string[] }).ownedItems || []);

        const newItems = (data.shop.ownedItems || []).filter((i) => !existingItems.has(i));

        const mergedShop = {
          ownedItems: [...existingItems, ...newItems],
          purchaseHistory: [
            ...((existingShop as { purchaseHistory?: unknown[] }).purchaseHistory || []),
            ...(data.shop.purchaseHistory || []),
          ],
        };
        localStorage.setItem(STORAGE_KEYS.shop, JSON.stringify(mergedShop));
      }

      // For gamification, take the higher values
      if (data.gamification) {
        const existingGamRaw = localStorage.getItem(STORAGE_KEYS.gamification);
        const existingGam = safeJSONParse(existingGamRaw, { state: {} });
        const existingState = (existingGam as { state?: Record<string, unknown> }).state || {};

        const mergedGamification = {
          state: {
            xp: Math.max((existingState.xp as number) || 0, data.gamification.xp || 0),
            totalEntries: Math.max(
              (existingState.totalEntries as number) || 0,
              data.gamification.totalEntries || 0
            ),
            totalFocusMinutes: Math.max(
              (existingState.totalFocusMinutes as number) || 0,
              data.gamification.totalFocusMinutes || 0
            ),
            mathTaggedEntries: Math.max(
              (existingState.mathTaggedEntries as number) || 0,
              data.gamification.mathTaggedEntries || 0
            ),
            streak: Math.max((existingState.streak as number) || 0, data.gamification.streak || 0),
            lastEntryDate: data.gamification.lastEntryDate || existingState.lastEntryDate,
            longestStreak: Math.max(
              (existingState.longestStreak as number) || 0,
              data.gamification.longestStreak || 0
            ),
            achievements: {
              ...(existingState.achievements as Record<string, unknown>),
              ...data.gamification.achievements,
            },
            unlocks: {
              ...(existingState.unlocks as Record<string, unknown>),
              ...data.gamification.unlocks,
            },
            quests: {
              ...(existingState.quests as Record<string, unknown>),
              ...data.gamification.quests,
            },
            weeklyEntriesCount: data.gamification.weeklyEntriesCount || 0,
            weeklyHighFocusDays: data.gamification.weeklyHighFocusDays || 0,
            weekStartDate: data.gamification.weekStartDate,
          },
          version: 0,
        };
        localStorage.setItem(STORAGE_KEYS.gamification, JSON.stringify(mergedGamification));
        stats.xpImported = mergedGamification.state.xp;
      }
    }

    return {
      success: true,
      message: `Import successful! ${stats.entriesImported} entries, ${stats.xpImported} XP`,
      stats,
    };
  } catch (error) {
    console.error("Import failed:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to import data",
    };
  }
}

// ============================================================================
// Reset Function
// ============================================================================

export function resetAllData(): void {
  if (typeof window === "undefined") return;

  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });

  // Also clear any other app-related keys
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith("journal") || key.startsWith("gamification") || key.startsWith("reward"))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

// ============================================================================
// File Reader Helper
// ============================================================================

export function readFileAsJSON(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        resolve(data);
      } catch (error) {
        reject(new Error("Invalid JSON file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

