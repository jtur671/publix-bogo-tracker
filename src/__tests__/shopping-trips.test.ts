import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useShoppingTrip } from "@/hooks/use-shopping-trips";
import type { Deal, WatchlistItem } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeWatchlistItem(keyword: string): WatchlistItem {
  return {
    id: crypto.randomUUID(),
    keyword,
    added_at: new Date().toISOString(),
    last_matched_deal_id: null,
    last_notified_at: null,
  };
}

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

describe("useShoppingTrip", () => {
  describe("trip lifecycle", () => {
    it("should start with no active trip", () => {
      const { result } = renderHook(() => useShoppingTrip([]));
      expect(result.current.trip).toBeNull();
    });

    it("should create a trip from watchlist items", () => {
      const deals = [makeDeal({ name: "Cheerios Cereal BOGO" })];
      const { result } = renderHook(() => useShoppingTrip(deals));

      const watchlist = [
        makeWatchlistItem("cheerios"),
        makeWatchlistItem("milk"),
      ];

      act(() => {
        result.current.startTrip(watchlist);
      });

      expect(result.current.trip).not.toBeNull();
      expect(result.current.trip!.items).toHaveLength(2);
      expect(result.current.trip!.completed_at).toBeNull();
    });

    it("should toggle items with timestamp", () => {
      const { result } = renderHook(() => useShoppingTrip([]));

      act(() => {
        result.current.startTrip([makeWatchlistItem("milk")]);
      });

      const itemId = result.current.trip!.items[0].id;

      // Check item
      act(() => {
        result.current.toggleItem(itemId);
      });

      expect(result.current.trip!.items[0].checked).toBe(true);
      expect(result.current.trip!.items[0].checked_at).not.toBeNull();

      // Uncheck item
      act(() => {
        result.current.toggleItem(itemId);
      });

      expect(result.current.trip!.items[0].checked).toBe(false);
      expect(result.current.trip!.items[0].checked_at).toBeNull();
    });

    it("should end trip and archive to history", () => {
      const { result } = renderHook(() => useShoppingTrip([]));

      act(() => {
        result.current.startTrip([makeWatchlistItem("bread")]);
      });

      act(() => {
        result.current.endTrip();
      });

      expect(result.current.trip).toBeNull();

      // Verify archived
      const history = JSON.parse(
        localStorage.getItem("bogo-trip-history") || "[]"
      );
      expect(history).toHaveLength(1);
      expect(history[0].completed_at).not.toBeNull();
    });
  });

  describe("BOGO detection", () => {
    it("should flag items matching current deals as has_bogo", () => {
      const deals = [
        makeDeal({ name: "Cheerios Cereal BOGO", description: "Buy one get one free" }),
        makeDeal({ name: "Lay's Potato Chips BOGO" }),
      ];
      const { result } = renderHook(() => useShoppingTrip(deals));

      act(() => {
        result.current.startTrip([
          makeWatchlistItem("cheerios"),
          makeWatchlistItem("toothpaste"),
        ]);
      });

      const cheerios = result.current.trip!.items.find(
        (i) => i.name === "cheerios"
      );
      const toothpaste = result.current.trip!.items.find(
        (i) => i.name === "toothpaste"
      );

      expect(cheerios!.has_bogo).toBe(true);
      expect(toothpaste!.has_bogo).toBe(false);
    });

    it("should auto-detect BOGO when adding mid-trip", () => {
      const deals = [makeDeal({ name: "Coca-Cola 12 Pack BOGO" })];
      const { result } = renderHook(() => useShoppingTrip(deals));

      act(() => {
        result.current.startTrip([]);
      });

      act(() => {
        result.current.addItem("coca-cola");
      });

      expect(result.current.trip!.items[0].has_bogo).toBe(true);

      act(() => {
        result.current.addItem("bananas");
      });

      expect(result.current.trip!.items[1].has_bogo).toBe(false);
    });
  });

  describe("add mid-trip", () => {
    it("should append an item to the active trip", () => {
      const { result } = renderHook(() => useShoppingTrip([]));

      act(() => {
        result.current.startTrip([makeWatchlistItem("milk")]);
      });

      act(() => {
        result.current.addItem("eggs");
      });

      expect(result.current.trip!.items).toHaveLength(2);
      expect(result.current.trip!.items[1].name).toBe("eggs");
    });

    it("should not add empty items", () => {
      const { result } = renderHook(() => useShoppingTrip([]));

      act(() => {
        result.current.startTrip([makeWatchlistItem("milk")]);
      });

      act(() => {
        result.current.addItem("  ");
      });

      expect(result.current.trip!.items).toHaveLength(1);
    });

    it("should do nothing if no active trip", () => {
      const { result } = renderHook(() => useShoppingTrip([]));

      act(() => {
        result.current.addItem("eggs");
      });

      expect(result.current.trip).toBeNull();
    });
  });

  describe("remove item", () => {
    it("should remove an item from the trip", () => {
      const { result } = renderHook(() => useShoppingTrip([]));

      act(() => {
        result.current.startTrip([
          makeWatchlistItem("milk"),
          makeWatchlistItem("bread"),
        ]);
      });

      const itemId = result.current.trip!.items[0].id;

      act(() => {
        result.current.removeItem(itemId);
      });

      expect(result.current.trip!.items).toHaveLength(1);
    });
  });

  describe("persistence", () => {
    it("should persist trip to localStorage", async () => {
      const { result } = renderHook(() => useShoppingTrip([]));

      act(() => {
        result.current.startTrip([makeWatchlistItem("bread")]);
      });

      // Wait for effect to persist
      await vi.waitFor(() => {
        const stored = localStorage.getItem("bogo-active-trip");
        expect(stored).not.toBeNull();
      });

      const stored = JSON.parse(
        localStorage.getItem("bogo-active-trip") || "null"
      );
      expect(stored.items).toHaveLength(1);
      expect(stored.items[0].name).toBe("bread");
    });

    it("should load trip from localStorage on mount", () => {
      // Pre-seed localStorage
      const seedTrip = {
        id: "test-trip",
        started_at: new Date().toISOString(),
        completed_at: null,
        items: [
          {
            id: "item-1",
            name: "yogurt",
            checked: false,
            checked_at: null,
            has_bogo: false,
            added_at: new Date().toISOString(),
          },
        ],
      };
      localStorage.setItem("bogo-active-trip", JSON.stringify(seedTrip));

      const { result } = renderHook(() => useShoppingTrip([]));

      expect(result.current.trip).not.toBeNull();
      expect(result.current.trip!.items[0].name).toBe("yogurt");
    });
  });

  describe("edge cases", () => {
    it("should allow starting a new trip when one is active", () => {
      const { result } = renderHook(() => useShoppingTrip([]));

      act(() => {
        result.current.startTrip([makeWatchlistItem("old item")]);
      });

      const oldTripId = result.current.trip!.id;

      act(() => {
        result.current.startTrip([makeWatchlistItem("new item")]);
      });

      expect(result.current.trip!.id).not.toBe(oldTripId);
      expect(result.current.trip!.items[0].name).toBe("new item");
    });

    it("should handle empty watchlist", () => {
      const { result } = renderHook(() => useShoppingTrip([]));

      act(() => {
        result.current.startTrip([]);
      });

      expect(result.current.trip).not.toBeNull();
      expect(result.current.trip!.items).toHaveLength(0);
    });

    it("should handle toggling same item twice", () => {
      const { result } = renderHook(() => useShoppingTrip([]));

      act(() => {
        result.current.startTrip([makeWatchlistItem("milk")]);
      });

      const itemId = result.current.trip!.items[0].id;

      act(() => {
        result.current.toggleItem(itemId);
      });
      act(() => {
        result.current.toggleItem(itemId);
      });

      expect(result.current.trip!.items[0].checked).toBe(false);
      expect(result.current.trip!.items[0].checked_at).toBeNull();
    });
  });
});
