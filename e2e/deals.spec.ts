import { test, expect } from "@playwright/test";
import { setupMockRoutes, dismissZipModal, MOCK_DEALS } from "./helpers";

test.describe("Deals Page", () => {
  test.beforeEach(async ({ page }) => {
    await dismissZipModal(page);
    await setupMockRoutes(page);
  });

  test("should display the deals page with header", async ({ page }) => {
    await page.goto("/deals");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("All Deals")).toBeVisible();
    await expect(
      page.getByText(`${MOCK_DEALS.length} BOGO deals`)
    ).toBeVisible();
  });

  test("should render deal cards in a grid", async ({ page }) => {
    await page.goto("/deals");
    await page.waitForLoadState("networkidle");

    // Wait for skeleton loaders to disappear and real cards to appear
    // Each deal card has a BOGO badge
    const bogoLabels = page.locator("text=BOGO").first();
    await expect(bogoLabels).toBeVisible({ timeout: 10000 });

    // Check that multiple deal card names are visible
    await expect(page.getByText("Cheerios Cereal")).toBeVisible();
    await expect(page.getByText("Lay's Potato Chips")).toBeVisible();
  });

  test("should search for a deal and filter results", async ({ page }) => {
    await page.goto("/deals");
    await page.waitForLoadState("networkidle");

    // Wait for deals to load
    await expect(page.getByText("Cheerios Cereal")).toBeVisible({
      timeout: 10000,
    });

    const searchInput = page.getByPlaceholder("Search deals...");
    await searchInput.fill("chicken");

    // Wait for debounce (250ms in SearchBar)
    await page.waitForTimeout(400);

    // Only chicken should be visible now
    await expect(page.getByText("Perdue Chicken Breast")).toBeVisible();
    // Other deals should be filtered out
    await expect(page.getByText("Cheerios Cereal")).not.toBeVisible();
  });

  test("should filter deals by category", async ({ page }) => {
    await page.goto("/deals");
    await page.waitForLoadState("networkidle");

    // Wait for deals to load
    await expect(page.getByText("Cheerios Cereal")).toBeVisible({
      timeout: 10000,
    });

    // Click the Snacks category filter
    const snacksFilter = page.getByRole("button", { name: /Snacks/ });
    await snacksFilter.click();

    // Only snack deals should remain visible
    await expect(page.getByText("Lay's Potato Chips")).toBeVisible();
    // Other categories should be hidden
    await expect(page.getByText("Cheerios Cereal")).not.toBeVisible();
  });

  test("should show 'All' filter to clear category selection", async ({
    page,
  }) => {
    await page.goto("/deals");
    await page.waitForLoadState("networkidle");

    // Wait for deals to load
    await expect(page.getByText("Cheerios Cereal")).toBeVisible({
      timeout: 10000,
    });

    // Select a category first
    const snacksFilter = page.getByRole("button", { name: /Snacks/ });
    await snacksFilter.click();

    // Verify filtered
    await expect(page.getByText("Cheerios Cereal")).not.toBeVisible();

    // Click "All" to reset
    const allFilter = page.getByRole("button", { name: /^All/ });
    await allFilter.click();

    // All deals should be visible again
    await expect(page.getByText("Cheerios Cereal")).toBeVisible();
    await expect(page.getByText("Lay's Potato Chips")).toBeVisible();
  });

  test("should open deal detail sheet when clicking a deal card", async ({
    page,
  }) => {
    await page.goto("/deals");
    await page.waitForLoadState("networkidle");

    // Wait for deals to load
    await expect(page.getByText("Cheerios Cereal")).toBeVisible({
      timeout: 10000,
    });

    // Click on the Cheerios deal card
    await page
      .getByRole("button", { name: /View details for Cheerios Cereal/ })
      .click();

    // The detail sheet should appear as a dialog
    const sheet = page.getByRole("dialog", {
      name: /Deal details for Cheerios Cereal/,
    });
    await expect(sheet).toBeVisible();

    // Should show product info
    await expect(sheet.getByText("Cheerios Cereal")).toBeVisible();
    await expect(sheet.getByText("Pantry")).toBeVisible();

    // Should have an action button
    await expect(
      sheet.getByRole("button", { name: /Add to Shopping List/ })
    ).toBeVisible();
  });

  test("should close deal detail sheet with close button", async ({
    page,
  }) => {
    await page.goto("/deals");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Cheerios Cereal")).toBeVisible({
      timeout: 10000,
    });

    // Open a deal
    await page
      .getByRole("button", { name: /View details for Cheerios Cereal/ })
      .click();

    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();

    // Close it
    await page.getByRole("button", { name: "Close deal details" }).click();

    // Sheet should animate away
    await expect(sheet).not.toBeVisible({ timeout: 2000 });
  });

  test("should show no deals found message when search has no results", async ({
    page,
  }) => {
    await page.goto("/deals");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Cheerios Cereal")).toBeVisible({
      timeout: 10000,
    });

    const searchInput = page.getByPlaceholder("Search deals...");
    await searchInput.fill("xyznonexistentproduct");

    await page.waitForTimeout(400);

    await expect(page.getByText("No deals found")).toBeVisible();
  });
});
