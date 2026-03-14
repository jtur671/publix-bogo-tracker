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
  signInButton: "a.sign-in-button",
  emailField: "#signInName",
  passwordField: "#password",
  submitButton: "#next",
  loginError: ".error.itemLevel",
  instructionalModal: ".modal.instructional",
  modalDismiss: "button.cta-link",
  unclippedCoupon:
    ".savings-container .card.savings .buttons-area button:not(.clipped)",
  clippedCoupon:
    ".savings-container .card.savings .buttons-area button.clipped",
  loadMoreButton: "div.card-loader button",
};

const ALLOWED_DOMAINS = [
  "publix.com",
  "cutpcdnwimages.azureedge.net",
  "cutpstorb2c.blob.core.windows.net",
  "b2clogin.com",
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

    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const type = req.resourceType();
      if (type === "image" || type === "media" || type === "font") {
        req.abort();
        return;
      }
      if (isDomainAllowed(req.url())) {
        req.continue();
      } else {
        req.abort();
      }
    });

    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error("Operation timed out after 2 minutes")),
        TIMEOUT_MS
      );
    });

    const clipPromise = (async () => {
      await page.goto(
        "https://www.publix.com/savings/digital-coupons?sort=Newest",
        { waitUntil: "networkidle2", timeout: 30_000 }
      );

      // Dismiss instructional modal if present
      try {
        await page.waitForSelector(SELECTORS.instructionalModal, {
          timeout: 3000,
        });
        const dismissBtn = await page.$(SELECTORS.modalDismiss);
        if (dismissBtn) await dismissBtn.click();
        await randomDelay();
      } catch {
        // No modal
      }

      // Click sign-in
      const signInBtn = await page.$(SELECTORS.signInButton);
      if (!signInBtn) {
        return {
          success: false,
          clipped: 0,
          total: 0,
          error:
            "Could not find sign-in button. Publix may have updated their website.",
        };
      }
      await signInBtn.click();

      // Wait for login form
      try {
        await page.waitForSelector(SELECTORS.emailField, { timeout: 15_000 });
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

      // Wait for redirect or login error
      try {
        await Promise.race([
          page.waitForNavigation({
            waitUntil: "networkidle2",
            timeout: 20_000,
          }),
          page
            .waitForSelector(SELECTORS.loginError, { timeout: 10_000 })
            .then(async (el) => {
              const text = await el?.evaluate((e) => e.textContent);
              throw new Error(text || "Login failed");
            }),
        ]);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Login failed";
        if (msg.includes("Login failed") || msg.includes("password")) {
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
          "https://www.publix.com/savings/digital-coupons?sort=Newest",
          { waitUntil: "networkidle2", timeout: 30_000 }
        );
      }

      await randomDelay(1000, 2000);

      // Load all coupons
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

      // Count and clip
      const unclippedButtons = await page.$$(SELECTORS.unclippedCoupon);
      const alreadyClipped = await page.$$(SELECTORS.clippedCoupon);
      const total = unclippedButtons.length + alreadyClipped.length;

      if (unclippedButtons.length === 0) {
        return {
          success: true,
          clipped: 0,
          total,
          error: total > 0 ? undefined : "No coupons found on the page.",
        };
      }

      let clipped = 0;
      for (const btn of unclippedButtons) {
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
