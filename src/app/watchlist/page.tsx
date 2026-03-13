"use client";

import { useState, useMemo } from "react";
import { useWatchlist } from "@/hooks/use-watchlist";
import { useDealsContext } from "@/context/deals-context";
import { BottomNav } from "@/components/bottom-nav";
import { AdSlot } from "@/components/ad-slot";
import { Plus, Trash2, Search } from "lucide-react";

export default function WatchlistPage() {
  const { deals } = useDealsContext();
  const { items, addKeyword, removeKeyword, isWatched } = useWatchlist();
  const [newKeyword, setNewKeyword] = useState("");

  const watchlistMatchCount = useMemo(() => {
    return deals.filter((d) => isWatched(d)).length;
  }, [deals, isWatched]);

  const keywordMatches = useMemo(() => {
    const matches = new Map<string, number>();
    for (const item of items) {
      const kw = item.keyword.toLowerCase();
      const count = deals.filter(
        (d) =>
          d.name.toLowerCase().includes(kw) ||
          d.description.toLowerCase().includes(kw)
      ).length;
      matches.set(item.id, count);
    }
    return matches;
  }, [items, deals]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newKeyword.trim()) {
      addKeyword(newKeyword);
      setNewKeyword("");
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="bg-publix-green text-white px-4 py-3 sticky top-0 z-40">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-bold">Watchlist</h1>
          <p className="text-green-100 text-xs">
            {items.length} keyword{items.length !== 1 ? "s" : ""} ·{" "}
            {watchlistMatchCount} on sale now
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Add keyword form */}
        <form onSubmit={handleAdd} className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder='Add keyword (e.g. "yogurt")'
              className="w-full bg-white rounded-xl pl-9 pr-4 py-2.5 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-publix-green/30 focus:border-publix-green"
            />
          </div>
          <button
            type="submit"
            disabled={!newKeyword.trim()}
            className="bg-publix-green text-white rounded-xl px-4 flex items-center gap-1 text-sm font-medium hover:bg-publix-green-dark transition-colors disabled:opacity-50"
          >
            <Plus size={16} />
            Add
          </button>
        </form>

        {/* Info */}
        <p className="text-xs text-muted">
          Keywords match any current or future deal. You&apos;ll see a
          notification when matches appear.
        </p>

        <AdSlot slot="XXXXXXXXXX" format="horizontal" dismissible />

        {/* Keyword list */}
        {items.length === 0 ? (
          <div className="text-center py-12 text-muted">
            <p className="text-lg">No watchlist items yet</p>
            <p className="text-sm mt-1">
              Tap the heart on any deal or add a keyword above
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const matchCount = keywordMatches.get(item.id) || 0;
              const onSale = matchCount > 0;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-border p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {item.keyword}
                        </span>
                        {onSale && (
                          <span className="bg-publix-green text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                            ON SALE ({matchCount})
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted">
                        Added{" "}
                        {new Date(item.added_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeKeyword(item.id)}
                    className="text-muted hover:text-danger p-2 -mr-2"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav watchlistMatchCount={watchlistMatchCount} />
    </div>
  );
}
