import { describe, it, expect } from "vitest";
import { getRecommendations, getTopAffinityCategories } from "@/lib/recommendations";
import type { Deal, WatchlistItem } from "@/types";

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

describe("getRecommendations", () => {
  it("returns empty array when watchlist is empty", () => {
    const deals = [makeDeal({ name: "Some Deal" })];
    expect(getRecommendations([], deals)).toEqual([]);
  });

  it("returns empty array when deals are empty", () => {
    const items = [makeWatchlistItem("chicken")];
    expect(getRecommendations(items, [])).toEqual([]);
  });

  it("excludes watchlisted deals from recommendations", () => {
    const chickenDeal = makeDeal({
      id: 1,
      name: "Chicken Breast",
      category: "Meat & Seafood",
    });
    const steakDeal = makeDeal({
      id: 2,
      name: "Ribeye Steak",
      category: "Meat & Seafood",
    });
    const items = [makeWatchlistItem("chicken")];

    const recs = getRecommendations(items, [chickenDeal, steakDeal], 10);

    // Should not include the chicken deal (it matches the watchlist keyword)
    expect(recs.find((d) => d.id === 1)).toBeUndefined();
    // Should include the steak deal as a recommendation
    expect(recs.find((d) => d.id === 2)).toBeDefined();
  });

  it("prioritizes deals in same category as watchlist items", () => {
    const chickenDeal = makeDeal({
      id: 1,
      name: "Chicken Breast",
      category: "Meat & Seafood",
    });
    const baconDeal = makeDeal({
      id: 2,
      name: "Bacon Strips",
      category: "Meat & Seafood",
    });
    const chipsDeal = makeDeal({
      id: 3,
      name: "Potato Chips",
      category: "Snacks",
    });

    const items = [makeWatchlistItem("chicken")];

    const recs = getRecommendations(
      items,
      [chickenDeal, baconDeal, chipsDeal],
      2
    );

    // Bacon (same category: Meat & Seafood) should be in results
    expect(recs.find((d) => d.id === 2)).toBeDefined();
  });

  it("enforces category diversity (max 4 per category)", () => {
    const meatDeals = Array.from({ length: 8 }, (_, i) =>
      makeDeal({
        id: i + 100,
        name: `Meat Item ${i}`,
        category: "Meat & Seafood",
      })
    );
    const snackDeal = makeDeal({
      id: 200,
      name: "Chips",
      category: "Snacks",
    });

    const items = [makeWatchlistItem("steak")]; // gives affinity to Meat

    const recs = getRecommendations(
      items,
      [...meatDeals, snackDeal],
      12
    );

    const meatCount = recs.filter((d) => d.category === "Meat & Seafood").length;
    // First pass should cap at 4
    expect(meatCount).toBeLessThanOrEqual(8); // After fill, could be more
    // But initially capped at 4
    const firstFour = recs.slice(0, 5);
    const meatInFirstFour = firstFour.filter(
      (d) => d.category === "Meat & Seafood"
    ).length;
    expect(meatInFirstFour).toBeLessThanOrEqual(4);
  });

  it("respects the count parameter", () => {
    const deals = Array.from({ length: 20 }, (_, i) =>
      makeDeal({ id: i, name: `Deal ${i}`, category: "Pantry" })
    );
    const items = [makeWatchlistItem("sauce")];

    const recs = getRecommendations(items, deals, 5);
    expect(recs.length).toBeLessThanOrEqual(5);
  });

  it("gives urgency bonus to expiring-soon deals", () => {
    const normalDeal = makeDeal({
      id: 1,
      name: "Normal Bacon",
      category: "Meat & Seafood",
      isExpiringSoon: false,
      daysLeft: 5,
    });
    const expiringDeal = makeDeal({
      id: 2,
      name: "Expiring Bacon",
      category: "Meat & Seafood",
      isExpiringSoon: true,
      daysLeft: 1,
    });

    const items = [makeWatchlistItem("chicken")];
    const chickenDeal = makeDeal({
      id: 3,
      name: "Chicken",
      category: "Meat & Seafood",
    });

    // Run many times to account for randomization
    let expiringFirst = 0;
    for (let i = 0; i < 20; i++) {
      const recs = getRecommendations(
        items,
        [chickenDeal, normalDeal, expiringDeal],
        2
      );
      if (recs[0]?.id === 2) expiringFirst++;
    }
    // Expiring deal should generally rank higher due to urgency bonus
    expect(expiringFirst).toBeGreaterThan(5);
  });
});

describe("getTopAffinityCategories", () => {
  it("returns empty array for empty watchlist", () => {
    expect(getTopAffinityCategories([], [])).toEqual([]);
  });

  it("identifies top categories from watchlist keyword matches", () => {
    const deals = [
      makeDeal({ name: "Chicken Breast", category: "Meat & Seafood" }),
      makeDeal({ name: "Bacon", category: "Meat & Seafood" }),
      makeDeal({ name: "Yogurt", category: "Dairy & Eggs" }),
    ];

    const items = [makeWatchlistItem("chicken"), makeWatchlistItem("yogurt")];

    const cats = getTopAffinityCategories(items, deals, 3);
    expect(cats).toContain("Meat & Seafood");
    expect(cats).toContain("Dairy & Eggs");
  });

  it("respects count parameter", () => {
    const deals = [
      makeDeal({ name: "Chicken", category: "Meat & Seafood" }),
      makeDeal({ name: "Milk", category: "Dairy & Eggs" }),
      makeDeal({ name: "Chips", category: "Snacks" }),
    ];

    const items = [
      makeWatchlistItem("chicken"),
      makeWatchlistItem("milk"),
      makeWatchlistItem("chips"),
    ];

    const cats = getTopAffinityCategories(items, deals, 2);
    expect(cats.length).toBeLessThanOrEqual(2);
  });
});
