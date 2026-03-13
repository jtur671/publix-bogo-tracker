"use client";

import { useMemo } from "react";
import { useDealsContext } from "@/context/deals-context";
import { useStoreConfig } from "@/hooks/use-store-config";
import { useWatchlist } from "@/hooks/use-watchlist";
import { DashboardHeader } from "@/components/dashboard-header";
import { SectionHeader } from "@/components/section-header";
import { ShoppingList } from "@/components/shopping-list";
import { DealCard } from "@/components/deal-card";
import { DealDetailSheet } from "@/components/deal-detail-sheet";
import { EmptyWatchlistPrompt } from "@/components/empty-watchlist-prompt";
import { BottomNav } from "@/components/bottom-nav";
import { ZipCodeModal } from "@/components/zip-code-modal";
import { InstallPrompt } from "@/components/install-prompt";
import { getRecommendations, getTopAffinityCategories } from "@/lib/recommendations";
import { ShoppingBag, Sparkles, Tag } from "lucide-react";
import Link from "next/link";
import type { Deal } from "@/types";
import { useState } from "react";

export default function HomePage() {
  const { zipCode, needsSetup, updateZip } = useStoreConfig();
  const { deals, loading, error } = useDealsContext();
  const {
    items: watchlist,
    checkedItems,
    addKeyword,
    removeKeyword,
    toggleChecked,
    clearChecked,
    isWatched,
  } = useWatchlist();

  const [showZipModal, setShowZipModal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  // Count how many watchlist items currently match a BOGO deal
  const watchlistMatchCount = useMemo(() => {
    if (watchlist.length === 0 || deals.length === 0) return 0;
    return watchlist.filter((item) => {
      const kw = item.keyword.toLowerCase();
      return deals.some(
        (d) =>
          d.name.toLowerCase().includes(kw) ||
          d.description.toLowerCase().includes(kw)
      );
    }).length;
  }, [watchlist, deals]);

  // Watchlist deals for the bottom nav badge
  const watchlistDeals = useMemo(() => {
    if (watchlist.length === 0) return [];
    return deals.filter((d) => isWatched(d));
  }, [deals, watchlist, isWatched]);

  // Section 2: Recommendations based on watchlist
  const recommendations = useMemo(() => {
    return getRecommendations(watchlist, deals, 12);
  }, [watchlist, deals]);

  const topCategories = useMemo(() => {
    return getTopAffinityCategories(watchlist, deals, 3);
  }, [watchlist, deals]);

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
      const words = deal.name.split(/[,\-\u2013]/)[0].trim();
      addKeyword(words);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <DashboardHeader
        zipCode={zipCode}
        dealCount={deals.length}
        watchlistMatchCount={watchlistMatchCount}
        watchlistTotal={watchlist.length}
        validFrom={validFrom}
        validTo={validTo}
        onChangeZip={() => setShowZipModal(true)}
      />

      <main className="max-w-4xl mx-auto px-3 py-4 space-y-6">
        <InstallPrompt />

        {error && (
          <div className="bg-red-50 text-danger text-sm p-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Section 1: Shopping List */}
        <section aria-label="Shopping list">
          <SectionHeader
            title="Shopping List"
            subtitle={
              watchlist.length > 0
                ? `${watchlistMatchCount} of ${watchlist.length} items on BOGO`
                : "Add items you buy regularly"
            }
            icon={<ShoppingBag size={16} className="text-publix-green" />}
            action={
              watchlist.length > 0
                ? { label: "Watchlist", href: "/watchlist" }
                : undefined
            }
          />

          <div className="mt-3">
            {watchlist.length === 0 && !loading ? (
              <div className="space-y-3">
                {/* Still show the add input even when empty */}
                <ShoppingList
                  items={[]}
                  deals={deals}
                  checkedItems={checkedItems}
                  loading={false}
                  onAddItem={addKeyword}
                  onRemoveItem={removeKeyword}
                  onToggleChecked={toggleChecked}
                  onClearChecked={clearChecked}
                  zipCode={zipCode}
                  isWatched={isWatched}
                />
                <EmptyWatchlistPrompt />
              </div>
            ) : (
              <ShoppingList
                items={watchlist}
                deals={deals}
                checkedItems={checkedItems}
                loading={loading}
                onAddItem={addKeyword}
                onRemoveItem={removeKeyword}
                onToggleChecked={toggleChecked}
                onClearChecked={clearChecked}
                zipCode={zipCode}
                isWatched={isWatched}
              />
            )}
          </div>
        </section>

        {/* Section 2: You Might Also Like */}
        {watchlist.length > 0 && !loading && (
          <section aria-label="Recommended deals">
            <SectionHeader
              title="You Might Also Like"
              subtitle={
                topCategories.length > 0
                  ? `Based on your interest in ${topCategories.join(", ")}`
                  : "Deals we think you will enjoy"
              }
              icon={<Sparkles size={16} className="text-publix-green" />}
              action={{ label: "All deals", href: "/deals" }}
            />

            <div className="mt-3">
              {recommendations.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {recommendations.map((deal) => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      isWatched={false}
                      onToggleWatch={() => handleToggleWatch(deal)}
                      onTap={() => setSelectedDeal(deal)}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-border p-6 text-center">
                  <p className="text-sm text-muted">
                    Add more items to your list to get personalized
                    recommendations.
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Browse All CTA for new users without a list */}
        {watchlist.length === 0 && !loading && deals.length > 0 && (
          <section aria-label="Browse deals">
            <SectionHeader
              title="This Week's Deals"
              subtitle={`${deals.length} BOGO deals available`}
              icon={<Tag size={16} className="text-publix-green" />}
              action={{ label: "See all", href: "/deals" }}
            />

            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {deals.slice(0, 8).map((deal) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  isWatched={isWatched(deal)}
                  onToggleWatch={() => handleToggleWatch(deal)}
                  onTap={() => setSelectedDeal(deal)}
                />
              ))}
            </div>

            <div className="mt-4 text-center">
              <Link
                href="/deals"
                className="inline-flex items-center gap-2 bg-publix-green text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-publix-green-dark transition-colors"
              >
                <Tag size={16} />
                Browse all {deals.length} deals
              </Link>
            </div>
          </section>
        )}
      </main>

      <BottomNav watchlistMatchCount={watchlistDeals.length} />

      <ZipCodeModal
        open={needsSetup || showZipModal}
        currentZip={zipCode}
        isFirstRun={needsSetup}
        onSave={(zip) => {
          updateZip(zip);
          setShowZipModal(false);
        }}
        onClose={() => setShowZipModal(false)}
      />

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
