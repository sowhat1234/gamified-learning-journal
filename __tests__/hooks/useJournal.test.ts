import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useJournal, useJournalStore, JOURNAL_TEMPLATES } from "@/hooks/useJournal";

describe("useJournal", () => {
  beforeEach(() => {
    // Reset store before each test
    useJournalStore.setState({
      entries: [],
      activeTemplateId: "full",
    });
  });

  describe("entries management", () => {
    it("should start with empty entries", () => {
      const { result } = renderHook(() => useJournal());
      expect(result.current.entries).toHaveLength(0);
    });

    it("should add an entry", () => {
      const { result } = renderHook(() => useJournal());

      act(() => {
        result.current.addEntry({
          concept: "Test concept for learning",
          challenge: "Test challenge faced",
          focus: 30,
          improve: "Test improvement goal",
          tags: ["tech"],
        });
      });

      expect(result.current.entries).toHaveLength(1);
      expect(result.current.entries[0].concept).toBe("Test concept for learning");
    });

    it("should generate a title when not provided", () => {
      const { result } = renderHook(() => useJournal());

      act(() => {
        result.current.addEntry({
          concept: "Learning about React hooks and state management",
          challenge: "Understanding useEffect",
          focus: 30,
          improve: "Practice more",
          tags: ["tech"],
        });
      });

      expect(result.current.entries[0].title).toContain("Learning about React");
      expect(result.current.entries[0].title).toContain("Tech");
    });

    it("should delete an entry", () => {
      const { result } = renderHook(() => useJournal());

      act(() => {
        result.current.addEntry({
          concept: "Test concept",
          challenge: "Test challenge",
          focus: 30,
          improve: "Test improve",
        });
      });

      const entryId = result.current.entries[0].id;

      act(() => {
        result.current.deleteEntry(entryId);
      });

      expect(result.current.entries).toHaveLength(0);
    });

    it("should edit an entry", () => {
      const { result } = renderHook(() => useJournal());

      act(() => {
        result.current.addEntry({
          concept: "Original concept",
          challenge: "Test challenge",
          focus: 30,
          improve: "Test improve",
        });
      });

      const entryId = result.current.entries[0].id;

      act(() => {
        result.current.editEntry(entryId, { concept: "Updated concept" });
      });

      expect(result.current.entries[0].concept).toBe("Updated concept");
    });
  });

  describe("templates", () => {
    it("should have default template set to full", () => {
      const { result } = renderHook(() => useJournal());
      expect(result.current.getActiveTemplateId()).toBe("full");
    });

    it("should change active template", () => {
      const { result } = renderHook(() => useJournal());

      act(() => {
        result.current.setActiveTemplate("quick");
      });

      expect(result.current.getActiveTemplateId()).toBe("quick");
    });

    it("should return all templates", () => {
      const { result } = renderHook(() => useJournal());
      const templates = result.current.getAllTemplates();
      
      expect(templates).toHaveLength(3);
      expect(templates.map((t) => t.id)).toContain("full");
      expect(templates.map((t) => t.id)).toContain("quick");
      expect(templates.map((t) => t.id)).toContain("deep");
    });
  });

  describe("queries", () => {
    it("should get entry by id", () => {
      const { result } = renderHook(() => useJournal());

      act(() => {
        result.current.addEntry({
          concept: "Test concept",
          challenge: "Test challenge",
          focus: 30,
          improve: "Test improve",
        });
      });

      const entryId = result.current.entries[0].id;
      const entry = result.current.getEntryById(entryId);

      expect(entry).toBeDefined();
      expect(entry?.id).toBe(entryId);
    });

    it("should get last entry improvement", () => {
      const { result } = renderHook(() => useJournal());

      act(() => {
        result.current.addEntry({
          concept: "Test concept",
          challenge: "Test challenge",
          focus: 30,
          improve: "My improvement goal",
        });
      });

      expect(result.current.getLastEntryImprovement()).toBe("My improvement goal");
    });

    it("should search entries", () => {
      const { result } = renderHook(() => useJournal());

      act(() => {
        result.current.addEntry({
          concept: "Learning React hooks",
          challenge: "Test challenge",
          focus: 30,
          improve: "Test improve",
        });
        result.current.addEntry({
          concept: "Learning Vue composition",
          challenge: "Test challenge",
          focus: 30,
          improve: "Test improve",
        });
      });

      const results = result.current.searchEntries("React");
      expect(results).toHaveLength(1);
      expect(results[0].concept).toContain("React");
    });
  });

  describe("stats", () => {
    it("should calculate stats correctly", () => {
      const { result } = renderHook(() => useJournal());

      act(() => {
        result.current.addEntry({
          concept: "Test concept",
          challenge: "Test challenge",
          focus: 30,
          improve: "Test improve",
          tags: ["tech", "math"],
        });
      });

      const stats = result.current.getStats();

      expect(stats.totalEntries).toBe(1);
      expect(stats.totalFocusMinutes).toBe(30);
      expect(stats.mostUsedTags).toHaveLength(2);
    });
  });
});

