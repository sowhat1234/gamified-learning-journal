"use client";

import { useCallback, useEffect, useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

// ============================================================================
// Types
// ============================================================================

export interface JournalEntry {
  id: string;
  date: string; // ISO date string
  tags?: string[];
  focusMinutes?: number;
  focusLevel?: number; // 1-10
}

export type AchievementId =
  | "streak-warrior"
  | "math-mastery"
  | "deep-focus"
  | "consistency-king";

export interface Achievement {
  id: AchievementId;
  title: string;
  description: string;
  icon: string;
  requirement: number;
  progress: number;
  unlocked: boolean;
  unlockedAt?: string;
}

export type UnlockId = "dark-mode" | "themes" | "advanced-stats";

export interface Unlock {
  id: UnlockId;
  title: string;
  description: string;
  requiredLevel: number;
  unlocked: boolean;
}

export type QuestType = "entries" | "tags" | "focus" | "streak";

export interface Quest {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  rewardXP: number;
  completed: boolean;
  claimed: boolean;
  type: QuestType;
  typeValue?: string; // e.g., tag name for "tags" type
  resetWeekly?: boolean;
  weekStarted?: string; // ISO date of week quest started
}

interface GamificationState {
  // Core stats
  xp: number;
  totalEntries: number;
  totalFocusMinutes: number;
  mathTaggedEntries: number;

  // Streak tracking
  streak: number;
  lastEntryDate: string | null;
  longestStreak: number;

  // Achievement tracking
  achievements: Record<AchievementId, Achievement>;

  // Unlock tracking
  unlocks: Record<UnlockId, Unlock>;

  // Quest tracking
  quests: Record<string, Quest>;

  // Weekly tracking for quests
  weeklyEntriesCount: number;
  weeklyHighFocusDays: number;
  weekStartDate: string | null;

  // Actions
  _addXP: (amount: number) => void;
  _registerEntry: (entry: JournalEntry) => void;
  _resetState: () => void;
  _updateStreak: (dateISOString: string) => void;
  _resetStreak: () => void;
  _updateQuests: (entry: JournalEntry) => void;
  _claimQuest: (questId: string) => void;
  _resetWeeklyQuests: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = "gamification-storage";

const DEFAULT_ACHIEVEMENTS: Record<AchievementId, Achievement> = {
  "streak-warrior": {
    id: "streak-warrior",
    title: "7-Day Streak Warrior",
    description: "Maintain a 7-day journaling streak",
    icon: "🔥",
    requirement: 7,
    progress: 0,
    unlocked: false,
  },
  "math-mastery": {
    id: "math-mastery",
    title: "Math Mastery",
    description: "Create 10 math-tagged entries",
    icon: "🧮",
    requirement: 10,
    progress: 0,
    unlocked: false,
  },
  "deep-focus": {
    id: "deep-focus",
    title: "Deep Focus",
    description: "Accumulate 4 hours of total focus time",
    icon: "🎯",
    requirement: 240, // 4 hours in minutes
    progress: 0,
    unlocked: false,
  },
  "consistency-king": {
    id: "consistency-king",
    title: "Consistency King",
    description: "Create 20 journal entries",
    icon: "👑",
    requirement: 20,
    progress: 0,
    unlocked: false,
  },
};

const DEFAULT_UNLOCKS: Record<UnlockId, Unlock> = {
  "dark-mode": {
    id: "dark-mode",
    title: "Dark Mode",
    description: "Unlock dark mode theme",
    requiredLevel: 3,
    unlocked: false,
  },
  themes: {
    id: "themes",
    title: "Themes",
    description: "Unlock custom color themes",
    requiredLevel: 5,
    unlocked: false,
  },
  "advanced-stats": {
    id: "advanced-stats",
    title: "Advanced Stats",
    description: "Unlock advanced statistics and analytics",
    requiredLevel: 7,
    unlocked: false,
  },
};

const DEFAULT_QUESTS: Record<string, Quest> = {
  "weekly-entries-3": {
    id: "weekly-entries-3",
    title: "Weekly Writer",
    description: "Write 3 entries this week",
    target: 3,
    progress: 0,
    rewardXP: 50,
    completed: false,
    claimed: false,
    type: "entries",
    resetWeekly: true,
  },
  "math-tags-5": {
    id: "math-tags-5",
    title: "Math Explorer",
    description: "Tag 5 entries with Math",
    target: 5,
    progress: 0,
    rewardXP: 75,
    completed: false,
    claimed: false,
    type: "tags",
    typeValue: "math",
    resetWeekly: false,
  },
  "high-focus-2-days": {
    id: "high-focus-2-days",
    title: "Focus Master",
    description: "Have 2 days with focus level ≥7",
    target: 2,
    progress: 0,
    rewardXP: 60,
    completed: false,
    claimed: false,
    type: "focus",
    resetWeekly: true,
  },
};

const INITIAL_STATE = {
  xp: 0,
  totalEntries: 0,
  totalFocusMinutes: 0,
  mathTaggedEntries: 0,
  streak: 0,
  lastEntryDate: null,
  longestStreak: 0,
  achievements: DEFAULT_ACHIEVEMENTS,
  unlocks: DEFAULT_UNLOCKS,
  quests: DEFAULT_QUESTS,
  weeklyEntriesCount: 0,
  weeklyHighFocusDays: 0,
  weekStartDate: null,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate level from XP
 * Level N requires N * 100 XP total
 * Level 1 = 100 XP, Level 2 = 200 XP, etc.
 */
function calculateLevel(xp: number): number {
  if (xp < 100) return 0;
  return Math.floor(xp / 100);
}

/**
 * Get XP required for a specific level
 */
function getXPForLevel(level: number): number {
  return level * 100;
}

/**
 * Get XP progress within current level
 */
function getXPProgress(xp: number): { current: number; required: number; percentage: number } {
  const level = calculateLevel(xp);
  const currentLevelXP = getXPForLevel(level);
  const nextLevelXP = getXPForLevel(level + 1);
  const xpIntoLevel = xp - currentLevelXP;
  const xpNeeded = nextLevelXP - currentLevelXP;

  return {
    current: xpIntoLevel,
    required: xpNeeded,
    percentage: Math.min((xpIntoLevel / xpNeeded) * 100, 100),
  };
}

/**
 * Check if two dates are the same day
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Check if date1 is exactly one day before date2
 */
function isYesterday(date1: Date, date2: Date): boolean {
  const yesterday = new Date(date2);
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date1, yesterday);
}

/**
 * Get the start of the week (Monday) for a given date
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Check if date is in the same week as reference
 */
function isSameWeek(date: Date, reference: Date): boolean {
  const weekStart1 = getWeekStart(date);
  const weekStart2 = getWeekStart(reference);
  return isSameDay(weekStart1, weekStart2);
}

/**
 * Calculate streak based on last entry date
 */
function calculateStreak(
  lastEntryDate: string | null,
  currentStreak: number,
  entryDate: Date
): { newStreak: number; isNewDay: boolean } {
  if (!lastEntryDate) {
    return { newStreak: 1, isNewDay: true };
  }

  const lastDate = new Date(lastEntryDate);
  const today = entryDate;

  if (isSameDay(lastDate, today)) {
    return { newStreak: currentStreak, isNewDay: false };
  }

  if (isYesterday(lastDate, today)) {
    return { newStreak: currentStreak + 1, isNewDay: true };
  }

  return { newStreak: 1, isNewDay: true };
}

/**
 * Update achievements based on current state
 */
function updateAchievements(
  achievements: Record<AchievementId, Achievement>,
  state: {
    streak: number;
    mathTaggedEntries: number;
    totalFocusMinutes: number;
    totalEntries: number;
  }
): Record<AchievementId, Achievement> {
  const now = new Date().toISOString();
  const updated = { ...achievements };

  if (!updated["streak-warrior"].unlocked) {
    updated["streak-warrior"] = {
      ...updated["streak-warrior"],
      progress: state.streak,
      unlocked: state.streak >= 7,
      unlockedAt: state.streak >= 7 ? now : undefined,
    };
  }

  if (!updated["math-mastery"].unlocked) {
    updated["math-mastery"] = {
      ...updated["math-mastery"],
      progress: state.mathTaggedEntries,
      unlocked: state.mathTaggedEntries >= 10,
      unlockedAt: state.mathTaggedEntries >= 10 ? now : undefined,
    };
  }

  if (!updated["deep-focus"].unlocked) {
    updated["deep-focus"] = {
      ...updated["deep-focus"],
      progress: state.totalFocusMinutes,
      unlocked: state.totalFocusMinutes >= 240,
      unlockedAt: state.totalFocusMinutes >= 240 ? now : undefined,
    };
  }

  if (!updated["consistency-king"].unlocked) {
    updated["consistency-king"] = {
      ...updated["consistency-king"],
      progress: state.totalEntries,
      unlocked: state.totalEntries >= 20,
      unlockedAt: state.totalEntries >= 20 ? now : undefined,
    };
  }

  return updated;
}

/**
 * Update unlocks based on current level
 */
function updateUnlocks(
  unlocks: Record<UnlockId, Unlock>,
  level: number
): Record<UnlockId, Unlock> {
  const updated = { ...unlocks };

  if (!updated["dark-mode"].unlocked && level >= 3) {
    updated["dark-mode"] = { ...updated["dark-mode"], unlocked: true };
  }

  if (!updated.themes.unlocked && level >= 5) {
    updated.themes = { ...updated.themes, unlocked: true };
  }

  if (!updated["advanced-stats"].unlocked && level >= 7) {
    updated["advanced-stats"] = { ...updated["advanced-stats"], unlocked: true };
  }

  return updated;
}

// ============================================================================
// Zustand Store
// ============================================================================

const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      _addXP: (amount: number) => {
        if (amount <= 0) return;

        set((state) => {
          const newXP = state.xp + amount;
          const newLevel = calculateLevel(newXP);
          const updatedUnlocks = updateUnlocks(state.unlocks, newLevel);

          return {
            xp: newXP,
            unlocks: updatedUnlocks,
          };
        });
      },

      _updateStreak: (dateISOString: string) => {
        set((state) => {
          const entryDate = new Date(dateISOString);
          const { newStreak } = calculateStreak(
            state.lastEntryDate,
            state.streak,
            entryDate
          );

          const newLongestStreak = Math.max(state.longestStreak, newStreak);

          return {
            streak: newStreak,
            lastEntryDate: dateISOString,
            longestStreak: newLongestStreak,
          };
        });
      },

      _resetStreak: () => {
        set({ streak: 0 });
      },

      _resetWeeklyQuests: () => {
        set((state) => {
          const now = new Date();
          const weekStart = getWeekStart(now).toISOString();

          // Check if we need to reset weekly quests
          if (state.weekStartDate) {
            const lastWeekStart = new Date(state.weekStartDate);
            if (!isSameWeek(lastWeekStart, now)) {
              // Reset weekly quests
              const updatedQuests = { ...state.quests };
              Object.keys(updatedQuests).forEach((questId) => {
                const quest = updatedQuests[questId];
                if (quest.resetWeekly) {
                  updatedQuests[questId] = {
                    ...quest,
                    progress: 0,
                    completed: false,
                    claimed: false,
                    weekStarted: weekStart,
                  };
                }
              });

              return {
                quests: updatedQuests,
                weekStartDate: weekStart,
                weeklyEntriesCount: 0,
                weeklyHighFocusDays: 0,
              };
            }
          }

          return { weekStartDate: weekStart };
        });
      },

      _updateQuests: (entry: JournalEntry) => {
        set((state) => {
          const now = new Date();
          const entryDate = new Date(entry.date);
          const updatedQuests = { ...state.quests };
          let newWeeklyEntriesCount = state.weeklyEntriesCount;
          let newWeeklyHighFocusDays = state.weeklyHighFocusDays;

          // Check if this is a new entry for the day (not same day as last entry)
          const isNewDay = !state.lastEntryDate || !isSameDay(new Date(state.lastEntryDate), entryDate);

          // Check if entry is in current week
          const isCurrentWeek = isSameWeek(entryDate, now);

          if (isNewDay && isCurrentWeek) {
            newWeeklyEntriesCount++;

            // Check for high focus day
            const focusLevel = entry.focusLevel ?? (entry.focusMinutes ? Math.round(entry.focusMinutes / 6) : 5);
            if (focusLevel >= 7) {
              newWeeklyHighFocusDays++;
            }
          }

          // Update each quest
          Object.keys(updatedQuests).forEach((questId) => {
            const quest = updatedQuests[questId];
            if (quest.completed) return; // Skip completed quests

            let newProgress = quest.progress;

            switch (quest.type) {
              case "entries":
                if (quest.resetWeekly) {
                  newProgress = newWeeklyEntriesCount;
                } else {
                  newProgress = state.totalEntries + (isNewDay ? 1 : 0);
                }
                break;

              case "tags":
                if (quest.typeValue) {
                  const hasTag = entry.tags?.some(
                    (tag) => tag.toLowerCase() === quest.typeValue?.toLowerCase()
                  );
                  if (hasTag && isNewDay) {
                    newProgress = quest.progress + 1;
                  }
                }
                break;

              case "focus":
                if (quest.resetWeekly) {
                  newProgress = newWeeklyHighFocusDays;
                } else {
                  const focusLevel = entry.focusLevel ?? (entry.focusMinutes ? Math.round(entry.focusMinutes / 6) : 5);
                  if (focusLevel >= 7 && isNewDay) {
                    newProgress = quest.progress + 1;
                  }
                }
                break;

              case "streak":
                const { newStreak } = calculateStreak(
                  state.lastEntryDate,
                  state.streak,
                  entryDate
                );
                newProgress = newStreak;
                break;
            }

            const isNowCompleted = newProgress >= quest.target;

            updatedQuests[questId] = {
              ...quest,
              progress: Math.min(newProgress, quest.target),
              completed: isNowCompleted,
            };
          });

          return {
            quests: updatedQuests,
            weeklyEntriesCount: newWeeklyEntriesCount,
            weeklyHighFocusDays: newWeeklyHighFocusDays,
          };
        });
      },

      _claimQuest: (questId: string) => {
        const state = get();
        const quest = state.quests[questId];

        if (!quest || !quest.completed || quest.claimed) return;

        set((s) => ({
          quests: {
            ...s.quests,
            [questId]: {
              ...s.quests[questId],
              claimed: true,
            },
          },
        }));

        // Award XP
        state._addXP(quest.rewardXP);
      },

      _registerEntry: (entry: JournalEntry) => {
        const state = get();

        // First, check/reset weekly quests
        state._resetWeeklyQuests();

        set((s) => {
          const entryDate = new Date(entry.date);
          const { newStreak, isNewDay } = calculateStreak(
            s.lastEntryDate,
            s.streak,
            entryDate
          );

          const newTotalEntries = isNewDay ? s.totalEntries + 1 : s.totalEntries;
          const hasMathTag = entry.tags?.some(
            (tag) => tag.toLowerCase() === "math"
          );
          const newMathTaggedEntries =
            hasMathTag && isNewDay
              ? s.mathTaggedEntries + 1
              : s.mathTaggedEntries;
          const newTotalFocusMinutes =
            s.totalFocusMinutes + (entry.focusMinutes || 0);

          let xpReward = 0;
          if (isNewDay) {
            xpReward += 10;
            if (newStreak > s.streak) {
              xpReward += newStreak * 2;
            }
          }
          if (entry.focusMinutes) {
            xpReward += Math.floor(entry.focusMinutes / 5);
          }

          const newXP = s.xp + xpReward;
          const newLevel = calculateLevel(newXP);
          const newLongestStreak = Math.max(s.longestStreak, newStreak);

          const updatedAchievements = updateAchievements(s.achievements, {
            streak: newStreak,
            mathTaggedEntries: newMathTaggedEntries,
            totalFocusMinutes: newTotalFocusMinutes,
            totalEntries: newTotalEntries,
          });

          const updatedUnlocks = updateUnlocks(s.unlocks, newLevel);

          return {
            xp: newXP,
            streak: newStreak,
            lastEntryDate: entry.date,
            longestStreak: newLongestStreak,
            totalEntries: newTotalEntries,
            mathTaggedEntries: newMathTaggedEntries,
            totalFocusMinutes: newTotalFocusMinutes,
            achievements: updatedAchievements,
            unlocks: updatedUnlocks,
          };
        });

        // Update quests after main state update
        get()._updateQuests(entry);
      },

      _resetState: () => {
        set(INITIAL_STATE);
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        xp: state.xp,
        totalEntries: state.totalEntries,
        totalFocusMinutes: state.totalFocusMinutes,
        mathTaggedEntries: state.mathTaggedEntries,
        streak: state.streak,
        lastEntryDate: state.lastEntryDate,
        longestStreak: state.longestStreak,
        achievements: state.achievements,
        unlocks: state.unlocks,
        quests: state.quests,
        weeklyEntriesCount: state.weeklyEntriesCount,
        weeklyHighFocusDays: state.weeklyHighFocusDays,
        weekStartDate: state.weekStartDate,
      }),
    }
  )
);

