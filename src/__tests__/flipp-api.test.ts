import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchPublixDeals, searchPublixProducts } from "@/lib/flipp-api";
import type { FlippItem } from "@/types";

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

function makeFlippItem(overrides: Partial<FlippItem> = {}): FlippItem {
  return {
    id: 1,
    name: "Test Product BOGO",
    description: "Buy one get one free",
    price: "$4.99",
    pre_price_text: null,
    price_text: "$4.99",
    sale_story: "BOGO",
    image_url: null,
    clean_image_url: "https://f.wishabi.net/test.jpg",
    clipping_image_url: null,
    valid_from: "2026-03-10",
    valid_to: "2026-03-17",
    merchant_name: "Publix",
    merchant_id: 2361,
    flyer_id: 100,
    flyer_item_id: 200,
    category_names: ["Grocery"],
    ...overrides,
  };
}

describe("fetchPublixDeals", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("transforms Flipp items into Deal objects", async () => {
    const item = makeFlippItem({ name: "Cheerios Cereal BOGO" });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ items: [item] }),
    });

    const deals = await fetchPublixDeals("34695");

    expect(deals).toHaveLength(1);
    expect(deals[0]).toMatchObject({
      id: 1,
      name: "Cheerios Cereal BOGO",
      description: "Buy one get one free",
      imageUrl: "https://f.wishabi.net/test.jpg",
      price: "$4.99",
      priceText: "$4.99",
      saleStory: "BOGO",
      merchantName: "Publix",
      category: "Pantry", // cereal is Pantry
    });
  });

  it("filters out non-Publix merchants", async () => {
    const publixItem = makeFlippItem({ id: 1, merchant_id: 2361 });
    const otherItem = makeFlippItem({ id: 2, merchant_id: 9999, merchant_name: "Kroger" });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ items: [publixItem, otherItem] }),
    });

    const deals = await fetchPublixDeals("34695");
    expect(deals).toHaveLength(1);
    expect(deals[0].merchantName).toBe("Publix");
  });

  it("sorts deals alphabetically by name", async () => {
    const items = [
      makeFlippItem({ id: 1, name: "Zebra Cakes" }),
      makeFlippItem({ id: 2, name: "Apple Juice" }),
      makeFlippItem({ id: 3, name: "Milk" }),
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ items }),
    });

    const deals = await fetchPublixDeals("34695");
    expect(deals.map((d) => d.name)).toEqual(["Apple Juice", "Milk", "Zebra Cakes"]);
  });

  it("prefers clean_image_url over other image fields", async () => {
    const item = makeFlippItem({
      image_url: "https://fallback.com/img.jpg",
      clean_image_url: "https://preferred.com/clean.jpg",
      clipping_image_url: "https://clip.com/clip.jpg",
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ items: [item] }),
    });

    const deals = await fetchPublixDeals("34695");
    expect(deals[0].imageUrl).toBe("https://preferred.com/clean.jpg");
  });

  it("falls back through image fields when clean_image_url is null", async () => {
    const item = makeFlippItem({
      image_url: "https://fallback.com/img.jpg",
      clean_image_url: null,
      clipping_image_url: "https://clip.com/clip.jpg",
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ items: [item] }),
    });

    const deals = await fetchPublixDeals("34695");
    expect(deals[0].imageUrl).toBe("https://clip.com/clip.jpg");
  });

  it("throws on non-OK response", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    await expect(fetchPublixDeals("34695")).rejects.toThrow("Flipp API error: 500");
  });

  it("handles empty items array", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ items: [] }),
    });

    const deals = await fetchPublixDeals("34695");
    expect(deals).toHaveLength(0);
  });

  it("calculates daysLeft and isExpiringSoon", async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const items = [
      makeFlippItem({
        id: 1,
        name: "Expiring Soon Item",
        valid_to: tomorrow.toISOString().split("T")[0],
      }),
      makeFlippItem({
        id: 2,
        name: "Not Expiring Item",
        valid_to: nextWeek.toISOString().split("T")[0],
      }),
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ items }),
    });

    const deals = await fetchPublixDeals("34695");
    const expiring = deals.find((d) => d.name === "Expiring Soon Item");
    const notExpiring = deals.find((d) => d.name === "Not Expiring Item");

    expect(expiring?.isExpiringSoon).toBe(true);
    expect(expiring?.daysLeft).toBeLessThanOrEqual(2);
    expect(notExpiring?.isExpiringSoon).toBe(false);
  });
});

describe("searchPublixProducts", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("searches and filters by Publix merchant", async () => {
    const items = [
      makeFlippItem({ id: 1, name: "Publix Bread", merchant_id: 2361 }),
      makeFlippItem({ id: 2, name: "Kroger Bread", merchant_id: 9999 }),
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ items }),
    });

    const results = await searchPublixProducts("34695", "bread");
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Publix Bread");
  });

  it("encodes the search query in URL", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ items: [] }),
    });

    await searchPublixProducts("34695", "ice cream");

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("q=ice%20cream"),
      expect.any(Object)
    );
  });
});
