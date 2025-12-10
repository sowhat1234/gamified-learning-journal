"use client";

import { useMemo, useCallback } from "react";
import { useJournal, JournalEntry } from "./useJournal";
import { useGamification } from "./useGamification";

// ============================================================================
// Types
// ============================================================================

export interface TagCount {
  tag: string;
  count: number;
}

export interface WeeklyFocusChange {
  percentChange: number;
  from: number;
  to: number;
}

export interface RecurringChallenge {
  text: string;
  occurrences: number;
}

export interface InsightsAPI {
  topTags: (lastNDays?: number) => TagCount[];
  averageFocus: (lastNDays?: number) => number;
  weeklyChangeFocus: () => WeeklyFocusChange;
  recurringChallenges: (limit?: number) => RecurringChallenge[];
  suggestedNextActions: () => string[];
}

// ============================================================================
// Constants
// ============================================================================

const COMMON_CHALLENGE_PHRASES = [
  "distractions",
  "complex syntax",
  "tired",
  "new concept",
  "time management",
  "focus",
  "understanding",
  "practice",
  "motivation",
  "debugging",
  "syntax errors",
  "memory",
  "concentration",
  "procrastination",
  "overwhelmed",
  "confused",
  "stuck",
  "slow progress",
  "difficult",
  "hard to understand",
  "too many concepts",
  "lack of examples",
  "no clear path",
  "interruptions",
  "mental fatigue",
];

// ============================================================================
// Helper Functions
// ============================================================================

function getDateNDaysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
}

function filterEntriesByDays(
  entries: JournalEntry[],
  lastNDays?: number
): JournalEntry[] {
  if (!lastNDays || lastNDays <= 0) {
    return entries;
  }

  const cutoffDate = getDateNDaysAgo(lastNDays);
  return entries.filter((entry) => new Date(entry.date) >= cutoffDate);
}

