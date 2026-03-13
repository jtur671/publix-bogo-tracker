import { test, expect } from "@playwright/test";
import {
  setupMockRoutes,
  dismissZipModal,
  signInTestUser,
} from "./helpers";

/**
 * Comprehensive tests for the coupon clip UX in the deal detail sheet.
 *
 * For coupon deals, two elements appear:
 *  1. A "Copy" button that copies the product name to clipboard
 *  2. An "Open Publix Digital Coupons" link to publix.com
 *
 * Neither should appear on bogo or sale deals.
 */

test.describe("Clip Coupon on Publix button", () => {
  test.beforeEach(async ({ page }) => {
    await setupMockRoutes(page);
    await signInTestUser(page);
    await dismissZipModal(page);
  });

  // ─── Coupon deals SHOW the buttons ──────────────────────────────────────

  test("should show copy button and Publix link on coupon deals", async ({
    page,
  }) => {
    await page.goto("/app");
    await page.waitForLoadState("networkidle");

    await page.getByText("Kellogg's Pop-Tarts").click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Copy button with product name
    const copyBtn = dialog.getByRole("button", { name: /Copy.*to search/ });
    await expect(copyBtn).toBeVisible();
    await expect(copyBtn).toContainText("Kellogg's Pop-Tarts");

    // Publix link
    const clipLink = dialog.getByRole("link", {
      name: "Open Publix Digital Coupons",
    });
    await expect(clipLink).toBeVisible();
  });

  test("should have correct href pointing to Publix digital coupons", async ({
    page,
  }) => {
    await page.goto("/app");
    await page.waitForLoadState("networkidle");

    await page.getByText("Kellogg's Pop-Tarts").click();

    const dialog = page.getByRole("dialog");
    const clipLink = dialog.getByRole("link", {
      name: "Open Publix Digital Coupons",
    });
    await expect(clipLink).toHaveAttribute(
      "href",
      "https://www.publix.com/savings/digital-coupons"
    );
  });

  test("should open in a new tab with noopener noreferrer", async ({
    page,
  }) => {
    await page.goto("/app");
    await page.waitForLoadState("networkidle");

    await page.getByText("Kellogg's Pop-Tarts").click();

    const dialog = page.getByRole("dialog");
    const clipLink = dialog.getByRole("link", {
      name: "Open Publix Digital Coupons",
    });
    await expect(clipLink).toHaveAttribute("target", "_blank");
    await expect(clipLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  test("should have purple background styling on the link", async ({
    page,
  }) => {
    await page.goto("/app");
    await page.waitForLoadState("networkidle");

    await page.getByText("Kellogg's Pop-Tarts").click();

    const dialog = page.getByRole("dialog");
    const clipLink = dialog.getByRole("link", {
      name: "Open Publix Digital Coupons",
    });
    await expect(clipLink).toBeVisible();
    await expect(clipLink).toHaveClass(/bg-purple-600/);
  });

  test("should show copied confirmation when copy button is clicked", async ({
    page,
    context,
  }) => {
    // Grant clipboard permission
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    await page.goto("/app");
    await page.waitForLoadState("networkidle");

    await page.getByText("Kellogg's Pop-Tarts").click();

    const dialog = page.getByRole("dialog");
    const copyBtn = dialog.getByRole("button", { name: /Copy.*to search/ });

    // Stub clipboard API so it resolves in the test environment
    await page.evaluate(() => {
      navigator.clipboard.writeText = async () => {};
    });

    await copyBtn.click();

    // Button text should change to "copied!"
    await expect(dialog.getByText("copied!")).toBeVisible();
  });

  test("coupon section should appear above the Add to Shopping List button", async ({
    page,
  }) => {
    await page.goto("/app");
    await page.waitForLoadState("networkidle");

    await page.getByText("Kellogg's Pop-Tarts").click();

    const dialog = page.getByRole("dialog");
    const clipLink = dialog.getByRole("link", {
      name: "Open Publix Digital Coupons",
    });
    const addButton = dialog.getByRole("button", {
      name: /Add to Shopping List/,
    });

    await addButton.scrollIntoViewIfNeeded();
    await expect(clipLink).toBeVisible();
    await expect(addButton).toBeVisible();

    const clipBox = await clipLink.boundingBox();
    const addBox = await addButton.boundingBox();
    expect(clipBox).not.toBeNull();
    expect(addBox).not.toBeNull();
    expect(clipBox!.y).toBeLessThan(addBox!.y);
  });

  // ─── BOGO deals do NOT show the buttons ─────────────────────────────────

  test("should NOT show clip coupon UI on BOGO deals", async ({ page }) => {
    await page.goto("/app");
    await page.waitForLoadState("networkidle");

    await page.getByText("Cheerios Cereal").click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: /Add to Shopping List/ })
    ).toBeVisible();

    const clipLink = dialog.getByRole("link", {
      name: "Open Publix Digital Coupons",
    });
    await expect(clipLink).toHaveCount(0);

    const copyBtn = dialog.getByRole("button", { name: /Copy.*to search/ });
    await expect(copyBtn).toHaveCount(0);
  });

  // ─── Sale deals do NOT show the buttons ─────────────────────────────────

  test("should NOT show clip coupon UI on sale deals", async ({ page }) => {
    await page.goto("/app");
    await page.waitForLoadState("networkidle");

    await page.getByText("Tide Laundry Detergent").click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: /Add to Shopping List/ })
    ).toBeVisible();

    const clipLink = dialog.getByRole("link", {
      name: "Open Publix Digital Coupons",
    });
    await expect(clipLink).toHaveCount(0);

    const copyBtn = dialog.getByRole("button", { name: /Copy.*to search/ });
    await expect(copyBtn).toHaveCount(0);
  });
});
