import type { Deal, DealType } from "@/types";

export const DEAL_TYPE_CONFIG: Record<
  DealType,
  { label: string; bg: string; shadow: string; textColor: string }
> = {
  bogo: {
    label: "BOGO",
    bg: "bg-publix-green",
    shadow: "shadow-[0_2px_8px_-2px_rgba(46,125,22,0.5)]",
    textColor: "text-publix-green",
  },
  sale: {
    label: "SALE",
    bg: "bg-amber-500",
    shadow: "shadow-[0_2px_8px_-2px_rgba(245,158,11,0.5)]",
    textColor: "text-amber-600",
  },
  coupon: {
    label: "COUPON",
    bg: "bg-purple-600",
    shadow: "shadow-[0_2px_8px_-2px_rgba(147,51,234,0.5)]",
    textColor: "text-purple-600",
  },
};

/**
 * Strip trailing deal-type suffixes (BOGO*, SALE*, etc.) from product names.
 */
export function cleanDealSuffix(name: string): string {
  return name
    .replace(/\s*(?:BOGO|SALE|COUPON)\*?\s*$/i, "")
    .trim();
}

/**
 * Keyword alias groups — every keyword in a group surfaces the same deals.
 * Values are normalized (lowercase, no apostrophes/®/™).
 */
const KEYWORD_ALIASES: string[][] = [
  ["boars head", "ham", "turkey", "deli meat", "deli cheese", "deli ham"],
];

/** Normalize for matching: strip suffixes, lowercase, remove ®™©' */
function normalizeForMatch(s: string): string {
  return cleanDealSuffix(s).toLowerCase().replace(/[®™©']/g, "");
}

/** Expand a keyword into all keywords to try (itself + aliases). */
export function expandKeywords(name: string): string[] {
  const kw = normalizeForMatch(name);
  if (!kw) return [];
  const result = [kw];
  for (const group of KEYWORD_ALIASES) {
    if (group.includes(kw)) {
      for (const alias of group) {
        if (alias !== kw) result.push(alias);
      }
      break;
    }
  }
  return result;
}

/** Check if a deal name matches any of the given normalized keywords. */
export function dealNameMatchesAny(dealName: string, keywords: string[]): boolean {
  const clean = normalizeForMatch(dealName);
  return keywords.some(kw =>
    clean === kw || clean.endsWith(` ${kw}`) || clean.startsWith(`${kw} `)
  );
}

export function itemMatchesDeal(name: string, deal: Deal): boolean {
  return dealNameMatchesAny(deal.name, expandKeywords(name));
}