// ============================================================================
// Hook
// ============================================================================

export interface GamificationAPI {
  // Core stats
  xp: number;
  level: number;
  streak: number;
  longestStreak: number;
  totalEntries: number;
  totalFocusMinutes: number;

  // XP Progress
  xpProgress: {
    current: number;
    required: number;
    percentage: number;
  };
  xpForNextLevel: number;

  // Collections
  achievements: Achievement[];
  unlocks: Unlock[];
  quests: Quest[];

  // Computed
  unlockedAchievements: Achievement[];
  lockedAchievements: Achievement[];
  unlockedFeatures: Unlock[];
  lockedFeatures: Unlock[];

  // Quest selectors
  availableQuests: Quest[];
  completedQuests: Quest[];
  claimableQuests: Quest[];

  // Check functions
  isUnlocked: (unlockId: UnlockId) => boolean;
  hasAchievement: (achievementId: AchievementId) => boolean;

  // Streak API
  getStreak: () => number;
  updateStreakOnEntry: (dateISOString: string) => void;
  resetStreak: () => void;

  // Quest API
  getQuests: () => Quest[];
  claimQuest: (questId: string) => void;
  updateQuestsOnEntry: (entry: JournalEntry) => void;

  // Actions
  addXP: (amount: number) => void;
  registerEntry: (entry: JournalEntry) => void;
  loadState: () => GamificationState;
  resetState: () => void;
}

