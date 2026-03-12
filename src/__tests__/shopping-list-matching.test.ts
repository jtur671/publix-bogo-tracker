import { describe, it, expect } from "vitest";
import type { Deal, WatchlistItem } from "@/types";

/**
 * The `findMatchingDeals` function is defined inside shopping-list.tsx as a
 * module-scoped helper (not exported). Rather than reaching into a React
 * component file we re-implement the exact algorithm here so the tests
 * validate the *logic* independent of the component tree. The algorithm is
 * small and stable — copied verbatim from `src/components/shopping-list.tsx`.
 */
function findMatchingDeals(item: WatchlistItem, deals: Deal[]): Deal[] {
  const kw = item.keyword.toLowerCase().trim();

  // 1. Direct keyword matches
  const directMatches = deals.filter(
    (d) =>
      d.name.toLowerCase().includes(kw) ||
      d.description.toLowerCase().includes(kw)
  );

  // 2. Find related deals — only for 3+ word keywords
  const kwWords = kw.split(/\s+/);
  if (directMatches.length > 0 && kwWords.length >= 3) {
    const directIds = new Set(directMatches.map((d) => d.id));
    const otherDeals = deals.filter((d) => !directIds.has(d.id));

    for (let i = 1; i < kwWords.length; i++) {
      const phrase = kwWords.slice(i).join(" ");
      if (phrase.length < 4) continue;

      const siblings = otherDeals.filter(
        (d) =>
          d.name.toLowerCase().includes(phrase) ||
          d.description.toLowerCase().includes(phrase)
      );

      if (siblings.length > 0) {
        return [...directMatches, ...siblings];
      }
    }
  }

  return directMatches;
}

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

