import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useInsights } from "@/hooks/useInsights";
import { useJournalStore } from "@/hooks/useJournal";
import { useGamificationStore } from "@/hooks/useGamification";

describe("useInsights", () => {
  beforeEach(() => {
    // Reset stores before each test
    useJournalStore.setState({
      entries: [],
      activeTemplateId: "full",
    });
    useGamificationStore.getState()._resetState();
  });

  describe("topTags", () => {
    it("should return empty array when no entries", () => {
      const { result } = renderHook(() => useInsights());
      expect(result.current.topTags()).toHaveLength(0);
    });

    it("should return tags sorted by count", () => {
      // Add entries with tags
      useJournalStore.setState({
        entries: [
          {
            id: "1",
            date: new Date().toISOString(),
            title: "Test",
            concept: "Test",
            challenge: "Test",
            focus: 30,
            focusLevel: 7,
            improve: "Test",
            tags: ["tech", "math"],
            xpEarned: 10,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "2",
            date: new Date().toISOString(),
            title: "Test 2",
            concept: "Test",
            challenge: "Test",
            focus: 30,
            focusLevel: 7,
            improve: "Test",
            tags: ["tech"],
            xpEarned: 10,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        activeTemplateId: "full",
      });

      const { result } = renderHook(() => useInsights());
      const topTags = result.current.topTags();

      expect(topTags[0].tag).toBe("tech");
      expect(topTags[0].count).toBe(2);
      expect(topTags[1].tag).toBe("math");
      expect(topTags[1].count).toBe(1);
    });

    it("should filter by last N days", () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10);

      useJournalStore.setState({
        entries: [
          {
            id: "1",
            date: new Date().toISOString(),
            title: "Recent",
            concept: "Test",
            challenge: "Test",
            focus: 30,
            focusLevel: 7,
            improve: "Test",
            tags: ["recent"],
            xpEarned: 10,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "2",
            date: oldDate.toISOString(),
            title: "Old",
            concept: "Test",
            challenge: "Test",
            focus: 30,
            focusLevel: 7,
            improve: "Test",
            tags: ["old"],
            xpEarned: 10,
            createdAt: oldDate.toISOString(),
            updatedAt: oldDate.toISOString(),
          },
        ],
        activeTemplateId: "full",
      });

      const { result } = renderHook(() => useInsights());
      const topTags = result.current.topTags(7);

      expect(topTags).toHaveLength(1);
      expect(topTags[0].tag).toBe("recent");
    });
  });

  describe("averageFocus", () => {
    it("should return 0 when no entries", () => {
      const { result } = renderHook(() => useInsights());
      expect(result.current.averageFocus()).toBe(0);
    });

    it("should calculate average focus level", () => {
      useJournalStore.setState({
        entries: [
          {
            id: "1",
            date: new Date().toISOString(),
            title: "Test",
            concept: "Test",
            challenge: "Test",
            focus: 30,
            focusLevel: 8,
            improve: "Test",
            tags: [],
            xpEarned: 10,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "2",
            date: new Date().toISOString(),
            title: "Test 2",
            concept: "Test",
            challenge: "Test",
            focus: 30,
            focusLevel: 6,
            improve: "Test",
            tags: [],
            xpEarned: 10,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        activeTemplateId: "full",
      });

      const { result } = renderHook(() => useInsights());
      expect(result.current.averageFocus()).toBe(7);
    });
  });

  describe("weeklyChangeFocus", () => {
    it("should return zeros when no entries", () => {
      const { result } = renderHook(() => useInsights());
      const change = result.current.weeklyChangeFocus();

      expect(change.from).toBe(0);
      expect(change.to).toBe(0);
      expect(change.percentChange).toBe(0);
    });

    it("should calculate weekly change", () => {
      const today = new Date();
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 10);

      useJournalStore.setState({
        entries: [
          {
            id: "1",
            date: today.toISOString(),
            title: "This week",
            concept: "Test",
            challenge: "Test",
            focus: 30,
            focusLevel: 8,
            improve: "Test",
            tags: [],
            xpEarned: 10,
            createdAt: today.toISOString(),
            updatedAt: today.toISOString(),
          },
          {
            id: "2",
            date: lastWeek.toISOString(),
            title: "Last week",
            concept: "Test",
            challenge: "Test",
            focus: 30,
            focusLevel: 6,
            improve: "Test",
            tags: [],
            xpEarned: 10,
            createdAt: lastWeek.toISOString(),
            updatedAt: lastWeek.toISOString(),
          },
        ],
        activeTemplateId: "full",
      });

      const { result } = renderHook(() => useInsights());
      const change = result.current.weeklyChangeFocus();

      expect(change.to).toBe(8);
      expect(change.from).toBe(6);
      expect(change.percentChange).toBeGreaterThan(0);
    });
  });

  describe("recurringChallenges", () => {
    it("should return empty array when no entries", () => {
      const { result } = renderHook(() => useInsights());
      expect(result.current.recurringChallenges()).toHaveLength(0);
    });

    it("should identify recurring challenges", () => {
      useJournalStore.setState({
        entries: [
          {
            id: "1",
            date: new Date().toISOString(),
            title: "Test",
            concept: "Test",
            challenge: "Distractions were the main issue",
            focus: 30,
            focusLevel: 5,
            improve: "Test",
            tags: [],
            xpEarned: 10,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "2",
            date: new Date().toISOString(),
            title: "Test 2",
            concept: "Test",
            challenge: "Too many distractions today",
            focus: 30,
            focusLevel: 5,
            improve: "Test",
            tags: [],
            xpEarned: 10,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        activeTemplateId: "full",
      });

      const { result } = renderHook(() => useInsights());
      const challenges = result.current.recurringChallenges();

      expect(challenges.length).toBeGreaterThan(0);
      expect(challenges[0].occurrences).toBeGreaterThanOrEqual(2);
    });
  });

  describe("suggestedNextActions", () => {
    it("should return suggestions array", () => {
      const { result } = renderHook(() => useInsights());
      const suggestions = result.current.suggestedNextActions();

      expect(Array.isArray(suggestions)).toBe(true);
    });

    it("should suggest starting journal when no entries", () => {
      const { result } = renderHook(() => useInsights());
      const suggestions = result.current.suggestedNextActions();

      expect(suggestions.some((s) => s.toLowerCase().includes("first entry"))).toBe(true);
    });

    it("should suggest streak building when streak is low", () => {
      useJournalStore.setState({
        entries: [
          {
            id: "1",
            date: new Date().toISOString(),
            title: "Test",
            concept: "Test",
            challenge: "Test",
            focus: 30,
            focusLevel: 7,
            improve: "Test",
            tags: [],
            xpEarned: 10,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        activeTemplateId: "full",
      });

      const { result } = renderHook(() => useInsights());
      const suggestions = result.current.suggestedNextActions();

      // Streak is 0 in gamification store, should suggest building streak
      expect(
        suggestions.some((s) => s.toLowerCase().includes("streak") || s.toLowerCase().includes("entry"))
      ).toBe(true);
    });

    it("should limit suggestions to 3", () => {
      const { result } = renderHook(() => useInsights());
      const suggestions = result.current.suggestedNextActions();

      expect(suggestions.length).toBeLessThanOrEqual(3);
    });
  });
});

