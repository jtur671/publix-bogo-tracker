import { test, expect } from "@playwright/test";
import { setupMockRoutes, dismissZipModal, clearLocalStorage } from "./helpers";

test.describe("Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await dismissZipModal(page);
    await setupMockRoutes(page);
  });

  test("should render all 5 bottom nav tabs", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const nav = page.locator("nav");
    await expect(nav).toBeVisible();

    await expect(nav.getByText("Home")).toBeVisible();
    await expect(nav.getByText("Deals")).toBeVisible();
    await expect(nav.getByText("Watchlist")).toBeVisible();
    await expect(nav.getByText("Alerts")).toBeVisible();
    await expect(nav.getByText("Settings")).toBeVisible();
  });

  test("should navigate to Deals page", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.locator("nav").getByText("Deals").click();
    await expect(page).toHaveURL("/deals");
    await expect(page.getByText("All Deals")).toBeVisible();
  });

  test("should navigate to Watchlist page", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.locator("nav").getByText("Watchlist").click();
    await expect(page).toHaveURL("/watchlist");
    await expect(page.getByRole("heading", { name: "Watchlist" })).toBeVisible();
  });

  test("should navigate to Alerts page", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.locator("nav").getByText("Alerts").click();
    await expect(page).toHaveURL("/alerts");
  });

  test("should navigate to Settings page", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.locator("nav").getByText("Settings").click();
    await expect(page).toHaveURL("/settings");
  });

  test("should navigate back to Home", async ({ page }) => {
    await page.goto("/deals");
    await page.waitForLoadState("networkidle");

    await page.locator("nav").getByText("Home").click();
    await expect(page).toHaveURL("/");
  });
});

test.describe("Zip Code Modal", () => {
  test("should show zip code modal on first visit when no zip is stored", async ({
    page,
  }) => {
    await clearLocalStorage(page);
    await setupMockRoutes(page);

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // The modal should appear with "Welcome!" text
    await expect(page.getByText("Welcome!")).toBeVisible();
    await expect(
      page.getByPlaceholder("Enter zip code (e.g. 34695)")
    ).toBeVisible();
  });

  test("should save zip code and dismiss modal", async ({ page }) => {
    await clearLocalStorage(page);
    await setupMockRoutes(page);

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Fill in zip code
    const input = page.getByPlaceholder("Enter zip code (e.g. 34695)");
    await input.fill("33101");
    await page.getByRole("button", { name: "Find Deals" }).click();

    // Modal should disappear
    await expect(page.getByText("Welcome!")).not.toBeVisible();
  });

  test("should show validation error for invalid zip code", async ({
    page,
  }) => {
    await clearLocalStorage(page);
    await setupMockRoutes(page);

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const input = page.getByPlaceholder("Enter zip code (e.g. 34695)");
    await input.fill("abc");
    await page.getByRole("button", { name: "Find Deals" }).click();

    await expect(
      page.getByText("Please enter a valid 5-digit zip code")
    ).toBeVisible();
  });
});
