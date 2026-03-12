import { Page } from "@playwright/test";

/**
 * Shared test fixtures and helpers for E2E tests.
 *
 * The app fetches deals from /api/deals which proxies to the Flipp API.
 * We intercept both the internal API route and the external Flipp endpoint
 * to provide deterministic test data.
 */

export interface MockDeal {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  price: string | null;
  priceText: string | null;
  saleStory: string | null;
  validFrom: string;
  validTo: string;
  category: string;
  daysLeft: number;
  isExpiringSoon: boolean;
  merchantName: string;
}

export const MOCK_DEALS: MockDeal[] = [
  {
    id: 1001,
    name: "Cheerios Cereal BOGO",
    description: "Buy one get one free",
    imageUrl: "",
    price: "$4.99",
    priceText: "$4.99",
    saleStory: "BOGO",
    validFrom: "2026-03-10",
    validTo: "2026-03-17",
    category: "Pantry",
    daysLeft: 5,
    isExpiringSoon: false,
    merchantName: "Publix",
  },
  {
    id: 1002,
    name: "Lay's Potato Chips BOGO",
    description: "Buy one get one free",
    imageUrl: "",
    price: "$5.49",
    priceText: "$5.49",
    saleStory: "BOGO",
    validFrom: "2026-03-10",
    validTo: "2026-03-17",
    category: "Snacks",
    daysLeft: 5,
    isExpiringSoon: false,
    merchantName: "Publix",
  },
  {
    id: 1003,
    name: "Chobani Greek Yogurt BOGO",
    description: "Buy one get one free",
    imageUrl: "",
    price: "$6.99",
    priceText: "$6.99",
    saleStory: "BOGO",
    validFrom: "2026-03-10",
    validTo: "2026-03-17",
    category: "Dairy & Eggs",
    daysLeft: 5,
    isExpiringSoon: false,
    merchantName: "Publix",
  },
  {
    id: 1004,
    name: "Sara Lee Butter Bread BOGO",
    description: "Buy one get one free",
    imageUrl: "",
    price: "$4.29",
    priceText: "$4.29",
    saleStory: "BOGO",
    validFrom: "2026-03-10",
    validTo: "2026-03-17",
    category: "Bakery & Bread",
    daysLeft: 5,
    isExpiringSoon: false,
    merchantName: "Publix",
  },
  {
    id: 1005,
    name: "Perdue Chicken Breast BOGO",
    description: "Buy one get one free",
    imageUrl: "",
    price: "$8.99",
    priceText: "$8.99",
    saleStory: "BOGO",
    validFrom: "2026-03-10",
    validTo: "2026-03-17",
    category: "Meat & Seafood",
    daysLeft: 5,
    isExpiringSoon: false,
    merchantName: "Publix",
  },
  {
    id: 1006,
    name: "Coca-Cola 12 Pack BOGO",
    description: "Buy one get one free",
    imageUrl: "",
    price: "$7.99",
    priceText: "$7.99",
    saleStory: "BOGO",
    validFrom: "2026-03-10",
    validTo: "2026-03-17",
    category: "Beverages",
    daysLeft: 5,
    isExpiringSoon: false,
    merchantName: "Publix",
  },
];

/**
 * Intercept the /api/deals and /api/search routes to return predictable mock data,
 * and set localStorage so the zip code modal does not appear.
 */
export async function setupMockRoutes(page: Page) {
  // Mock /api/deals
  await page.route("**/api/deals**", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        deals: MOCK_DEALS,
        count: MOCK_DEALS.length,
        zip: "34695",
      }),
    });
  });

  // Mock /api/search to return filtered mock deals
  await page.route("**/api/search**", (route) => {
    const url = new URL(route.request().url());
    const q = (url.searchParams.get("q") || "").toLowerCase();
    const results = MOCK_DEALS.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q)
    );
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ results, count: results.length }),
    });
  });

  // Block external Flipp API calls
  await page.route("**/backflipp.wishabi.com/**", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ items: [] }),
    });
  });
}

/**
 * Set up localStorage so the app doesn't show the first-run zip code modal.
 */
export async function dismissZipModal(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("bogo-zip-code", "34695");
  });
}

/**
 * Clear localStorage between tests for isolation.
 */
export async function clearLocalStorage(page: Page) {
  await page.addInitScript(() => {
    localStorage.clear();
  });
}
