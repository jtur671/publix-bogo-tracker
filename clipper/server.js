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
  loadMoreButton: "button.p-button.button--secondary",
};

const TIMEOUT_MS = 300_000;

// ── Helpers ─────────────────────────────────────────────────────────

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
  const isDebug = process.env.DEBUG === "1";
  const browser = await puppeteer.launch({
    headless: !isDebug,
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

      // Poll until we leave account.publix.com or see a login error
      const loginDeadline = Date.now() + 20_000;
      while (Date.now() < loginDeadline) {
        await new Promise((r) => setTimeout(r, 2000));

        // Check for visible login error on the page
        const errorEl = await page.$(SELECTORS.loginError).catch(() => null);
        if (errorEl) {
          const errorInfo = await errorEl.evaluate((e) => {
            const style = window.getComputedStyle(e);
            return {
              text: e.textContent?.trim(),
              visible: style.display !== "none" && style.visibility !== "hidden" && e.offsetHeight > 0,
              html: e.innerHTML.substring(0, 200),
            };
          });
          if (errorInfo.visible && errorInfo.text) {
            return {
              success: false,
              clipped: 0,
              total: 0,
              error: `Login failed: ${errorInfo.text}`,
            };
          }
        }

        // Check if we've left the login page
        if (!page.url().includes("account.publix.com")) {
          break;
        }
      }

      // Navigate to coupons page
      await page.goto(
        "https://www.publix.com/savings/digital-coupons",
        { waitUntil: "domcontentloaded", timeout: 60_000 }
      );

      // Wait for coupon cards to render (JS-rendered after DOM load)
      try {
        await page.waitForSelector(SELECTORS.unclippedCoupon, { timeout: 15_000 });
      } catch {
        // Coupons may not have loaded — try a full page reload
        await page.reload({ waitUntil: "load", timeout: 60_000 });
        await page.waitForSelector(SELECTORS.unclippedCoupon, { timeout: 15_000 }).catch(() => {});
      }

      await randomDelay(1000, 2000);

      // Load all coupons by clicking "Load more" repeatedly
      let loadMoreAttempts = 0;
      while (loadMoreAttempts < 50) {
        // Find load-more button by selector or by text content
        let loadMoreBtn = await page.$(SELECTORS.loadMoreButton);
        if (!loadMoreBtn) {
          // Fall back to searching by text content
          loadMoreBtn = await page.evaluateHandle(() => {
            const els = Array.from(document.querySelectorAll('button, a'));
            return els.find(el => /load\s*more|show\s*more/i.test(el.textContent || '')) || null;
          });
          const isNull = await loadMoreBtn.evaluate(el => el === null);
          if (isNull) break;
        }

        const isVisible = await loadMoreBtn.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return style.display !== "none" && style.visibility !== "hidden";
        });
        if (!isVisible) break;

        // Count coupons before clicking
        const countBefore = await page.$$eval(
          SELECTORS.unclippedCoupon,
          (els) => els.length
        );
        // Scroll into view and click
        await loadMoreBtn.evaluate((el) =>
          el.scrollIntoView({ behavior: "instant", block: "center" })
        );
        await randomDelay(300, 600);
        await loadMoreBtn.click();

        // Wait for new coupons to appear (up to 10s)
        try {
          await page.waitForFunction(
            (sel, prev) => document.querySelectorAll(sel).length > prev,
            { timeout: 10_000 },
            SELECTORS.unclippedCoupon,
            countBefore
          );
        } catch {
          break;
        }
        await randomDelay(500, 1000);
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
