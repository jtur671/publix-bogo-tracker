"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useDealsContext } from "@/context/deals-context";
import { useStoreConfig } from "@/hooks/use-store-config";
import { useWatchlist } from "@/hooks/use-watchlist";
import { useShoppingTrip } from "@/hooks/use-shopping-trips";
import { ShopMode } from "@/components/shop-mode";
import { BottomNav } from "@/components/bottom-nav";
import { ZipCodeModal } from "@/components/zip-code-modal";
import { itemMatchesDeal } from "@/lib/deal-type";
import type { ShoppingTripItem } from "@/types";

export default function HomePage() {
  const router = useRouter();
  const { zipCode, needsSetup, updateZip } = useStoreConfig();
  const { deals } = useDealsContext();
  const {
    items: watchlist,
    checkedItems,
    addKeyword,
    removeKeyword,
    toggleChecked,
    clearChecked,
  } = useWatchlist();
  const { saveTripFromItems } = useShoppingTrip(deals);

  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  // Viewport detection
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // Desktop → redirect to /deals
  useEffect(() => {
    if (isMobile === false) {
      router.replace("/deals");
    }
  }, [isMobile, router]);

  // Convert watchlist → ShoppingTripItem[] for ShopMode
  const tripItems: ShoppingTripItem[] = useMemo(() => {
    return watchlist.map((wi) => ({
      id: wi.id,
      name: wi.keyword,
      checked: checkedItems.has(wi.id),
      checked_at: null,
      has_bogo: deals.some((d) => itemMatchesDeal(wi.keyword, d)),
      added_at: wi.added_at,
    }));
  }, [watchlist, checkedItems, deals]);

  // Handle "Done" in ShopMode — save trip and clear checks
  const handleDone = () => {
    saveTripFromItems(tripItems);
    clearChecked();
  };

  // Still determining viewport or desktop (will redirect)
  if (isMobile === null || isMobile === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-3 border-gray-200 border-t-publix-green rounded-full animate-spin" />
      </div>
    );
  }

  // Count deals matching list items for badge
  const listDealCount = useMemo(() => {
    if (watchlist.length === 0 || deals.length === 0) return 0;
    return watchlist.filter((item) =>
      deals.some((d) => itemMatchesDeal(item.keyword, d))
    ).length;
  }, [watchlist, deals]);

  // ─── MOBILE: ShopMode as primary view ──────────────────────────
  return (
    <div className="pb-16">
      <ShopMode
        items={tripItems}
        deals={deals}
        zipCode={zipCode}
        onToggleItem={toggleChecked}
        onAddItem={addKeyword}
        onRemoveItem={(id: string) => {
          removeKeyword(id);
        }}
        onDone={handleDone}
      />
      <BottomNav listMatchCount={listDealCount} />
      <ZipCodeModal
        open={needsSetup}
        currentZip={zipCode}
        isFirstRun={needsSetup}
        onSave={(zip) => {
          updateZip(zip);
        }}
        onClose={() => {}}
      />
    </div>
  );
}
