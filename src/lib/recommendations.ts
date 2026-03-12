import type { Deal, WatchlistItem } from "@/types";
import { CATEGORIES } from "@/lib/categories";

/**
 * Recommendation engine for BOGO deals.
 *
 * Strategy:
 * 1. Build a "category affinity" profile from the user's watchlist keywords.
 *    Each watchlist keyword maps to the category of the deals it matches.
 * 2. Score every non-watchlisted deal by:
 *    a) Category affinity (deals in categories the user buys from)
 *    b) Urgency bonus (expiring soon items get a small boost)
 * 3. Return the top N recommendations, ensuring category diversity
 *    so the user doesn't see 12 items from the same aisle.
 */

interface ScoredDeal {
  deal: Deal;
  score: number;
}

/**
 * Build a map of category -> affinity score based on watchlist keywords.
 * Categories that match more watchlist keywords get a higher score.
 */
function buildCategoryAffinity(
  watchlistItems: WatchlistItem[],
  allDeals: Deal[]
): Map<string, number> {
  const affinity = new Map<string, number>();

  for (const item of watchlistItems) {
    const kw = item.keyword.toLowerCase();

    // Find deals that match this keyword to determine its category
    const matchingDeals = allDeals.filter(
      (d) =>
        d.name.toLowerCase().includes(kw) ||
        d.description.toLowerCase().includes(kw)
    );

    // Count category occurrences for this keyword
    for (const deal of matchingDeals) {
      const current = affinity.get(deal.category) || 0;
      affinity.set(deal.category, current + 1);
    }

    // Also check if the keyword itself maps to a known category
    // (even if no current deals match, we know the user's intent)
    for (const cat of CATEGORIES) {
      if (cat.name === "Other") continue;
      if (cat.keywords.some((catKw) => kw.includes(catKw) || catKw.includes(kw))) {
        const current = affinity.get(cat.name) || 0;
        affinity.set(cat.name, current + 0.5);
      }
    }
  }

  return affinity;
}

/**
 * Check if a deal is matched by any watchlist keyword.
 */
function isDealWatchlisted(deal: Deal, watchlistItems: WatchlistItem[]): boolean {
  return watchlistItems.some((item) => {
    const kw = item.keyword.toLowerCase();
    return (
      deal.name.toLowerCase().includes(kw) ||
      deal.description.toLowerCase().includes(kw)
    );
  });
}

/**
 * Get recommended deals for the user based on their watchlist.
 *
 * @param watchlistItems - The user's watchlist keywords
 * @param allDeals - All current BOGO deals
 * @param count - Number of recommendations to return (default 12)
 * @returns Array of recommended deals, sorted by relevance
 */
export function getRecommendations(
  watchlistItems: WatchlistItem[],
  allDeals: Deal[],
  count: number = 12
): Deal[] {
  if (watchlistItems.length === 0 || allDeals.length === 0) {
    return [];
  }

  const affinity = buildCategoryAffinity(watchlistItems, allDeals);

  // If no affinity could be determined (keywords don't match any deals or categories),
  // return a diverse mix of popular-looking deals
  if (affinity.size === 0) {
    return allDeals
      .filter((d) => !isDealWatchlisted(d, watchlistItems))
      .slice(0, count);
  }

  // Normalize affinity scores to 0-1 range
  const maxAffinity = Math.max(...affinity.values());

  // Score all non-watchlisted deals
  const scored: ScoredDeal[] = allDeals
    .filter((d) => !isDealWatchlisted(d, watchlistItems))
    .map((deal) => {
      let score = 0;

      // Category affinity: 0 to 1.0
      const catScore = affinity.get(deal.category) || 0;
      score += (catScore / maxAffinity) * 1.0;

      // Urgency bonus: expiring soon items get a small boost (0 to 0.2)
      if (deal.isExpiringSoon) {
        score += 0.2;
      }

      // Slight randomization to keep results fresh (0 to 0.1)
      score += Math.random() * 0.1;

      return { deal, score };
    });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Enforce category diversity: no more than 4 items from one category in results
  const maxPerCategory = 4;
  const categoryCounts = new Map<string, number>();
  const results: Deal[] = [];

  for (const { deal } of scored) {
    if (results.length >= count) break;

    const catCount = categoryCounts.get(deal.category) || 0;
    if (catCount >= maxPerCategory) continue;

    results.push(deal);
    categoryCounts.set(deal.category, catCount + 1);
  }

  // If we still need more (all categories capped), fill from remaining
  if (results.length < count) {
    const resultIds = new Set(results.map((d) => d.id));
    for (const { deal } of scored) {
      if (results.length >= count) break;
      if (!resultIds.has(deal.id)) {
        results.push(deal);
      }
    }
  }

  return results;
}

/**
 * Get the top affinity categories for display purposes.
 * Useful for showing "Based on your interest in Meat & Seafood, Dairy..."
 */
export function getTopAffinityCategories(
  watchlistItems: WatchlistItem[],
  allDeals: Deal[],
  count: number = 3
): string[] {
  const affinity = buildCategoryAffinity(watchlistItems, allDeals);
  return [...affinity.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([cat]) => cat);
}
