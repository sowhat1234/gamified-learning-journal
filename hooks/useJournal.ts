"use client";

import { useCallback, useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useGamification, useGamificationStore } from "./useGamification";

// ============================================================================
// Types
// ============================================================================

export interface JournalEntryData {
  concept: string;
  challenge: string;
  focus: number; // minutes
  focusLevel?: number; // 1-10 rating
  improve: string;
  tags?: string[];
  title?: string;
  application?: string; // For "Deep" template
}

export interface JournalEntry {
  id: string;
  date: string; // ISO date string
  title: string;
  concept: string;
  challenge: string;
  focus: number; // minutes
  focusLevel: number; // 1-10
  improve: string;
  tags: string[];
  xpEarned: number;
  createdAt: string;
  updatedAt: string;
  application?: string; // For "Deep" template
  templateId?: TemplateId;
}

export interface JournalStats {
  totalEntries: number;
  totalFocusMinutes: number;
  averageFocusMinutes: number;
  entriesThisWeek: number;
  entriesThisMonth: number;
  mostUsedTags: { tag: string; count: number }[];
  streakDays: number;
  longestEntry: JournalEntry | null;
  recentEntries: JournalEntry[];
  entriesByDay: Record<string, number>;
  focusByDay: Record<string, number>;
  totalXPEarned: number;
  averageFocusLevel: number;
}

// ============================================================================
// Template Types
// ============================================================================

export type TemplateId = "full" | "quick" | "deep";

export interface TemplateStep {
  id: string;
  field: keyof JournalEntryData;
  title: string;
  subtitle: string;
  placeholder: string;
  type: "textarea" | "slider" | "tags";
  required: boolean;
  minLength?: number;
}

export interface JournalTemplate {
  id: TemplateId;
  name: string;
  description: string;
  icon: string;
  color: string;
  steps: TemplateStep[];
  bonusXP: number;
}

// ============================================================================
// Predefined Templates
// ============================================================================

export const JOURNAL_TEMPLATES: Record<TemplateId, JournalTemplate> = {
  full: {
    id: "full",
    name: "Full Reflection",
    description: "Complete journaling experience with all questions",
    icon: "📝",
    color: "violet",
    bonusXP: 0,
    steps: [
      {
        id: "concept",
        field: "concept",
        title: "What concept did you learn today?",
        subtitle: "Describe the main idea or skill you explored",
        placeholder: "Today I learned about...",
        type: "textarea",
        required: true,
        minLength: 10,
      },
      {
        id: "challenge",
        field: "challenge",
        title: "What was challenging?",
        subtitle: "Identify the difficult parts or obstacles",
        placeholder: "The hardest part was...",
        type: "textarea",
        required: true,
        minLength: 10,
      },
      {
        id: "focus",
        field: "focus",
        title: "Rate your focus",
        subtitle: "How focused were you during your learning session?",
        placeholder: "",
        type: "slider",
        required: true,
      },
      {
        id: "improve",
        field: "improve",
        title: "What will you improve tomorrow?",
        subtitle: "Set your intention for the next session",
        placeholder: "Tomorrow I will...",
        type: "textarea",
        required: true,
        minLength: 10,
      },
      {
        id: "tags",
        field: "tags",
        title: "Add tags",
        subtitle: "Categorize your learning for better tracking",
        placeholder: "",
        type: "tags",
        required: false,
      },
    ],
  },
  quick: {
    id: "quick",
    name: "Quick Entry",
    description: "Fast capture with just concept and focus",
    icon: "⚡",
    color: "amber",
    bonusXP: -5, // Less XP for shorter entries
    steps: [
      {
        id: "concept",
        field: "concept",
        title: "What did you learn?",
        subtitle: "Quick summary of your learning",
        placeholder: "I learned...",
        type: "textarea",
        required: true,
        minLength: 10,
      },
      {
        id: "focus",
        field: "focus",
        title: "Focus level",
        subtitle: "How focused were you?",
        placeholder: "",
        type: "slider",
        required: true,
      },
      {
        id: "tags",
        field: "tags",
        title: "Quick tags",
        subtitle: "Optional categorization",
        placeholder: "",
        type: "tags",
        required: false,
      },
    ],
  },
  deep: {
    id: "deep",
    name: "Deep Reflection",
    description: "Extended reflection with application planning",
    icon: "🔮",
    color: "emerald",
    bonusXP: 10, // Extra XP for deeper reflection
    steps: [
      {
        id: "concept",
        field: "concept",
        title: "What concept did you learn today?",
        subtitle: "Describe the main idea or skill you explored in detail",
        placeholder: "Today I deeply explored...",
        type: "textarea",
        required: true,
        minLength: 20,
      },
      {
        id: "challenge",
        field: "challenge",
        title: "What was challenging?",
        subtitle: "Identify the difficult parts and why they were hard",
        placeholder: "The challenges I faced were...",
        type: "textarea",
        required: true,
        minLength: 15,
      },
      {
        id: "focus",
        field: "focus",
        title: "Rate your focus",
        subtitle: "How focused were you during your learning session?",
        placeholder: "",
        type: "slider",
        required: true,
      },
      {
        id: "application",
        field: "application",
        title: "How can I apply this?",
        subtitle: "Think about practical applications for what you learned",
        placeholder: "I can apply this by...",
        type: "textarea",
        required: true,
        minLength: 15,
      },
      {
        id: "improve",
        field: "improve",
        title: "What will you improve tomorrow?",
        subtitle: "Set a specific, actionable goal",
        placeholder: "Tomorrow I will specifically...",
        type: "textarea",
        required: true,
        minLength: 10,
      },
      {
        id: "tags",
        field: "tags",
        title: "Add tags",
        subtitle: "Categorize your learning for better tracking",
        placeholder: "",
        type: "tags",
        required: false,
      },
    ],
  },
};

