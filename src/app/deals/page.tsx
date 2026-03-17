"use client";

import { useState, useMemo } from "react";
import { useDealsContext } from "@/context/deals-context";
import { useStoreConfig } from "@/hooks/use-store-config";
import { useWatchlist } from "@/hooks/use-watchlist";
import { SearchBar } from "@/components/search-bar";
import { CategoryFilter } from "@/components/category-filter";
import { DealGrid } from "@/components/deal-grid";
import { DealDetailSheet } from "@/components/deal-detail-sheet";
import { BottomNav } from "@/components/bottom-nav";
import { AdSlot } from "@/components/ad-slot";
import type { Deal, DealType } from "@/types";

export default function DealsPage() {
  const { zipCode } = useStoreConfig();
  const { deals, loading, error } = useDealsContext();
  const { items: watchlist, addKeyword, removeKeyword, isWatched } = useWatchlist();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  const filteredDeals = useMemo(() => {
    let result = deals;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          d.saleStory?.toLowerCase().includes(q)
      );
    }
    if (category) {
      result = result.filter((d) => d.category === category);
    }
    return result;
  }, [deals, search, category]);

  const watchlistMatchCount = useMemo(() => {
    return deals.filter((d) => isWatched(d)).length;
  }, [deals, isWatched]);

  const dealCounts = useMemo(() => {
    const counts: Record<DealType, number> = { bogo: 0, sale: 0, coupon: 0 };
    for (const d of deals) {
      counts[d.dealType]++;
    }
    return counts;
  }, [deals]);

  const validFrom = deals[0]?.validFrom;
  const validTo = deals[0]?.validTo;

  const handleToggleWatch = (deal: Deal) => {
    const existing = watchlist.find((item) => {
      const kw = item.keyword.toLowerCase();
      return (
        deal.name.toLowerCase().includes(kw) ||
        deal.description.toLowerCase().includes(kw)
      );
    });

    if (existing) {
      removeKeyword(existing.id);
    } else {
      const words = deal.name.split(/[,\-–]/)[0].trim();
      addKeyword(words);
    }
  };

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  const dateRange =
    validFrom && validTo
      ? `${formatDate(validFrom)} - ${formatDate(validTo)}`
      : "";

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-publix-green text-white px-4 py-3 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-lg font-bold tracking-tight">All Deals</h1>
          <p className="text-green-100 text-xs">
            {deals.length} deals{" "}
            {deals.length > 0 && (
              <>
                ({dealCounts.bogo} BOGO
                {dealCounts.sale > 0 && ` · ${dealCounts.sale} Sale`}
                {dealCounts.coupon > 0 && ` · ${dealCounts.coupon} Coupon`})
              </>
            )}
            {dateRange && ` · ${dateRange}`}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 py-3 space-y-3">
        <SearchBar value={search} onChange={setSearch} />
        <CategoryFilter
          selected={category}
          onChange={setCategory}
          deals={deals}
        />

        {error && (
          <div className="bg-red-50 text-danger text-sm p-3 rounded-xl">
            {error}
          </div>
        )}

        <DealGrid
          deals={filteredDeals}
          loading={loading}
          isWatched={isWatched}
          onToggleWatch={handleToggleWatch}
          onTapDeal={setSelectedDeal}
        />

        <AdSlot slot="XXXXXXXXXX" format="horizontal" dismissible />
      </div>

      <BottomNav listMatchCount={watchlistMatchCount} />

      <DealDetailSheet
        deal={selectedDeal}
        isWatched={selectedDeal ? isWatched(selectedDeal) : false}
        onToggleWatch={() => {
          if (selectedDeal) handleToggleWatch(selectedDeal);
        }}
        onClose={() => setSelectedDeal(null)}
      />
    </div>
  );
}
