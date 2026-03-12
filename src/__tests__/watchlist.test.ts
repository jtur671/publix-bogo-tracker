import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWatchlist } from "@/hooks/use-watchlist";
import type { Deal } from "@/types";

// ---------------------------------------------------------------------------
// Mock the Supabase-backed watchlist module so the hook always falls through
// to localStorage (which jsdom provides).
// ---------------------------------------------------------------------------
vi.mock("@/lib/watchlist", () => ({
  getWatchlist: vi.fn().mockRejectedValue(new Error("Supabase not configured")),
  addToWatchlist: vi.fn().mockRejectedValue(new Error("Supabase not configured")),
  removeFromWatchlist: vi.fn().mockRejectedValue(new Error("Supabase not configured")),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDeal(overrides: Partial<Deal> = {}): Deal {
  return {
    id: Math.floor(Math.random() * 100000),
    name: "Test Deal",
    description: "",
    imageUrl: "",
    price: null,
    priceText: null,
    saleStory: null,
    validFrom: "2026-03-10",
    validTo: "2026-03-17",
    category: "Other",
    daysLeft: 5,
    isExpiringSoon: false,
    merchantName: "Publix",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useWatchlist", () => {
  describe("addKeyword", () => {
    it("should add a keyword to the list", async () => {
      const { result } = renderHook(() => useWatchlist());

      // Wait for initial load
      await vi.waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addKeyword("chicken");
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].keyword).toBe("chicken");
    });

    it("should lowercase and trim keywords", async () => {
      const { result } = renderHook(() => useWatchlist());

      await vi.waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addKeyword("  Chicken Breast  ");
      });

      expect(result.current.items[0].keyword).toBe("chicken breast");
    });

    it("should prevent duplicate keywords", async () => {
      const { result } = renderHook(() => useWatchlist());

      await vi.waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addKeyword("yogurt");
      });

      await act(async () => {
        await result.current.addKeyword("yogurt");
      });

      expect(result.current.items).toHaveLength(1);
    });

    it("should prevent duplicates regardless of case", async () => {
      const { result } = renderHook(() => useWatchlist());

      await vi.waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addKeyword("Yogurt");
      });

      await act(async () => {
        await result.current.addKeyword("YOGURT");
      });

      expect(result.current.items).toHaveLength(1);
    });

    it("should not add empty keywords", async () => {
      const { result } = renderHook(() => useWatchlist());

      await vi.waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addKeyword("");
      });

      await act(async () => {
        await result.current.addKeyword("   ");
      });

      expect(result.current.items).toHaveLength(0);
    });

    it("should prepend new items to the list", async () => {
      const { result } = renderHook(() => useWatchlist());

      await vi.waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addKeyword("first");
      });

      await act(async () => {
        await result.current.addKeyword("second");
      });

      expect(result.current.items[0].keyword).toBe("second");
      expect(result.current.items[1].keyword).toBe("first");
    });
  });

  describe("removeKeyword", () => {
    it("should remove a keyword by id", async () => {
      const { result } = renderHook(() => useWatchlist());

      await vi.waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addKeyword("chicken");
      });

      const id = result.current.items[0].id;

      await act(async () => {
        await result.current.removeKeyword(id);
      });

      expect(result.current.items).toHaveLength(0);
    });

    it("should also remove checked state when item is removed", async () => {
      const { result } = renderHook(() => useWatchlist());

      await vi.waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addKeyword("chicken");
      });

      const id = result.current.items[0].id;

      // Check the item
      act(() => {
        result.current.toggleChecked(id);
      });

      expect(result.current.checkedItems.has(id)).toBe(true);

      // Remove the item
      await act(async () => {
        await result.current.removeKeyword(id);
      });

      expect(result.current.checkedItems.has(id)).toBe(false);
    });
  });

  describe("toggleChecked", () => {
    it("should check an item", async () => {
      const { result } = renderHook(() => useWatchlist());

      await vi.waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addKeyword("bread");
      });

      const id = result.current.items[0].id;

      act(() => {
        result.current.toggleChecked(id);
      });

      expect(result.current.checkedItems.has(id)).toBe(true);
    });

    it("should uncheck a previously checked item", async () => {
      const { result } = renderHook(() => useWatchlist());

      await vi.waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addKeyword("bread");
      });

      const id = result.current.items[0].id;

      act(() => {
        result.current.toggleChecked(id);
      });

      act(() => {
        result.current.toggleChecked(id);
      });

      expect(result.current.checkedItems.has(id)).toBe(false);
    });
  });

  describe("clearChecked", () => {
    it("should clear all checked items", async () => {
      const { result } = renderHook(() => useWatchlist());

      await vi.waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addKeyword("bread");
      });

      await act(async () => {
        await result.current.addKeyword("milk");
      });

      act(() => {
        result.current.toggleChecked(result.current.items[0].id);
      });

      act(() => {
        result.current.toggleChecked(result.current.items[1].id);
      });

      expect(result.current.checkedItems.size).toBe(2);

      act(() => {
        result.current.clearChecked();
      });

      expect(result.current.checkedItems.size).toBe(0);
    });
  });

  describe("isWatched", () => {
    it("should return true when deal name matches a keyword", async () => {
      const { result } = renderHook(() => useWatchlist());

      await vi.waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addKeyword("chicken");
      });

      const deal = makeDeal({ name: "Perdue Chicken Breast" });
      expect(result.current.isWatched(deal)).toBe(true);
    });

    it("should return true when deal description matches a keyword", async () => {
      const { result } = renderHook(() => useWatchlist());

      await vi.waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addKeyword("organic");
      });

      const deal = makeDeal({
        name: "Brand X Product",
        description: "organic free range eggs",
      });
      expect(result.current.isWatched(deal)).toBe(true);
    });

    it("should return false when no keyword matches", async () => {
      const { result } = renderHook(() => useWatchlist());

      await vi.waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addKeyword("chicken");
      });

      const deal = makeDeal({ name: "Lay's Potato Chips" });
      expect(result.current.isWatched(deal)).toBe(false);
    });

    it("should be case insensitive", async () => {
      const { result } = renderHook(() => useWatchlist());

      await vi.waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addKeyword("CHICKEN");
      });

      const deal = makeDeal({ name: "chicken breast" });
      expect(result.current.isWatched(deal)).toBe(true);
    });
  });

  describe("localStorage persistence", () => {
    it("should persist watchlist to localStorage", async () => {
      const { result } = renderHook(() => useWatchlist());

      await vi.waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addKeyword("chicken");
      });

      const stored = JSON.parse(localStorage.getItem("bogo-watchlist") || "[]");
      expect(stored).toHaveLength(1);
      expect(stored[0].keyword).toBe("chicken");
    });

    it("should persist checked items to localStorage", async () => {
      const { result } = renderHook(() => useWatchlist());

      await vi.waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addKeyword("bread");
      });

      const id = result.current.items[0].id;

      act(() => {
        result.current.toggleChecked(id);
      });

      const stored = JSON.parse(
        localStorage.getItem("bogo-checked-items") || "[]"
      );
      expect(stored).toContain(id);
    });

    it("should load watchlist from localStorage on mount", async () => {
      // Pre-seed localStorage
      const seedItem = {
        id: "test-id-123",
        keyword: "yogurt",
        added_at: new Date().toISOString(),
        last_matched_deal_id: null,
        last_notified_at: null,
      };
      localStorage.setItem("bogo-watchlist", JSON.stringify([seedItem]));

      const { result } = renderHook(() => useWatchlist());

      await vi.waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].keyword).toBe("yogurt");
    });

    it("should handle corrupted localStorage gracefully", async () => {
      localStorage.setItem("bogo-watchlist", "not valid json{{{");

      const { result } = renderHook(() => useWatchlist());

      await vi.waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should fall back to empty array, not crash
      expect(result.current.items).toHaveLength(0);
    });
  });
});