// ============================================================================
// Journal State
// ============================================================================

interface JournalState {
  entries: JournalEntry[];
  activeTemplateId: TemplateId;
  _addEntry: (entry: JournalEntry) => void;
  _deleteEntry: (id: string) => void;
  _editEntry: (id: string, data: Partial<JournalEntryData>) => void;
  _clearAll: () => void;
  _setActiveTemplate: (templateId: TemplateId) => void;
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = "journal-storage";
const MAX_TITLE_LENGTH = 60;
const BASE_XP = 10;

// ============================================================================
// Helper Functions
// ============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function generateTitle(concept: string, tags?: string[]): string {
  const words = concept.trim().split(/\s+/);
  let titleBase = words.slice(0, 7).join(" ");

  if (words.length > 7) {
    titleBase = titleBase.replace(/[.,!?;:]$/, "") + "...";
  }

  const topTag = tags?.[0];
  if (topTag) {
    const capitalizedTag = topTag.charAt(0).toUpperCase() + topTag.slice(1).toLowerCase();
    titleBase = `${titleBase} • ${capitalizedTag}`;
  }

  if (titleBase.length > MAX_TITLE_LENGTH) {
    titleBase = titleBase.substring(0, MAX_TITLE_LENGTH - 3).trim() + "...";
  }

  return titleBase;
}

function calculateXPEarned(
  focusMinutes: number,
  focusLevel: number,
  tags?: string[],
  templateBonus: number = 0
): number {
  let xp = BASE_XP + templateBonus;

  xp += Math.round(focusMinutes / 6);

  if (focusLevel >= 8) {
    xp += 5;
  } else if (focusLevel >= 6) {
    xp += 2;
  }

  if (tags && tags.length > 0) {
    xp += Math.min(tags.length * 2, 10);
  }

  return Math.max(xp, 5); // Minimum 5 XP
}

function focusMinutesToLevel(minutes: number): number {
  const level = Math.round(minutes / 6);
  return Math.max(1, Math.min(10, level));
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function formatDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

function calculateStreak(entries: JournalEntry[]): number {
  if (entries.length === 0) return 0;

  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const uniqueDates = new Set<string>();
  sortedEntries.forEach((entry) => {
    uniqueDates.add(formatDateKey(new Date(entry.date)));
  });

  const sortedDates = Array.from(uniqueDates).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  if (sortedDates.length === 0) return 0;

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayKey = formatDateKey(today);
  const yesterdayKey = formatDateKey(yesterday);

  const mostRecentKey = sortedDates[0];
  if (mostRecentKey !== todayKey && mostRecentKey !== yesterdayKey) {
    return 0;
  }

  let streak = 1;
  let currentDate = new Date(mostRecentKey);

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(currentDate);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateKey = formatDateKey(prevDate);

    if (sortedDates[i] === prevDateKey) {
      streak++;
      currentDate = prevDate;
    } else {
      break;
    }
  }

  return streak;
}

// ============================================================================
// Zustand Store
// ============================================================================

const useJournalStore = create<JournalState>()(
  persist(
    (set) => ({
      entries: [],
      activeTemplateId: "full",

      _addEntry: (entry: JournalEntry) => {
        set((state) => ({
          entries: [entry, ...state.entries],
        }));
      },

      _deleteEntry: (id: string) => {
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        }));
      },

      _editEntry: (id: string, data: Partial<JournalEntryData>) => {
        set((state) => ({
          entries: state.entries.map((entry) => {
            if (entry.id !== id) return entry;

            const updatedEntry = {
              ...entry,
              ...data,
              updatedAt: new Date().toISOString(),
            };

            if (data.concept && !data.title) {
              updatedEntry.title = generateTitle(
                data.concept,
                data.tags ?? entry.tags
              );
            }

            if (data.focus !== undefined && data.focusLevel === undefined) {
              updatedEntry.focusLevel = focusMinutesToLevel(data.focus);
            }

            return updatedEntry;
          }),
        }));
      },

      _clearAll: () => {
        set({ entries: [] });
      },

      _setActiveTemplate: (templateId: TemplateId) => {
        set({ activeTemplateId: templateId });
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        entries: state.entries,
        activeTemplateId: state.activeTemplateId,
      }),
    }
  )
);