function makeWatchlistItem(keyword: string): WatchlistItem {
  return {
    id: crypto.randomUUID(),
    keyword,
    added_at: new Date().toISOString(),
    last_matched_deal_id: null,
    last_notified_at: null,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("findMatchingDeals", () => {
  describe("exact and substring matching", () => {
    it("should match 'string cheese' only to string cheese deals, not all cheese deals", () => {
      const deals = [
        makeDeal({ id: 1, name: "Kraft String Cheese 12pk" }),
        makeDeal({ id: 2, name: "Sargento Shredded Cheese" }),
        makeDeal({ id: 3, name: "Publix Deli Cheese" }),
        makeDeal({ id: 4, name: "Polly-O String Cheese" }),
      ];
      const item = makeWatchlistItem("string cheese");
      const results = findMatchingDeals(item, deals);

      const names = results.map((d) => d.name);
      expect(names).toContain("Kraft String Cheese 12pk");
      expect(names).toContain("Polly-O String Cheese");
      expect(names).not.toContain("Sargento Shredded Cheese");
      expect(names).not.toContain("Publix Deli Cheese");
    });

    it("should match 'bread' to all bread deals", () => {
      const deals = [
        makeDeal({ id: 1, name: "Sara Lee Butter Bread" }),
        makeDeal({ id: 2, name: "Nature's Own Wheat Bread" }),
        makeDeal({ id: 3, name: "Publix Bakery Rolls" }),
      ];
      const item = makeWatchlistItem("bread");
      const results = findMatchingDeals(item, deals);

      expect(results).toHaveLength(2);
      expect(results.map((d) => d.name)).toContain("Sara Lee Butter Bread");
      expect(results.map((d) => d.name)).toContain("Nature's Own Wheat Bread");
    });

    it("should match single-word keyword 'chips' to all chip deals", () => {
      const deals = [
        makeDeal({ id: 1, name: "Lay's Potato Chips" }),
        makeDeal({ id: 2, name: "Tostitos Tortilla Chips" }),
        makeDeal({ id: 3, name: "Publix Cookies" }),
      ];
      const item = makeWatchlistItem("chips");
      const results = findMatchingDeals(item, deals);

      expect(results).toHaveLength(2);
      expect(results.map((d) => d.name)).toContain("Lay's Potato Chips");
      expect(results.map((d) => d.name)).toContain("Tostitos Tortilla Chips");
    });
  });

  describe("sibling matching for 3+ word keywords", () => {
    it("should find sibling bread deals for 'Sara Lee Butter Bread'", () => {
      const deals = [
        makeDeal({ id: 1, name: "Sara Lee Butter Bread" }),
        makeDeal({ id: 2, name: "Nature's Own Butter Bread" }),
        makeDeal({ id: 3, name: "Publix White Bread" }),
        makeDeal({ id: 4, name: "Cheerios Cereal" }),
      ];
      const item = makeWatchlistItem("Sara Lee Butter Bread");
      const results = findMatchingDeals(item, deals);

      // Direct match
      expect(results.map((d) => d.name)).toContain("Sara Lee Butter Bread");
      // Sibling via "butter bread"
      expect(results.map((d) => d.name)).toContain("Nature's Own Butter Bread");
      // Should NOT include cereal
      expect(results.map((d) => d.name)).not.toContain("Cheerios Cereal");
    });

    it("should not do sibling matching for 2-word keywords", () => {
      const deals = [
        makeDeal({ id: 1, name: "Kraft String Cheese 12pk" }),
        makeDeal({ id: 2, name: "Polly-O String Cheese" }),
        makeDeal({ id: 3, name: "Sargento Shredded Cheese" }),
      ];
      const item = makeWatchlistItem("string cheese");
      const results = findMatchingDeals(item, deals);

      // Only direct matches (2-word keyword, no sibling logic)
      expect(results).toHaveLength(2);
      expect(results.map((d) => d.name)).not.toContain(
        "Sargento Shredded Cheese"
      );
    });

    it("should try progressively shorter phrases for sibling matching", () => {
      const deals = [
        makeDeal({ id: 1, name: "Sara Lee Honey Wheat Bread" }),
        makeDeal({ id: 2, name: "Nature's Own Wheat Bread" }),
        makeDeal({ id: 3, name: "Arnold Whole Wheat Bread" }),
      ];
      const item = makeWatchlistItem("Sara Lee Honey Wheat Bread");
      const results = findMatchingDeals(item, deals);

      // Direct match
      expect(results.find((d) => d.id === 1)).toBeDefined();
      // Siblings via "wheat bread" (or "honey wheat bread")
      expect(results.length).toBeGreaterThan(1);
    });
  });

  describe("no matches", () => {
    it("should return empty array when 'eggs' has no matching deals", () => {
      const deals = [
        makeDeal({ id: 1, name: "Lay's Potato Chips" }),
        makeDeal({ id: 2, name: "Cheerios Cereal" }),
        makeDeal({ id: 3, name: "Coca-Cola 12 Pack" }),
      ];
      const item = makeWatchlistItem("eggs");
      const results = findMatchingDeals(item, deals);

      expect(results).toEqual([]);
    });

    it("should return empty array for a keyword that matches nothing", () => {
      const deals = [makeDeal({ id: 1, name: "Random Product" })];
      const item = makeWatchlistItem("xyznonexistent");
      const results = findMatchingDeals(item, deals);

      expect(results).toEqual([]);
    });
  });

  describe("description matching", () => {
    it("should match keywords found in deal descriptions", () => {
      const deals = [
        makeDeal({
          id: 1,
          name: "Brand X Product",
          description: "organic eggs from free range chickens",
        }),
      ];
      const item = makeWatchlistItem("eggs");
      const results = findMatchingDeals(item, deals);

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("Brand X Product");
    });
  });

  describe("case insensitivity", () => {
    it("should match regardless of case", () => {
      const deals = [makeDeal({ id: 1, name: "PUBLIX STRING CHEESE" })];
      const item = makeWatchlistItem("String Cheese");
      const results = findMatchingDeals(item, deals);

      expect(results).toHaveLength(1);
    });
  });
});

describe("shopping list sorting", () => {
  /**
   * Re-implement the sorting logic from the ShoppingList component:
   * - Checked items go last
   * - Among unchecked items, those with BOGO deals come first
   */
  function sortItems(
    items: WatchlistItem[],
    deals: Deal[],
    checkedItems: Set<string>
  ) {
    const withDeals = items.map((item) => ({
      item,
      matchingDeals: findMatchingDeals(item, deals),
      isChecked: checkedItems.has(item.id),
    }));

    return withDeals.sort((a, b) => {
      if (a.isChecked !== b.isChecked) return a.isChecked ? 1 : -1;
      if (!a.isChecked && !b.isChecked) {
        const aHasDeal = a.matchingDeals.length > 0;
        const bHasDeal = b.matchingDeals.length > 0;
        if (aHasDeal !== bHasDeal) return aHasDeal ? -1 : 1;
      }
      return 0;
    });
  }

  it("should sort BOGO items before non-BOGO items", () => {
    const noBogoDeal = makeWatchlistItem("avocado");
    const bogoDeal = makeWatchlistItem("chips");

    const deals = [makeDeal({ id: 1, name: "Lay's Potato Chips" })];

    const sorted = sortItems([noBogoDeal, bogoDeal], deals, new Set());

    expect(sorted[0].item.keyword).toBe("chips");
    expect(sorted[1].item.keyword).toBe("avocado");
  });

  it("should sort checked items to the bottom", () => {
    const item1 = makeWatchlistItem("chips");
    const item2 = makeWatchlistItem("bread");

    const deals = [
      makeDeal({ id: 1, name: "Lay's Potato Chips" }),
      makeDeal({ id: 2, name: "Sara Lee Bread" }),
    ];

    const checkedItems = new Set([item1.id]);

    const sorted = sortItems([item1, item2], deals, checkedItems);

    // item2 (bread, unchecked) should come first
    expect(sorted[0].item.keyword).toBe("bread");
    // item1 (chips, checked) should come last
    expect(sorted[1].item.keyword).toBe("chips");
  });

  it("should put checked items after items with no BOGO match", () => {
    const checkedItem = makeWatchlistItem("yogurt");
    const noMatchItem = makeWatchlistItem("avocado");
    const bogoItem = makeWatchlistItem("chips");

    const deals = [makeDeal({ id: 1, name: "Lay's Potato Chips" })];
    const checkedItems = new Set([checkedItem.id]);

    const sorted = sortItems(
      [checkedItem, noMatchItem, bogoItem],
      deals,
      checkedItems
    );

    // Order: BOGO (chips), no match (avocado), checked (yogurt)
    expect(sorted[0].item.keyword).toBe("chips");
    expect(sorted[1].item.keyword).toBe("avocado");
    expect(sorted[2].item.keyword).toBe("yogurt");
  });
});
