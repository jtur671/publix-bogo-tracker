# Bug Reports — Publix BOGO Tracker

Generated 2026-03-13 via Playwright automated testing.

---

## BUG-001: Deal card names display raw "BOGO*" suffix

**Severity:** Medium
**Page:** Home (`/app`), Deals (`/deals`)
**Steps to reproduce:**
1. Navigate to `/deals` or scroll to "You Might Also Like" on `/app`
2. Observe deal card titles

**Expected:** Card titles show clean names like "6-Pack Elysian Brewing Beer"
**Actual:** Card titles show raw API names like "6-Pack Elysian Brewing Beer BOGO*"

**Root cause:** `deal-card.tsx` renders `deal.name` directly in the `<h3>` without calling `cleanDealSuffix()`. The detail sheet already uses `cleanDealSuffix()` correctly but the card does not.

**Fix:** In `src/components/deal-card.tsx`, import `cleanDealSuffix` and apply it to `deal.name` in the heading.

---

## BUG-002: Shopping list match count mismatch between header and list

**Severity:** Medium
**Page:** Home (`/app`)
**Steps to reproduce:**
1. Log in with watchlist items "beer" and "rice"
2. Observe header shows "2 of 2 items on sale"
3. Observe shopping list divider shows "1 ON SALE"

**Expected:** Both counts should agree.
**Actual:** Header says 2 matches, list says 1 match.

**Root cause:** Two different matching algorithms:
- Header (`app/page.tsx` line ~43): uses `d.name.toLowerCase().includes(kw)` — "rice" matches "Vigo Saffron Yellow Rice"
- Shopping list (`shopping-list.tsx` `findMatchingDeals`): uses `nameEndsWith()` — "rice" does NOT match because it requires the deal name to end with the keyword

**Fix:** Align both to use the same matching logic (probably `nameEndsWith` since it's more precise).

---

## BUG-003: Landing page CTA buttons link to "/" instead of "/app"

**Severity:** High
**Page:** Landing page (`/`)
**Steps to reproduce:**
1. Scroll to mid-page "Open the app" CTA (line 585)
2. Scroll to bottom "Start saving now" CTA (line 661)
3. Click either — they navigate to `/` (the landing page itself)

**Expected:** Both should navigate to `/app`
**Actual:** Both have `href="/"`— user clicks CTA and stays on the same page.

**Fix:** Change `href="/"` to `href="/app"` on lines 585 and 661 of `src/app/page.tsx`.

---

## BUG-004: Testimonial shows raw HTML entity `didn&#39;t`

**Severity:** Low
**Page:** Landing page (`/`), testimonials section
**Steps to reproduce:**
1. Scroll to "Real savings from real shoppers" section
2. Read third testimonial (Ashley K.)

**Expected:** "My husband didn't believe me..."
**Actual:** "My husband didn&#39;t believe me..."

**Root cause:** Line 526 of `src/app/page.tsx` contains the literal string `didn&#39;t` inside a JS string. HTML entities aren't decoded inside JSX text content rendered from JS strings.

**Fix:** Replace `didn&#39;t` with `didn&apos;t` or just `didn't` on line 526.

---

## BUG-005: Landing page copy still references only "BOGO" after multi-deal-type update

**Severity:** Low
**Page:** Landing page (`/`)
**Locations:**
- Hero: "Publix runs 100+ BOGO deals every week" (now ~200 deals across 3 types)
- Stats: "BOGO deals tracked weekly" (should say "deals tracked weekly")
- Step 1 mockup: "3 of 5 items on BOGO"
- Step 2 heading: "Get matched to BOGO deals"
- Step 2 mockup: all badges say "BOGO", all say "Buy 1 Get 1 Free"
- Step 2 bullet: "Browse 100+ deals you might have missed"
- Features: "Live BOGO tracking"
- FAQ: "new BOGO promotions"

**Expected:** Copy should reflect that the app now tracks BOGO deals, sales, and manufacturer coupons (~200 total).
**Actual:** Landing page only mentions BOGO.

**Fix:** Update marketing copy throughout `src/app/page.tsx` to mention all deal types.

---

## BUG-006: Zip code modal says "Enter your zip to find BOGO deals"

**Severity:** Low
**Page:** Home (`/app`) — zip code setup modal
**Steps to reproduce:**
1. Clear data or use a fresh account
2. Navigate to `/app`
3. Observe the welcome modal text

**Expected:** "Enter your zip to find deals"
**Actual:** "Enter your zip to find BOGO deals"

**Fix:** Update the `ZipCodeModal` component copy.

---

## Summary

| ID | Title | Severity | Page |
|----|-------|----------|------|
| BUG-001 | Deal card names show "BOGO*" suffix | Medium | Deals, Home |
| BUG-002 | Match count mismatch header vs list | Medium | Home |
| BUG-003 | Landing CTAs link to "/" not "/app" | High | Landing |
| BUG-004 | Testimonial HTML entity `didn&#39;t` | Low | Landing |
| BUG-005 | Landing page copy is BOGO-only | Low | Landing |
| BUG-006 | Zip modal says "BOGO deals" | Low | Home |