// ============================================================================
// Hook
// ============================================================================

export interface JournalAPI {
  // Data
  entries: JournalEntry[];

  // Queries
  getEntry: (id: string) => JournalEntry | undefined;
  getEntryById: (id: string) => JournalEntry | undefined;
  getEntriesByDate: (date: Date) => JournalEntry[];
  getEntriesByTag: (tag: string) => JournalEntry[];
  searchEntries: (query: string) => JournalEntry[];
  getLastEntryImprovement: () => string | undefined;

  // Stats
  getStats: () => JournalStats;

  // Templates
  getActiveTemplate: () => JournalTemplate;
  getActiveTemplateId: () => TemplateId;
  setActiveTemplate: (templateId: TemplateId) => void;
  getAllTemplates: () => JournalTemplate[];

  // Mutations
  addEntry: (data: JournalEntryData) => JournalEntry;
  deleteEntry: (id: string) => void;
  editEntry: (id: string, data: Partial<JournalEntryData>) => void;
  clearAll: () => void;
}

export function useJournal(): JournalAPI {
  const store = useJournalStore();
  const gamification = useGamification();

  // Sort entries by date (newest first)
  const entries = useMemo(
    () =>
      [...store.entries].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [store.entries]
  );

  // Get single entry by ID
  const getEntry = useCallback(
    (id: string): JournalEntry | undefined => {
      return store.entries.find((e) => e.id === id);
    },
    [store.entries]
  );

  // Alias for getEntry
  const getEntryById = useCallback(
    (id: string): JournalEntry | undefined => {
      return store.entries.find((e) => e.id === id);
    },
    [store.entries]
  );

  // Get entries by date
  const getEntriesByDate = useCallback(
    (date: Date): JournalEntry[] => {
      return store.entries.filter((entry) =>
        isSameDay(new Date(entry.date), date)
      );
    },
    [store.entries]
  );

  // Get entries by tag
  const getEntriesByTag = useCallback(
    (tag: string): JournalEntry[] => {
      const normalizedTag = tag.toLowerCase();
      return store.entries.filter((entry) =>
        entry.tags?.some((t) => t.toLowerCase() === normalizedTag)
      );
    },
    [store.entries]
  );

  // Search entries
  const searchEntries = useCallback(
    (query: string): JournalEntry[] => {
      const normalizedQuery = query.toLowerCase();
      return store.entries.filter(
        (entry) =>
          entry.title.toLowerCase().includes(normalizedQuery) ||
          entry.concept.toLowerCase().includes(normalizedQuery) ||
          entry.challenge.toLowerCase().includes(normalizedQuery) ||
          entry.improve.toLowerCase().includes(normalizedQuery) ||
          entry.tags?.some((t) => t.toLowerCase().includes(normalizedQuery))
      );
    },
    [store.entries]
  );

  // Get last entry's improvement goal
  const getLastEntryImprovement = useCallback((): string | undefined => {
    const sortedEntries = [...store.entries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return sortedEntries[0]?.improve;
  }, [store.entries]);

  // Template functions
  const getActiveTemplate = useCallback((): JournalTemplate => {
    return JOURNAL_TEMPLATES[store.activeTemplateId];
  }, [store.activeTemplateId]);

  const getActiveTemplateId = useCallback((): TemplateId => {
    return store.activeTemplateId;
  }, [store.activeTemplateId]);

  const setActiveTemplate = useCallback(
    (templateId: TemplateId) => {
      store._setActiveTemplate(templateId);
    },
    [store]
  );

  const getAllTemplates = useCallback((): JournalTemplate[] => {
    return Object.values(JOURNAL_TEMPLATES);
  }, []);

  // Get stats
  const getStats = useCallback((): JournalStats => {
    const now = new Date();
    const startOfWeek = getStartOfWeek(now);
    const startOfMonth = getStartOfMonth(now);

    const totalEntries = store.entries.length;

    const totalFocusMinutes = store.entries.reduce(
      (sum, entry) => sum + (entry.focus || 0),
      0
    );

    const averageFocusMinutes =
      totalEntries > 0 ? Math.round(totalFocusMinutes / totalEntries) : 0;

    const entriesThisWeek = store.entries.filter(
      (entry) => new Date(entry.date) >= startOfWeek
    ).length;

    const entriesThisMonth = store.entries.filter(
      (entry) => new Date(entry.date) >= startOfMonth
    ).length;

    const tagCounts: Record<string, number> = {};
    store.entries.forEach((entry) => {
      entry.tags?.forEach((tag) => {
        const normalizedTag = tag.toLowerCase();
        tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
      });
    });
    const mostUsedTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const streakDays = calculateStreak(store.entries);

    const longestEntry =
      store.entries.length > 0
        ? store.entries.reduce((longest, entry) => {
            const currentLength =
              entry.concept.length +
              entry.challenge.length +
              entry.improve.length;
            const longestLength =
              longest.concept.length +
              longest.challenge.length +
              longest.improve.length;
            return currentLength > longestLength ? entry : longest;
          })
        : null;

    const recentEntries = [...store.entries]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    const entriesByDay: Record<string, number> = {};
    const focusByDay: Record<string, number> = {};
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    store.entries
      .filter((entry) => new Date(entry.date) >= thirtyDaysAgo)
      .forEach((entry) => {
        const dateKey = formatDateKey(new Date(entry.date));
        entriesByDay[dateKey] = (entriesByDay[dateKey] || 0) + 1;
        focusByDay[dateKey] = (focusByDay[dateKey] || 0) + (entry.focus || 0);
      });

    const totalXPEarned = store.entries.reduce(
      (sum, entry) => sum + (entry.xpEarned || 0),
      0
    );

    const averageFocusLevel =
      totalEntries > 0
        ? Math.round(
            (store.entries.reduce((sum, e) => sum + (e.focusLevel || 5), 0) /
              totalEntries) *
              10
          ) / 10
        : 0;

    return {
      totalEntries,
      totalFocusMinutes,
      averageFocusMinutes,
      entriesThisWeek,
      entriesThisMonth,
      mostUsedTags,
      streakDays,
      longestEntry,
      recentEntries,
      entriesByDay,
      focusByDay,
      totalXPEarned,
      averageFocusLevel,
    };
  }, [store.entries]);

  // Add entry with gamification integration
  const addEntry = useCallback(
    (data: JournalEntryData): JournalEntry => {
      const now = new Date().toISOString();
      const tags = data.tags || [];
      const template = JOURNAL_TEMPLATES[store.activeTemplateId];

      // Determine focus level
      const focusLevel = data.focusLevel ?? focusMinutesToLevel(data.focus);

      // Calculate XP earned (including template bonus)
      const xpEarned = calculateXPEarned(data.focus, focusLevel, tags, template.bonusXP);

      // Generate title if not provided
      const title = data.title || generateTitle(data.concept, tags);

      const entry: JournalEntry = {
        id: generateId(),
        date: now,
        createdAt: now,
        updatedAt: now,
        title,
        concept: data.concept,
        challenge: data.challenge || "",
        focus: data.focus,
        focusLevel,
        improve: data.improve || "",
        tags,
        xpEarned,
        application: data.application,
        templateId: store.activeTemplateId,
      };

      // Add to journal store
      store._addEntry(entry);

      // Register with gamification system
      gamification.registerEntry({
        id: entry.id,
        date: entry.date,
        tags: entry.tags,
        focusMinutes: entry.focus,
        focusLevel: entry.focusLevel,
      });

      // Add bonus XP directly via store for quality bonuses
      const totalLength =
        entry.concept.length +
        (entry.challenge?.length || 0) +
        (entry.improve?.length || 0) +
        (entry.application?.length || 0);
      let bonusXP = 0;

      if (totalLength > 200) bonusXP += 5;
      if (totalLength > 500) bonusXP += 10;
      if (entry.focus >= 60) bonusXP += 15;
      else if (entry.focus >= 30) bonusXP += 5;

      if (bonusXP > 0) {
        const gamificationStore = useGamificationStore.getState();
        gamificationStore._addXP(bonusXP);
      }

      return entry;
    },
    [store, gamification]
  );

  // Delete entry
  const deleteEntry = useCallback(
    (id: string) => {
      store._deleteEntry(id);
    },
    [store]
  );

  // Edit entry
  const editEntry = useCallback(
    (id: string, data: Partial<JournalEntryData>) => {
      store._editEntry(id, data);
    },
    [store]
  );

  // Clear all entries
  const clearAll = useCallback(() => {
    store._clearAll();
  }, [store]);

  return {
    entries,
    getEntry,
    getEntryById,
    getEntriesByDate,
    getEntriesByTag,
    searchEntries,
    getLastEntryImprovement,
    getStats,
    getActiveTemplate,
    getActiveTemplateId,
    setActiveTemplate,
    getAllTemplates,
    addEntry,
    deleteEntry,
    editEntry,
    clearAll,
  };
}

// Export store for direct access if needed
export { useJournalStore };
