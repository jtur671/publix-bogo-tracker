import type { DealType } from "@/types";

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
