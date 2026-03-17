"use client";

import { useState, useMemo } from "react";
import { useDealsContext } from "@/context/deals-context";
import { useWatchlist } from "@/hooks/use-watchlist";
import { useShoppingTrip } from "@/hooks/use-shopping-trips";
import { BottomNav } from "@/components/bottom-nav";
import { Clock, ChevronDown, ShoppingCart, Tag, Check } from "lucide-react";
import { cn } from "@/lib/utils";

function formatTripDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function HistoryPage() {
  const { deals } = useDealsContext();
  const { isWatched } = useWatchlist();
  const { history } = useShoppingTrip(deals);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const listMatchCount = useMemo(() => {
    return deals.filter((d) => isWatched(d)).length;
  }, [deals, isWatched]);

  return (
    <div className="min-h-screen pb-20">
      <div className="bg-publix-green text-white px-4 py-3 sticky top-0 z-40">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-bold">Shopping History</h1>
          <p className="text-green-100 text-xs">
            {history.length} trip{history.length !== 1 ? "s" : ""} recorded
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Clock size={28} className="text-gray-300" />
            </div>
            <p className="text-base font-semibold text-gray-400">
              No trips yet
            </p>
            <p className="text-sm text-muted mt-1 max-w-[240px]">
              Start shopping to build your history. Check off items on your list and tap Done.
            </p>
          </div>
        ) : (
          history.map((trip) => {
            const isExpanded = expandedId === trip.id;
            const checkedCount = trip.items.filter((i) => i.checked).length;
            const dealCount = trip.items.filter((i) => i.has_bogo).length;
            const date = trip.completed_at || trip.started_at;

            return (
              <div
                key={trip.id}
                className="bg-white rounded-xl border border-border overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : trip.id)}
                  className="w-full p-4 text-left flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-publix-green/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <ShoppingCart size={18} className="text-publix-green" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {formatTripDate(date)}
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      {checkedCount} item{checkedCount !== 1 ? "s" : ""}
                      {dealCount > 0 && (
                        <span className="text-publix-green font-medium">
                          {" "}· {dealCount} deal{dealCount !== 1 ? "s" : ""}
                        </span>
                      )}
                    </p>
                  </div>
                  <ChevronDown
                    size={18}
                    className={cn(
                      "text-muted transition-transform duration-200",
                      isExpanded && "rotate-180"
                    )}
                  />
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border/50">
                    <div className="space-y-1.5 mt-3">
                      {trip.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-2.5 py-1.5"
                        >
                          {item.checked ? (
                            <div className="w-5 h-5 rounded-full bg-publix-green flex items-center justify-center flex-shrink-0">
                              <Check size={12} className="text-white" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-gray-200 flex-shrink-0" />
                          )}
                          <span
                            className={cn(
                              "text-sm flex-1",
                              item.checked
                                ? "text-gray-400 line-through"
                                : "text-foreground"
                            )}
                          >
                            {item.name}
                          </span>
                          {item.has_bogo && (
                            <span className="text-[10px] font-bold text-publix-green bg-publix-green/10 px-1.5 py-0.5 rounded">
                              Deal
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <BottomNav listMatchCount={listMatchCount} />
    </div>
  );
}
