import express from "express";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

const app = express();
app.use(express.json());

const API_KEY = process.env.CLIPPER_API_KEY;
const PORT = process.env.PORT || 10000;

// ── Selectors (verify against live site) ────────────────────────────

const SELECTORS = {
  loginLink: "#userLogIn",
  emailField: "#signInName",
  passwordField: "#password",
  submitButton: "#next",
  loginError: ".error.pageLevel, .error.itemLevel",
  unclippedCoupon: '.p-coupon-button',
  loadMoreButton: ".button-container button",
};

const ALLOWED_DOMAINS = [
  "publix.com",
  "account.publix.com",
  "cutpcdnwimages.azureedge.net",
  "cutpstorb2c.blob.core.windows.net",
  "b2clogin.com",
  "publixcdn.com",
  "d19hn3jcfcdeky.cloudfront.net",
];

const TIMEOUT_MS = 120_000;

// ── Helpers ─────────────────────────────────────────────────────────

function isDomainAllowed(url) {
  try {
    const hostname = new URL(url).hostname;
    return ALLOWED_DOMAINS.some((d) => hostname.endsWith(d));
  } catch {
    return false;
  }
}

function randomDelay(min = 500, max = 1500) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((r) => setTimeout(r, ms));
}

// ── Auth middleware ─────────────────────────────────────────────────

function authenticate(req, res, next) {
  if (!API_KEY) {
    return res.status(500).json({ error: "CLIPPER_API_KEY not configured" });
  }
  const provided = req.headers["x-api-key"];
  if (provided !== API_KEY) {
    return res.status(401).json({ error: "Invalid API key" });
  }
  next();
}

// ── Clip logic ──────────────────────────────────────────────────────

async function clipAllCoupons(email, password) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled",
      "--disable-infobars",
      "--window-size=1280,800",
    ],
  });

  let timeoutId;
  try {
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
    await page.setViewport({ width: 1280, height: 800 });

    // Block only heavy resources to speed up navigation
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const type = req.resourceType();
      if (type === "image" || type === "media" || type === "font") {
        req.abort();
      } else {
        req.continue();
      }
    });

    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error("Operation timed out after 2 minutes")),
        TIMEOUT_MS
      );
    });

    const clipPromise = (async () => {
      // Navigate directly to login with redirect back to coupons
      await page.goto(
        "https://www.publix.com/login?redirectUrl=/savings/digital-coupons",
        { waitUntil: "domcontentloaded", timeout: 60_000 }
      );

      // Wait for login form (hosted on account.publix.com)
      try {
        await page.waitForSelector(SELECTORS.emailField, { timeout: 30_000 });
      } catch {
        return {
          success: false,
          clipped: 0,
          total: 0,
          error:
            "Could not find login form. Publix may have updated their website.",
        };
      }

      // Fill credentials
      await randomDelay(300, 800);
      await page.type(SELECTORS.emailField, email, { delay: 50 });
      await randomDelay(200, 500);
      await page.type(SELECTORS.passwordField, password, { delay: 50 });
      await randomDelay(300, 800);

      await page.click(SELECTORS.submitButton);

      // Wait for redirect back to publix.com or login error
      try {
        await Promise.race([
          page.waitForNavigation({
            waitUntil: "domcontentloaded",
            timeout: 60_000,
          }),
          page
            .waitForSelector(SELECTORS.loginError, { visible: true, timeout: 10_000 })
            .then(async (el) => {
              const text = await el?.evaluate((e) => e.textContent?.trim());
              throw new Error(text || "Login failed");
            }),
        ]);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Login failed";
        if (msg.includes("Login failed") || msg.includes("password") || msg.includes("incorrect")) {
          return {
            success: false,
            clipped: 0,
            total: 0,
            error: `Login failed: ${msg}`,
          };
        }
      }

      // Ensure we're on the coupons page
      if (!page.url().includes("digital-coupons")) {
        await page.goto(
          "https://www.publix.com/savings/digital-coupons",
          { waitUntil: "domcontentloaded", timeout: 60_000 }
        );
      }

      await randomDelay(1000, 2000);

      // Load all coupons by clicking "Load more" repeatedly
      let loadMoreAttempts = 0;
      while (loadMoreAttempts < 50) {
        const loadMoreBtn = await page.$(SELECTORS.loadMoreButton);
        if (!loadMoreBtn) break;

        const isVisible = await loadMoreBtn.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return style.display !== "none" && style.visibility !== "hidden";
        });
        if (!isVisible) break;

        await loadMoreBtn.click();
        await randomDelay(800, 1500);
        loadMoreAttempts++;
      }

      // Find all coupon buttons and separate clipped from unclipped
      const allCouponButtons = await page.$$(SELECTORS.unclippedCoupon);
      const unclipped = [];
      let alreadyClippedCount = 0;

      for (const btn of allCouponButtons) {
        const text = await btn.evaluate((e) => e.textContent?.trim());
        if (text === "Clip coupon") {
          unclipped.push(btn);
        } else {
          alreadyClippedCount++;
        }
      }

      const total = unclipped.length + alreadyClippedCount;

      if (unclipped.length === 0) {
        return {
          success: true,
          clipped: 0,
          total,
          error: total > 0 ? undefined : "No coupons found on the page.",
        };
      }

      // Click each unclipped coupon
      let clipped = 0;
      for (const btn of unclipped) {
        try {
          await btn.click();
          await randomDelay(500, 1200);
          clipped++;
        } catch {
          // Button may have become stale
        }
      }

      return { success: true, clipped, total };
    })();

    return await Promise.race([clipPromise, timeoutPromise]);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, clipped: 0, total: 0, error: message };
  } finally {
    clearTimeout(timeoutId);
    await browser.close();
  }
}

// ── Routes ──────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/clip", authenticate, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ error: "Email and password are required" });
  }

  const result = await clipAllCoupons(email, password);

  if (!result.success) {
    return res
      .status(422)
      .json({ error: result.error || "Failed to clip coupons" });
  }

  res.json({ clipped: result.clipped, total: result.total });
});

// ── Start ───────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Clipper service listening on port ${PORT}`);
});