export function useGamification(): GamificationAPI {
  const store = useGamificationStore();

  // Derived values
  const level = useMemo(() => calculateLevel(store.xp), [store.xp]);
  const xpProgress = useMemo(() => getXPProgress(store.xp), [store.xp]);
  const xpForNextLevel = useMemo(() => getXPForLevel(level + 1), [level]);

  // Convert records to arrays
  const achievements = useMemo(
    () => Object.values(store.achievements),
    [store.achievements]
  );
  const unlocks = useMemo(() => Object.values(store.unlocks), [store.unlocks]);
  const quests = useMemo(() => Object.values(store.quests), [store.quests]);

  // Filtered achievement arrays
  const unlockedAchievements = useMemo(
    () => achievements.filter((a) => a.unlocked),
    [achievements]
  );
  const lockedAchievements = useMemo(
    () => achievements.filter((a) => !a.unlocked),
    [achievements]
  );
  const unlockedFeatures = useMemo(
    () => unlocks.filter((u) => u.unlocked),
    [unlocks]
  );
  const lockedFeatures = useMemo(
    () => unlocks.filter((u) => !u.unlocked),
    [unlocks]
  );

  // Quest selectors
  const availableQuests = useMemo(
    () => quests.filter((q) => !q.completed),
    [quests]
  );
  const completedQuests = useMemo(
    () => quests.filter((q) => q.completed),
    [quests]
  );
  const claimableQuests = useMemo(
    () => quests.filter((q) => q.completed && !q.claimed),
    [quests]
  );

  // Check functions
  const isUnlocked = useCallback(
    (unlockId: UnlockId): boolean => {
      return store.unlocks[unlockId]?.unlocked ?? false;
    },
    [store.unlocks]
  );

  const hasAchievement = useCallback(
    (achievementId: AchievementId): boolean => {
      return store.achievements[achievementId]?.unlocked ?? false;
    },
    [store.achievements]
  );

  // Streak API
  const getStreak = useCallback((): number => {
    return store.streak;
  }, [store.streak]);

  const updateStreakOnEntry = useCallback(
    (dateISOString: string) => {
      store._updateStreak(dateISOString);
    },
    [store]
  );

  const resetStreak = useCallback(() => {
    store._resetStreak();
  }, [store]);

  // Quest API
  const getQuests = useCallback((): Quest[] => {
    return Object.values(store.quests);
  }, [store.quests]);

  const claimQuest = useCallback(
    (questId: string) => {
      store._claimQuest(questId);
    },
    [store]
  );

  const updateQuestsOnEntry = useCallback(
    (entry: JournalEntry) => {
      store._updateQuests(entry);
    },
    [store]
  );

  // Actions
  const addXP = useCallback(
    (amount: number) => {
      store._addXP(amount);
    },
    [store]
  );

  const registerEntry = useCallback(
    (entry: JournalEntry) => {
      store._registerEntry(entry);
    },
    [store]
  );

  const loadState = useCallback((): GamificationState => {
    return useGamificationStore.getState();
  }, []);

  const resetState = useCallback(() => {
    store._resetState();
  }, [store]);

  // Check streak validity on mount (reset if broken)
  useEffect(() => {
    const state = useGamificationStore.getState();
    if (state.lastEntryDate && state.streak > 0) {
      const lastDate = new Date(state.lastEntryDate);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (!isSameDay(lastDate, today) && !isSameDay(lastDate, yesterday)) {
        useGamificationStore.setState({ streak: 0 });
      }
    }
  }, []); // Only run on mount

  // Check weekly quest reset on mount
  useEffect(() => {
    useGamificationStore.getState()._resetWeeklyQuests();
  }, []); // Only run on mount

  return {
    // Core stats
    xp: store.xp,
    level,
    streak: store.streak,
    longestStreak: store.longestStreak,
    totalEntries: store.totalEntries,
    totalFocusMinutes: store.totalFocusMinutes,

    // XP Progress
    xpProgress,
    xpForNextLevel,

    // Collections
    achievements,
    unlocks,
    quests,

    // Computed
    unlockedAchievements,
    lockedAchievements,
    unlockedFeatures,
    lockedFeatures,

    // Quest selectors
    availableQuests,
    completedQuests,
    claimableQuests,

    // Check functions
    isUnlocked,
    hasAchievement,

    // Streak API
    getStreak,
    updateStreakOnEntry,
    resetStreak,

    // Quest API
    getQuests,
    claimQuest,
    updateQuestsOnEntry,

    // Actions
    addXP,
    registerEntry,
    loadState,
    resetState,
  };
}

// Export store for direct access if needed
export { useGamificationStore };
