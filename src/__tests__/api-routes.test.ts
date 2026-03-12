import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock the Flipp API module so we never hit the real network in tests.
// ---------------------------------------------------------------------------
const mockFetchPublixDeals = vi.fn();
const mockSearchPublixProducts = vi.fn();
const mockCheckDealsForKeywords = vi.fn();

vi.mock("@/lib/flipp-api", () => ({
  fetchPublixDeals: (...args: unknown[]) => mockFetchPublixDeals(...args),
  searchPublixProducts: (...args: unknown[]) => mockSearchPublixProducts(...args),
  checkDealsForKeywords: (...args: unknown[]) => mockCheckDealsForKeywords(...args),
}));

// ---------------------------------------------------------------------------
// NextRequest uses `.nextUrl.searchParams` — standard `Request` doesn't have
// `.nextUrl`. We create a lightweight shim that the route handlers can consume.
// ---------------------------------------------------------------------------

function makeNextRequest(url: string, init?: RequestInit) {
  const parsed = new URL(url);
  const req = new Request(url, init);
  // Attach nextUrl so route handlers can access searchParams
  (req as any).nextUrl = parsed;
  return req;
}

function makeDeal(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
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
// /api/deals
// ---------------------------------------------------------------------------

describe("/api/deals route", () => {
  beforeEach(() => {
    mockFetchPublixDeals.mockReset();
  });

  it("should return deals for a valid zip code", async () => {
    const deals = [makeDeal({ id: 1, name: "Cheerios BOGO" })];
    mockFetchPublixDeals.mockResolvedValueOnce(deals);

    const { GET } = await import("@/app/api/deals/route");
    const req = makeNextRequest("http://localhost:3000/api/deals?zip=34695");
    const response = await GET(req as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.deals).toHaveLength(1);
    expect(body.count).toBe(1);
    expect(body.zip).toBe("34695");
  });

  it("should use default zip when none provided", async () => {
    const deals = [makeDeal()];
    mockFetchPublixDeals.mockResolvedValueOnce(deals);

    const { GET } = await import("@/app/api/deals/route");
    const req = makeNextRequest("http://localhost:3000/api/deals");
    const response = await GET(req as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.zip).toBe("34695");
    expect(mockFetchPublixDeals).toHaveBeenCalledWith("34695");
  });

  it("should return 400 for invalid zip code (letters)", async () => {
    const { GET } = await import("@/app/api/deals/route");
    const req = makeNextRequest("http://localhost:3000/api/deals?zip=abcde");
    const response = await GET(req as any);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid zip code");
  });

  it("should return 400 for too-short zip code", async () => {
    const { GET } = await import("@/app/api/deals/route");
    const req = makeNextRequest("http://localhost:3000/api/deals?zip=123");
    const response = await GET(req as any);

    expect(response.status).toBe(400);
  });

  it("should return 400 for too-long zip code", async () => {
    const { GET } = await import("@/app/api/deals/route");
    const req = makeNextRequest("http://localhost:3000/api/deals?zip=123456");
    const response = await GET(req as any);

    expect(response.status).toBe(400);
  });

  it("should return 500 when Flipp API throws", async () => {
    mockFetchPublixDeals.mockRejectedValueOnce(new Error("Network failure"));

    const { GET } = await import("@/app/api/deals/route");
    const req = makeNextRequest("http://localhost:3000/api/deals?zip=34695");
    const response = await GET(req as any);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Failed to fetch deals");
  });
});

// ---------------------------------------------------------------------------
// /api/search
// ---------------------------------------------------------------------------

describe("/api/search route", () => {
  beforeEach(() => {
    mockSearchPublixProducts.mockReset();
  });

  it("should return search results for valid query", async () => {
    const results = [makeDeal({ id: 1, name: "Sara Lee Bread" })];
    mockSearchPublixProducts.mockResolvedValueOnce(results);

    const { GET } = await import("@/app/api/search/route");
    const req = makeNextRequest(
      "http://localhost:3000/api/search?q=bread&zip=34695"
    );
    const response = await GET(req as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.results).toHaveLength(1);
    expect(body.count).toBe(1);
  });

  it("should return empty results for empty query", async () => {
    const { GET } = await import("@/app/api/search/route");
    const req = makeNextRequest(
      "http://localhost:3000/api/search?q=&zip=34695"
    );
    const response = await GET(req as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.results).toEqual([]);
  });

  it("should return empty results for query shorter than 2 characters", async () => {
    const { GET } = await import("@/app/api/search/route");
    const req = makeNextRequest(
      "http://localhost:3000/api/search?q=a&zip=34695"
    );
    const response = await GET(req as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.results).toEqual([]);
  });

  it("should return 400 for invalid zip code", async () => {
    const { GET } = await import("@/app/api/search/route");
    const req = makeNextRequest(
      "http://localhost:3000/api/search?q=bread&zip=abc"
    );
    const response = await GET(req as any);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid zip code");
  });

  it("should return 500 when search API throws", async () => {
    mockSearchPublixProducts.mockRejectedValueOnce(new Error("API error"));

    const { GET } = await import("@/app/api/search/route");
    const req = makeNextRequest(
      "http://localhost:3000/api/search?q=bread&zip=34695"
    );
    const response = await GET(req as any);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Search failed");
  });

  it("should use default zip when none provided", async () => {
    const results = [makeDeal({ id: 1, name: "Bread" })];
    mockSearchPublixProducts.mockResolvedValueOnce(results);

    const { GET } = await import("@/app/api/search/route");
    const req = makeNextRequest(
      "http://localhost:3000/api/search?q=bread"
    );
    const response = await GET(req as any);

    expect(response.status).toBe(200);
    expect(mockSearchPublixProducts).toHaveBeenCalledWith("34695", "bread");
  });
});

// ---------------------------------------------------------------------------
// /api/check-deals
// ---------------------------------------------------------------------------

describe("/api/check-deals route", () => {
  beforeEach(() => {
    mockCheckDealsForKeywords.mockReset();
  });

  it("should return matching deals for keywords", async () => {
    const matches = {
      chicken: [makeDeal({ id: 1, name: "Chicken Breast BOGO" })],
    };
    mockCheckDealsForKeywords.mockResolvedValueOnce(matches);

    const { POST } = await import("@/app/api/check-deals/route");
    const req = makeNextRequest("http://localhost:3000/api/check-deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords: ["chicken"], zip: "34695" }),
    });
    const response = await POST(req as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.matches.chicken).toHaveLength(1);
    expect(body.totalMatches).toBe(1);
  });

  it("should return 400 when keywords are missing", async () => {
    const { POST } = await import("@/app/api/check-deals/route");
    const req = makeNextRequest("http://localhost:3000/api/check-deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zip: "34695" }),
    });
    const response = await POST(req as any);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("keywords and zip are required");
  });

  it("should return 400 when zip is missing", async () => {
    const { POST } = await import("@/app/api/check-deals/route");
    const req = makeNextRequest("http://localhost:3000/api/check-deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords: ["chicken"] }),
    });
    const response = await POST(req as any);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("keywords and zip are required");
  });

  it("should return 400 when keywords array is empty", async () => {
    const { POST } = await import("@/app/api/check-deals/route");
    const req = makeNextRequest("http://localhost:3000/api/check-deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords: [], zip: "34695" }),
    });
    const response = await POST(req as any);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("keywords and zip are required");
  });

  it("should return 500 when the API throws", async () => {
    mockCheckDealsForKeywords.mockRejectedValueOnce(
      new Error("Network failure")
    );

    const { POST } = await import("@/app/api/check-deals/route");
    const req = makeNextRequest("http://localhost:3000/api/check-deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords: ["chicken"], zip: "34695" }),
    });
    const response = await POST(req as any);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Failed to check deals");
  });

  it("should count total matches across all keywords", async () => {
    const matches = {
      chicken: [makeDeal({ id: 1, name: "Chicken BOGO" })],
      bread: [
        makeDeal({ id: 2, name: "Sara Lee Bread" }),
        makeDeal({ id: 3, name: "Nature's Own Bread" }),
      ],
    };
    mockCheckDealsForKeywords.mockResolvedValueOnce(matches);

    const { POST } = await import("@/app/api/check-deals/route");
    const req = makeNextRequest("http://localhost:3000/api/check-deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords: ["chicken", "bread"], zip: "34695" }),
    });
    const response = await POST(req as any);
    const body = await response.json();

    expect(body.totalMatches).toBe(3);
  });
});
