import { test, expect, devices } from "@playwright/test";
import { setupMockRoutes, dismissZipModal, MOCK_DEALS } from "./helpers";

// ---------------------------------------------------------------------------
// Helper: seed watchlist in localStorage so the trip can start with items
// ---------------------------------------------------------------------------
async function seedWatchlist(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    const items = [
      {
        id: "wl-1",
        keyword: "cheerios",
        added_at: new Date().toISOString(),
        last_matched_deal_id: null,
        last_notified_at: null,
      },
      {
        id: "wl-2",
        keyword: "chips",
        added_at: new Date().toISOString(),
        last_matched_deal_id: null,
        last_notified_at: null,
      },
      {
        id: "wl-3",
        keyword: "milk",
        added_at: new Date().toISOString(),
        last_matched_deal_id: null,
        last_notified_at: null,
      },
    ];
    localStorage.setItem("bogo-watchlist", JSON.stringify(items));
  });
}

// ---------------------------------------------------------------------------
// Mobile tests (390x844 — iPhone 14 / similar)
// ---------------------------------------------------------------------------

test.describe("Shopping Mode — mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await setupMockRoutes(page);
    await dismissZipModal(page);
    await seedWatchlist(page);
  });

  test("shows Start Shopping button when no active trip", async ({ page }) => {
    await page.goto("/shop");
    await expect(page.getByTestId("start-trip")).toBeVisible();
    await expect(page.getByText("Ready to Shop?")).toBeVisible();
  });

  test("starts a trip and shows items with big text", async ({ page }) => {
    await page.goto("/shop");
    await page.getByTestId("start-trip").click();

    // Should show Shopping Mode header
    await expect(page.getByText("Shopping Mode")).toBeVisible();
    // Should show item count
    await expect(page.getByTestId("item-count")).toHaveText("0 of 3");

    // Items should be visible
    await expect(page.getByText("cheerios")).toBeVisible();
    await expect(page.getByText("chips")).toBeVisible();
    await expect(page.getByText("milk")).toBeVisible();
  });

  test("checks off items with strikethrough and moves to bought section", async ({
    page,
  }) => {
    await page.goto("/shop");
    await page.getByTestId("start-trip").click();

    // Tap the "cheerios" row
    await page.getByText("cheerios").click();

    // Should now show "1 of 3"
    await expect(page.getByTestId("item-count")).toHaveText("1 of 3");

    // Should show Bought section
    await expect(page.getByTestId("bought-divider")).toContainText("Bought (1)");

    // The checked item should have strikethrough class
    const strikeEl = page.locator(".shop-strike");
    await expect(strikeEl).toBeVisible();
  });

  test("shows BOGO badge on matching items", async ({ page }) => {
    await page.goto("/shop");
    await page.getByTestId("start-trip").click();

    // "cheerios" matches "Cheerios Cereal BOGO" and "chips" matches "Lay's Potato Chips BOGO"
    const bogoPills = page.locator(
      '[role="listitem"] >> text=BOGO'
    );
    // At least cheerios and chips should have BOGO badge
    await expect(bogoPills.first()).toBeVisible();
  });

  test("adds item via quick-add input", async ({ page }) => {
    await page.goto("/shop");
    await page.getByTestId("start-trip").click();

    const input = page.getByPlaceholder("Add an item...");
    await input.fill("bananas");
    await input.press("Enter");

    // New item should appear
    await expect(page.getByText("bananas")).toBeVisible();
    // Count should update
    await expect(page.getByTestId("item-count")).toHaveText("0 of 4");
  });

  test("Done button ends trip and navigates away", async ({ page }) => {
    await page.goto("/shop");
    await page.getByTestId("start-trip").click();

    await page.getByTestId("done-button").click();

    // Should navigate to home
    await page.waitForURL("/");
  });
});

// ---------------------------------------------------------------------------
// Desktop tests — mobile gate
// ---------------------------------------------------------------------------

test.describe("Shopping Mode — desktop", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test.beforeEach(async ({ page }) => {
    await setupMockRoutes(page);
    await dismissZipModal(page);
  });

  test("shows desktop gate message", async ({ page }) => {
    await page.goto("/shop");
    await expect(page.getByTestId("desktop-gate")).toBeVisible();
    await expect(page.getByText("Open on your phone")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Bottom nav — Shop tab
// ---------------------------------------------------------------------------

test.describe("Bottom nav — Shop tab", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await setupMockRoutes(page);
    await dismissZipModal(page);
  });

  test("Shop tab is visible and links to /shop", async ({ page }) => {
    await page.goto("/");
    // Wait for page to load
    const shopLink = page.locator('a[href="/shop"]');
    await expect(shopLink).toBeVisible();
    await expect(shopLink.locator("text=Shop")).toBeVisible();
    await shopLink.click();

    await page.waitForURL("/shop");
  });
});
