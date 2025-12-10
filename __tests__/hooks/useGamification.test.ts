import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGamification, useGamificationStore } from "@/hooks/useGamification";

describe("useGamification", () => {
  beforeEach(() => {
    // Reset store before each test
    useGamificationStore.getState()._resetState();
  });

  describe("XP and Level", () => {
    it("should start with 0 XP", () => {
      const { result } = renderHook(() => useGamification());
      expect(result.current.xp).toBe(0);
    });

    it("should start at level 0", () => {
      const { result } = renderHook(() => useGamification());
      expect(result.current.level).toBe(0);
    });

    it("should add XP", () => {
      const { result } = renderHook(() => useGamification());

      act(() => {
        result.current.addXP(50);
      });

      expect(result.current.xp).toBe(50);
    });

    it("should calculate level correctly", () => {
      const { result } = renderHook(() => useGamification());

      act(() => {
        result.current.addXP(100);
      });

      expect(result.current.level).toBe(1);

      act(() => {
        result.current.addXP(100);
      });

      expect(result.current.level).toBe(2);
    });

    it("should calculate XP progress correctly", () => {
      const { result } = renderHook(() => useGamification());

      act(() => {
        result.current.addXP(150);
      });

      expect(result.current.xpProgress.current).toBe(50);
      expect(result.current.xpProgress.required).toBe(100);
      expect(result.current.xpProgress.percentage).toBe(50);
    });
  });

  describe("Streak", () => {
    it("should start with 0 streak", () => {
      const { result } = renderHook(() => useGamification());
      expect(result.current.streak).toBe(0);
    });

    it("should get streak", () => {
      const { result } = renderHook(() => useGamification());
      expect(result.current.getStreak()).toBe(0);
    });

    it("should update streak on entry", () => {
      const { result } = renderHook(() => useGamification());

      act(() => {
        result.current.registerEntry({
          id: "test-1",
          date: new Date().toISOString(),
          tags: ["tech"],
          focusMinutes: 30,
        });
      });

      expect(result.current.streak).toBe(1);
    });

    it("should reset streak", () => {
      const { result } = renderHook(() => useGamification());

      act(() => {
        result.current.registerEntry({
          id: "test-1",
          date: new Date().toISOString(),
          tags: ["tech"],
          focusMinutes: 30,
        });
      });

      expect(result.current.streak).toBe(1);

      act(() => {
        result.current.resetStreak();
      });

      expect(result.current.streak).toBe(0);
    });
  });

  describe("Achievements", () => {
    it("should have default achievements", () => {
      const { result } = renderHook(() => useGamification());
      expect(result.current.achievements).toHaveLength(4);
    });

    it("should have all achievements locked initially", () => {
      const { result } = renderHook(() => useGamification());
      expect(result.current.unlockedAchievements).toHaveLength(0);
      expect(result.current.lockedAchievements).toHaveLength(4);
    });

    it("should check hasAchievement correctly", () => {
      const { result } = renderHook(() => useGamification());
      expect(result.current.hasAchievement("streak-warrior")).toBe(false);
    });
  });

  describe("Unlocks", () => {
    it("should have default unlocks", () => {
      const { result } = renderHook(() => useGamification());
      expect(result.current.unlocks).toHaveLength(3);
    });

    it("should unlock dark mode at level 3", () => {
      const { result } = renderHook(() => useGamification());

      expect(result.current.isUnlocked("dark-mode")).toBe(false);

      act(() => {
        result.current.addXP(300); // Level 3
      });

      expect(result.current.isUnlocked("dark-mode")).toBe(true);
    });

    it("should unlock themes at level 5", () => {
      const { result } = renderHook(() => useGamification());

      expect(result.current.isUnlocked("themes")).toBe(false);

      act(() => {
        result.current.addXP(500); // Level 5
      });

      expect(result.current.isUnlocked("themes")).toBe(true);
    });
  });

  describe("Quests", () => {
    it("should have default quests", () => {
      const { result } = renderHook(() => useGamification());
      expect(result.current.quests.length).toBeGreaterThan(0);
    });

    it("should get available quests", () => {
      const { result } = renderHook(() => useGamification());
      expect(result.current.availableQuests.length).toBeGreaterThan(0);
    });

    it("should start with no completed quests", () => {
      const { result } = renderHook(() => useGamification());
      expect(result.current.completedQuests).toHaveLength(0);
    });

    it("should update quest progress on entry", () => {
      const { result } = renderHook(() => useGamification());

      const initialProgress = result.current.quests.find(
        (q) => q.id === "weekly-entries-3"
      )?.progress;

      act(() => {
        result.current.registerEntry({
          id: "test-1",
          date: new Date().toISOString(),
          tags: ["tech"],
          focusMinutes: 30,
        });
      });

      const newProgress = result.current.quests.find(
        (q) => q.id === "weekly-entries-3"
      )?.progress;

      expect(newProgress).toBeGreaterThan(initialProgress || 0);
    });
  });

  describe("Register Entry", () => {
    it("should award XP when registering entry", () => {
      const { result } = renderHook(() => useGamification());

      act(() => {
        result.current.registerEntry({
          id: "test-1",
          date: new Date().toISOString(),
          tags: ["tech"],
          focusMinutes: 30,
        });
      });

      expect(result.current.xp).toBeGreaterThan(0);
    });

    it("should track total entries", () => {
      const { result } = renderHook(() => useGamification());

      act(() => {
        result.current.registerEntry({
          id: "test-1",
          date: new Date().toISOString(),
          tags: ["tech"],
          focusMinutes: 30,
        });
      });

      expect(result.current.totalEntries).toBe(1);
    });

    it("should track math tagged entries", () => {
      const { result } = renderHook(() => useGamification());

      act(() => {
        result.current.registerEntry({
          id: "test-1",
          date: new Date().toISOString(),
          tags: ["math"],
          focusMinutes: 30,
        });
      });

      const state = useGamificationStore.getState();
      expect(state.mathTaggedEntries).toBe(1);
    });
  });

  describe("Reset State", () => {
    it("should reset all state", () => {
      const { result } = renderHook(() => useGamification());

      act(() => {
        result.current.addXP(500);
        result.current.registerEntry({
          id: "test-1",
          date: new Date().toISOString(),
          tags: ["tech"],
          focusMinutes: 30,
        });
      });

      expect(result.current.xp).toBeGreaterThan(0);

      act(() => {
        result.current.resetState();
      });

      expect(result.current.xp).toBe(0);
      expect(result.current.streak).toBe(0);
      expect(result.current.level).toBe(0);
    });
  });
});

