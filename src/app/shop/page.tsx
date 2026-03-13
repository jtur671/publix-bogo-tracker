"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShopMode } from "@/components/shop-mode";
import { useShoppingTrip } from "@/hooks/use-shopping-trips";
import { useWatchlist } from "@/hooks/use-watchlist";
import { useDealsContext } from "@/context/deals-context";
import { ShoppingCart } from "lucide-react";
import { AdSlot } from "@/components/ad-slot";
import { BottomNav } from "@/components/bottom-nav";
import { cleanDealSuffix } from "@/lib/deal-type";

export default function ShopPage() {
  const router = useRouter();
  const { deals, zipCode } = useDealsContext();
  const { items: watchlistItems, loading: watchlistLoading, addKeyword, removeKeyword } = useWatchlist();
  const { trip, loaded, startTrip, addItem, toggleItem, removeItem, endTrip } =
    useShoppingTrip(deals);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // Still determining viewport or loading trip
  if (isMobile === null || !loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-3 border-gray-200 border-t-publix-green rounded-full animate-spin" />
      </div>
    );
  }

  // Desktop gate
  if (!isMobile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8 pb-20" data-testid="desktop-gate">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 mx-auto mb-6 bg-publix-green/10 rounded-3xl flex items-center justify-center">
            <ShoppingCart size={36} className="text-publix-green" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Shopping Mode
          </h1>
          <p className="text-muted text-base mb-6">
            Shopping Mode is designed for one-handed use at the store. Open this
            page on your phone for the best experience.
          </p>
          <div className="bg-cream rounded-2xl p-6 border border-border">
            <p className="text-sm font-semibold text-foreground mb-1">
              Open on your phone
            </p>
            <p className="text-xs text-muted">
              Navigate to this page on a mobile device to start shopping.
            </p>
          </div>
        </div>
        <BottomNav watchlistMatchCount={0} />
      </div>
    );
  }

  // No active trip — show start button
  if (!trip) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
        <div className="w-20 h-20 mb-6 bg-publix-green/10 rounded-3xl flex items-center justify-center">
          <ShoppingCart size={36} className="text-publix-green" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Ready to Shop?
        </h1>
        <p className="text-gray-500 text-base mb-8 max-w-xs">
          {watchlistLoading
            ? "Loading your list..."
            : watchlistItems.length > 0
            ? `Start a trip with your ${watchlistItems.length} watchlist item${watchlistItems.length === 1 ? "" : "s"}.`
            : "Add items to your watchlist first, or start an empty trip and add items as you go."}
        </p>
        <button
          onClick={() => startTrip(watchlistItems)}
          disabled={watchlistLoading}
          className="bg-publix-green text-white text-lg font-bold px-8 py-4 rounded-2xl hover:bg-publix-green-dark active:scale-95 transition-all disabled:opacity-50"
          data-testid="start-trip"
        >
          Start Shopping
        </button>

        <div className="mt-8 w-full max-w-xs">
          <AdSlot slot="XXXXXXXXXX" format="horizontal" dismissible />
        </div>
      </div>
    );
  }

  // Active trip — show shop mode
  return (
    <ShopMode
      items={trip.items}
      deals={deals}
      zipCode={zipCode}
      onToggleItem={toggleItem}
      onAddItem={(name: string) => {
        addItem(name);
        addKeyword(name);
      }}
      onRemoveItem={(id: string) => {
        // Find the trip item name before removing
        const tripItem = trip?.items.find((i) => i.id === id);
        removeItem(id);
        // Also remove from watchlist if there's a matching keyword
        if (tripItem) {
          const name = cleanDealSuffix(tripItem.name).toLowerCase();
          const match = watchlistItems.find((w) => w.keyword.toLowerCase() === name);
          if (match) removeKeyword(match.id);
        }
      }}
      onDone={() => {
        endTrip();
        router.push("/app");
      }}
    />
  );
}
