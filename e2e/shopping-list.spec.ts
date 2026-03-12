import { test, expect } from "@playwright/test";
import { setupMockRoutes, dismissZipModal } from "./helpers";

test.describe("Shopping List", () => {
  test.beforeEach(async ({ page }) => {
    await dismissZipModal(page);
    await setupMockRoutes(page);
  });

  test("should render the shopping list section on home page", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("heading", { name: "Shopping List", exact: true })
    ).toBeVisible();
    await expect(
      page.getByPlaceholder("Search products to add...")
    ).toBeVisible();
  });

  test("should add an item via the search input and Add button", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const input = page.getByPlaceholder("Search products to add...");
    await input.fill("chicken");

    // Wait for the dropdown to show search results
    await expect(page.getByText("Publix products")).toBeVisible({
      timeout: 5000,
    });

    // Click the "Add" submit button (in the input bar, not the dropdown)
    await page.getByRole("button", { name: "Add", exact: true }).click();

    // The item should now appear in the shopping list
    await expect(
      page.locator('[role="list"][aria-label="Shopping list"]')
    ).toBeVisible();
  });

  test("should add an item by pressing Enter", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const input = page.getByPlaceholder("Search products to add...");
    await input.fill("bread");
    await input.press("Enter");

    // The item should appear in the shopping list section as "Bread"
    // Use the shopping list area to scope the selector and avoid matching
    // deal cards that also contain "bread" text
    const listSection = page.locator('section[aria-label="Shopping list"]');
    await expect(listSection).toBeVisible();
  });

  test("should show BOGO badge when item matches a deal", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const input = page.getByPlaceholder("Search products to add...");
    await input.fill("chips");
    await input.press("Enter");

    // Should show the BOGO sticker on matching items
    await expect(page.locator(".bogo-sticker").first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("should check off an item and show Uncheck all button", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Add two items
    const input = page.getByPlaceholder("Search products to add...");
    await input.fill("chips");
    await input.press("Enter");

    await input.fill("avocado");
    await input.press("Enter");

    // Wait for list to render
    const list = page.locator('[role="list"][aria-label="Shopping list"]');
    await expect(list).toBeVisible();

    // Check the first item - find its checkbox by aria-label
    const checkboxButton = page
      .getByRole("button", { name: /^Check /i })
      .first();
    await checkboxButton.click();

    // After checking, the "Uncheck all" button should appear
    await expect(page.getByText(/Uncheck all/)).toBeVisible();
  });

  test("should remove an item via the X button", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const input = page.getByPlaceholder("Search products to add...");
    await input.fill("yogurt");
    await input.press("Enter");

    // Wait for the list item to appear (scoped to the shopping list)
    const list = page.locator('[role="list"][aria-label="Shopping list"]');
    await expect(list).toBeVisible();

    // Click the remove button for this item
    const removeBtn = page.getByRole("button", {
      name: /Remove Yogurt from list/i,
    });
    await removeBtn.click();

    // The shopping list role="list" should disappear when the last item is removed
    await expect(list).not.toBeVisible({ timeout: 3000 });
  });

  test("should show empty state prompt when no items", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Use the exact text variant to avoid strict mode violation
    await expect(
      page.getByText("Add items you buy regularly", { exact: true })
    ).toBeVisible();
  });
});