function extractPhrases(text: string): string[] {
  const normalized = text.toLowerCase().trim();
  const phrases: string[] = [];

  // Check for common challenge phrases
  for (const phrase of COMMON_CHALLENGE_PHRASES) {
    if (normalized.includes(phrase)) {
      phrases.push(phrase);
    }
  }

  // Also extract significant words (4+ characters, not common words)
  const commonWords = new Set([
    "the",
    "and",
    "was",
    "were",
    "that",
    "this",
    "with",
    "have",
    "been",
    "from",
    "they",
    "will",
    "would",
    "could",
    "should",
    "about",
    "which",
    "when",
    "what",
    "where",
    "there",
    "their",
    "than",
    "then",
    "some",
    "more",
    "most",
    "also",
    "very",
    "just",
    "into",
    "over",
    "such",
    "only",
    "other",
    "being",
    "after",
    "before",
    "because",
    "through",
    "during",
    "while",
    "really",
    "today",
    "trying",
    "still",
  ]);

  const words = normalized.split(/\s+/).filter((word) => {
    const cleaned = word.replace(/[^a-z]/g, "");
    return cleaned.length >= 4 && !commonWords.has(cleaned);
  });

  // Add unique significant words
  for (const word of words) {
    const cleaned = word.replace(/[^a-z]/g, "");
    if (!phrases.includes(cleaned) && cleaned.length >= 4) {
      phrases.push(cleaned);
    }
  }

  return phrases;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useInsights(): InsightsAPI {
  const { entries } = useJournal();
  const { streak } = useGamification();

  // Get top tags within a time period
  const topTags = useCallback(
    (lastNDays?: number): TagCount[] => {
      const filteredEntries = filterEntriesByDays(entries, lastNDays);

      const tagCounts: Record<string, number> = {};

      filteredEntries.forEach((entry) => {
        entry.tags?.forEach((tag) => {
          const normalizedTag = tag.toLowerCase();
          tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
        });
      });

      return Object.entries(tagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count);
    },
    [entries]
  );

  // Get average focus (returns focus level 1-10)
  const averageFocus = useCallback(
    (lastNDays?: number): number => {
      const filteredEntries = filterEntriesByDays(entries, lastNDays);

      if (filteredEntries.length === 0) {
        return 0;
      }

      const totalFocusLevel = filteredEntries.reduce(
        (sum, entry) => sum + (entry.focusLevel || 5),
        0
      );

      return Math.round((totalFocusLevel / filteredEntries.length) * 10) / 10;
    },
    [entries]
  );

  // Compare focus between this week and last week
  const weeklyChangeFocus = useCallback((): WeeklyFocusChange => {
    const now = new Date();
    const sevenDaysAgo = getDateNDaysAgo(7);
    const fourteenDaysAgo = getDateNDaysAgo(14);

    // This week's entries (last 7 days)
    const thisWeekEntries = entries.filter((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate >= sevenDaysAgo && entryDate <= now;
    });

    // Last week's entries (7-14 days ago)
    const lastWeekEntries = entries.filter((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate >= fourteenDaysAgo && entryDate < sevenDaysAgo;
    });

    const thisWeekAvg =
      thisWeekEntries.length > 0
        ? thisWeekEntries.reduce((sum, e) => sum + (e.focusLevel || 5), 0) /
          thisWeekEntries.length
        : 0;

    const lastWeekAvg =
      lastWeekEntries.length > 0
        ? lastWeekEntries.reduce((sum, e) => sum + (e.focusLevel || 5), 0) /
          lastWeekEntries.length
        : 0;

    let percentChange = 0;
    if (lastWeekAvg > 0) {
      percentChange = Math.round(
        ((thisWeekAvg - lastWeekAvg) / lastWeekAvg) * 100
      );
    } else if (thisWeekAvg > 0) {
      percentChange = 100;
    }

    return {
      percentChange,
      from: Math.round(lastWeekAvg * 10) / 10,
      to: Math.round(thisWeekAvg * 10) / 10,
    };
  }, [entries]);

  // Find recurring challenges
  const recurringChallenges = useCallback(
    (limit: number = 5): RecurringChallenge[] => {
      const phraseCounts: Record<string, number> = {};

      entries.forEach((entry) => {
        if (!entry.challenge) return;

        const phrases = extractPhrases(entry.challenge);
        const seenInEntry = new Set<string>();

        phrases.forEach((phrase) => {
          // Only count each phrase once per entry
          if (!seenInEntry.has(phrase)) {
            phraseCounts[phrase] = (phraseCounts[phrase] || 0) + 1;
            seenInEntry.add(phrase);
          }
        });
      });

      return Object.entries(phraseCounts)
        .filter(([, count]) => count >= 2) // Only return recurring (2+)
        .map(([text, occurrences]) => ({ text, occurrences }))
        .sort((a, b) => b.occurrences - a.occurrences)
        .slice(0, limit);
    },
    [entries]
  );

  // Generate suggested next actions based on heuristics
  const suggestedNextActions = useCallback((): string[] => {
    const suggestions: string[] = [];

    // Get data for heuristics
    const avgFocus = averageFocus(7);
    const tags = topTags(30);
    const challenges = recurringChallenges(10);

    // Heuristic 1: Low average focus
    if (avgFocus > 0 && avgFocus < 5) {
      suggestions.push(
        "🍅 Try a 25-minute Pomodoro session to improve focus"
      );
    }

    // Heuristic 2: Math tag with practice challenges
    const topTag = tags[0]?.tag?.toLowerCase();
    const hasPracticeChallenge = challenges.some(
      (c) =>
        c.text.includes("practice") ||
        c.text.includes("exercises") ||
        c.text.includes("problems")
    );

    if (topTag === "math" && hasPracticeChallenge) {
      suggestions.push("📝 Schedule a dedicated practice session for math");
    }

    // Heuristic 3: Low streak
    if (streak < 3) {
      suggestions.push("✨ Do a reflective journal entry tonight to build your streak");
    }

    // Additional heuristics for more suggestions

    // Heuristic 4: Distraction challenges
    const hasDistractionChallenge = challenges.some(
      (c) =>
        c.text.includes("distraction") ||
        c.text.includes("interruption") ||
        c.text.includes("focus")
    );
    if (hasDistractionChallenge && suggestions.length < 3) {
      suggestions.push(
        "🔕 Find a quieter environment or use focus mode on your devices"
      );
    }

    // Heuristic 5: Fatigue/tiredness
    const hasFatigueChallenge = challenges.some(
      (c) =>
        c.text.includes("tired") ||
        c.text.includes("fatigue") ||
        c.text.includes("exhausted")
    );
    if (hasFatigueChallenge && suggestions.length < 3) {
      suggestions.push(
        "😴 Consider studying earlier in the day when you have more energy"
      );
    }

    // Heuristic 6: No entries recently
    if (entries.length === 0) {
      suggestions.push("📖 Start your learning journey with your first entry!");
    } else {
      const lastEntryDate = new Date(entries[0]?.date);
      const daysSinceLastEntry = Math.floor(
        (Date.now() - lastEntryDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastEntry >= 3 && suggestions.length < 3) {
        suggestions.push(
          "🔥 It's been a few days - write an entry to get back on track!"
        );
      }
    }

    // Heuristic 7: High focus - encourage continuation
    if (avgFocus >= 8 && suggestions.length < 3) {
      suggestions.push(
        "🌟 Your focus is excellent! Try tackling a challenging topic today"
      );
    }

    // Heuristic 8: Tech tag with syntax challenges
    if (
      topTag === "tech" &&
      challenges.some(
        (c) => c.text.includes("syntax") || c.text.includes("debugging")
      ) &&
      suggestions.length < 3
    ) {
      suggestions.push(
        "💻 Practice with small code exercises to build syntax familiarity"
      );
    }

    // Return top 3 suggestions
    return suggestions.slice(0, 3);
  }, [entries, averageFocus, topTags, recurringChallenges, streak]);

  return {
    topTags,
    averageFocus,
    weeklyChangeFocus,
    recurringChallenges,
    suggestedNextActions,
  };
}

export default useInsights;

