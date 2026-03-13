import { test, expect } from "@playwright/test";
import {
  setupMockRoutes,
  dismissZipModal,
  clearLocalStorage,
  signInTestUser,
  MOCK_DEALS,
} from "./helpers";

/**
 * Regression tests for bugs BUG-001 through BUG-007.
 * Each test prevents a specific bug from reappearing.
 */

test.describe("Bug Regressions", () => {
  // ─── BUG-001: Deal card names should be clean (no BOGO*/SALE* suffix) ───
  test("BUG-001 — deal card names are clean (no deal-type suffix)", async ({
    page,
  }) => {
    await dismissZipModal(page);
    await setupMockRoutes(page);

    await page.goto("/app");
    await page.waitForLoadState("networkidle");

    // Wait for deal cards to render in "This Week's Deals" grid
    const cards = page.locator("h3");
    await expect(cards.first()).toBeVisible();

    // Every visible card heading must NOT contain a trailing BOGO/SALE/COUPON suffix
    const headings = await cards.allTextContents();
    for (const text of headings) {
      expect(text).not.toMatch(/\b(BOGO|SALE|COUPON)\*?\s*$/i);
    }

    // Positive check: a known deal should show its clean name
    await expect(page.getByText("Cheerios Cereal", { exact: false })).toBeVisible();
  });

  // ─── BUG-002: Header match count equals list match count ───
  test("BUG-002 — header match count equals list match count", async ({
    page,
  }) => {
    // Seed watchlist with an item that matches a mock deal via nameEndsWith
    await page.addInitScript(() => {
      localStorage.setItem("bogo-zip-code", "34695");
      localStorage.setItem(
        "bogo-watchlist",
        JSON.stringify([
          {
            id: "test-chips",
            keyword: "Potato Chips",
            added_at: new Date().toISOString(),
            last_matched_deal_id: null,
            last_notified_at: null,
          },
          {
            id: "test-yogurt",
            keyword: "Greek Yogurt",
            added_at: new Date().toISOString(),
            last_matched_deal_id: null,
            last_notified_at: null,
          },
          {
            id: "test-pizza",
            keyword: "Pizza",
            added_at: new Date().toISOString(),
            last_matched_deal_id: null,
            last_notified_at: null,
          },
        ])
      );
    });
    await setupMockRoutes(page);

    await page.goto("/app");
    await page.waitForLoadState("networkidle");

    // Header shows "X of Y items on sale" in the section subtitle
    const sectionSubtitle = page.getByText(/\d+ of \d+ items on sale/);
    await expect(sectionSubtitle).toBeVisible();
    const subtitleText = await sectionSubtitle.textContent();
    const headerMatch = subtitleText!.match(/(\d+) of (\d+)/);
    const headerCount = parseInt(headerMatch![1], 10);

    // Count items with "on sale" badges in the shopping list
    const onSaleDividers = page.getByText(/\d+ on sale/);
    const dividerTexts = await onSaleDividers.allTextContents();
    let listCount = 0;
    for (const text of dividerTexts) {
      const m = text.match(/(\d+) on sale/);
      if (m) listCount += parseInt(m[1], 10);
    }

    expect(headerCount).toBe(listCount);
  });

  // ─── BUG-003: Landing page CTAs navigate to /app ───
  test("BUG-003 — landing page CTAs navigate to /app", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Mid-page CTA "Open the app"
    const openAppLink = page.getByRole("link", { name: "Open the app" }).first();
    await expect(openAppLink).toHaveAttribute("href", "/app");

    // Final CTA "Start saving now" (the bottom one)
    const startSavingLinks = page.getByRole("link", { name: "Start saving now" });
    const count = await startSavingLinks.count();
    for (let i = 0; i < count; i++) {
      await expect(startSavingLinks.nth(i)).toHaveAttribute("href", "/app");
    }
  });

  // ─── BUG-004: Testimonial renders clean apostrophe ───
  test("BUG-004 — testimonial renders clean apostrophe", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // The testimonial should contain a real apostrophe, not an HTML entity
    const testimonial = page.getByText("didn't", { exact: false });
    await expect(testimonial.first()).toBeVisible();

    // Must NOT render the raw entity
    const bodyText = await page.locator("body").textContent();
    expect(bodyText).not.toContain("didn&#39;t");
  });

  // ─── BUG-005: Landing page mentions multiple deal types ───
  test("BUG-005 — landing page mentions multiple deal types", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const bodyText = await page.locator("body").textContent();

    // Should NOT say "100+ BOGO deals" (outdated copy)
    expect(bodyText).not.toContain("100+ BOGO deals");

    // Should mention sales/coupons alongside BOGO
    expect(bodyText).toContain("BOGOs, sales, and coupons");
  });

  // ─── BUG-006: Zip modal says "deals" not "BOGO deals" ───
  test("BUG-006 — zip modal says 'deals' not 'BOGO deals'", async ({
    page,
  }) => {
    await clearLocalStorage(page);
    await setupMockRoutes(page);

    await page.goto("/app");
    await page.waitForLoadState("networkidle");

    // Modal should be visible (first run, no zip)
    await expect(page.getByText("Welcome!")).toBeVisible();

    // Should say "find deals" not "find BOGO deals"
    const modalText = await page.locator(".fixed").textContent();
    expect(modalText).toContain("find deals");
    expect(modalText).not.toContain("find BOGO deals");
  });

  // ─── BUG-007: Search input z-index doesn't overlap header on scroll ───
  test("BUG-007 — search wrapper has z-0 when dropdown is closed", async ({
    page,
  }) => {
    // Seed watchlist so shopping list with search input renders
    await page.addInitScript(() => {
      localStorage.setItem("bogo-zip-code", "34695");
      localStorage.setItem(
        "bogo-watchlist",
        JSON.stringify([
          {
            id: "test-item",
            keyword: "Milk",
            added_at: new Date().toISOString(),
            last_matched_deal_id: null,
            last_notified_at: null,
          },
        ])
      );
    });
    await setupMockRoutes(page);

    await page.goto("/app");
    await page.waitForLoadState("networkidle");

    // The search wrapper (the one with z-0/z-50 toggle) should have z-0 by default
    const searchWrapper = page.locator(".z-0").first();
    await expect(searchWrapper).toBeVisible();

    // Verify there is no element with z-50 class from the search area
    // (z-50 should only appear when dropdown is open)
    const searchSection = page.locator('[aria-label="Shopping list"]');
    const z50InSearch = searchSection.locator(".z-50");
    await expect(z50InSearch).toHaveCount(0);
  });

  // ─── BUG-008: Clip Coupon UI appears only on coupon deals ───
  test("BUG-008 — clip coupon UI visible on coupon deals, hidden on BOGO deals", async ({
    page,
  }) => {
    await setupMockRoutes(page);
    await signInTestUser(page);
    await dismissZipModal(page);

    await page.goto("/app");
    await page.waitForLoadState("networkidle");

    // Open a coupon deal (Kellogg's Pop-Tarts, id 1008)
    await page.getByText("Kellogg's Pop-Tarts").click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // The copy button and Publix link should be visible
    const copyBtn = dialog.getByRole("button", { name: /Copy.*to search/ });
    await expect(copyBtn).toBeVisible();
    const clipLink = dialog.getByRole("link", { name: "Open Publix Digital Coupons" });
    await expect(clipLink).toBeVisible();
    await expect(clipLink).toHaveAttribute("href", "https://www.publix.com/savings/digital-coupons");
    await expect(clipLink).toHaveAttribute("target", "_blank");

    // Close the detail sheet
    await dialog.getByRole("button", { name: "Close deal details" }).click();
    await expect(dialog).not.toBeVisible();

    // Open a BOGO deal (Cheerios Cereal, id 1001)
    await page.getByText("Cheerios Cereal").click();

    const bogoDialog = page.getByRole("dialog");
    await expect(bogoDialog).toBeVisible();

    // Neither clip coupon element should be present
    const bogoClipLink = bogoDialog.getByRole("link", { name: "Open Publix Digital Coupons" });
    await expect(bogoClipLink).toHaveCount(0);
    const bogoCopyBtn = bogoDialog.getByRole("button", { name: /Copy.*to search/ });
    await expect(bogoCopyBtn).toHaveCount(0);
  });
});
