import type { Deal, DealType, FlippItem } from "@/types";
import { classifyDeal } from "./categories";

const FLIPP_BASE = "https://backflipp.wishabi.com/flipp/items/search";
const PUBLIX_MERCHANT_ID = 2361;

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function transformToDeal(item: FlippItem, dealType: DealType): Deal {
  const daysLeft = daysUntil(item.valid_to);
  return {
    id: item.id,
    name: item.name,
    description: item.description || "",
    imageUrl: item.clean_image_url || item.clipping_image_url || item.image_url || "",
    price: item.price,
    priceText: item.price_text || item.pre_price_text,
    saleStory: item.sale_story,
    validFrom: item.valid_from,
    validTo: item.valid_to,
    category: classifyDeal(item.name, item.description || ""),
    daysLeft,
    isExpiringSoon: daysLeft <= 2,
    merchantName: item.merchant_name,
    dealType,
  };
}

async function fetchDealsByQuery(
  zipCode: string,
  query: string,
  dealType: DealType
): Promise<Deal[]> {
  const url = `${FLIPP_BASE}?locale=en-us&postal_code=${encodeURIComponent(zipCode)}&q=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    next: { revalidate: 3600 },
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; BogoTracker/1.0)",
    },
  });

  if (!response.ok) {
    throw new Error(`Flipp API error: ${response.status}`);
  }

  const data = await response.json();
  const items: FlippItem[] = data.items || [];

  return items
    .filter((item) => item.merchant_id === PUBLIX_MERCHANT_ID)
    .map((item) => transformToDeal(item, dealType));
}

export async function fetchPublixDeals(zipCode: string): Promise<Deal[]> {
  const results = await Promise.allSettled([
    fetchDealsByQuery(zipCode, "bogo", "bogo"),
    fetchDealsByQuery(zipCode, "save", "sale"),
    fetchDealsByQuery(zipCode, "coupon", "coupon"),
  ]);

  const seen = new Set<number>();
  const deals: Deal[] = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      for (const deal of result.value) {
        if (!seen.has(deal.id)) {
          seen.add(deal.id);
          deals.push(deal);
        }
      }
    }
  }

  return deals.sort((a, b) => a.name.localeCompare(b.name));
}

export async function searchPublixProducts(zipCode: string, query: string): Promise<Deal[]> {
  const url = `${FLIPP_BASE}?locale=en-us&postal_code=${encodeURIComponent(zipCode)}&q=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    next: { revalidate: 3600 },
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; BogoTracker/1.0)",
    },
  });

  if (!response.ok) {
    throw new Error(`Flipp API error: ${response.status}`);
  }

  const data = await response.json();
  const items: FlippItem[] = data.items || [];

  return items
    .filter((item) => item.merchant_id === PUBLIX_MERCHANT_ID)
    .map((item) => transformToDeal(item, "bogo"))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function checkDealsForKeywords(
  zipCode: string,
  keywords: string[]
): Promise<Record<string, Deal[]>> {
  const deals = await fetchPublixDeals(zipCode);
  const matches: Record<string, Deal[]> = {};

  for (const keyword of keywords) {
    const lower = keyword.toLowerCase();
    const matched = deals.filter(
      (deal) =>
        deal.name.toLowerCase().includes(lower) ||
        deal.description.toLowerCase().includes(lower)
    );
    if (matched.length > 0) {
      matches[keyword] = matched;
    }
  }

  return matches;
}
