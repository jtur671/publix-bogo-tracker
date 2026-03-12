"use client";

import { useState, useMemo } from "react";
import { useWatchlist } from "@/hooks/use-watchlist";
import { useDealsContext } from "@/context/deals-context";
import { BottomNav } from "@/components/bottom-nav";
import { PushManager } from "@/components/push-manager";
import { Bell, Tag } from "lucide-react";
import Image from "next/image";

export default function AlertsPage() {
  const { deals } = useDealsContext();
  const { items: watchlist, isWatched, getMatchingKeyword } = useWatchlist();
  const [testSent, setTestSent] = useState(false);

  const matchedDeals = useMemo(() => {
    return deals.filter((d) => isWatched(d));
  }, [deals, isWatched]);

  const watchlistMatchCount = matchedDeals.length;

  const sendTestNotification = async () => {
    if ("serviceWorker" in navigator && "Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification("BOGO Alert Test", {
          body: `${watchlistMatchCount} watchlist items are on BOGO this week!`,
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
          tag: "test",
        });
        setTestSent(true);
        setTimeout(() => setTestSent(false), 3000);
      }
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="bg-publix-green text-white px-4 py-3 sticky top-0 z-40">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-bold">Alerts</h1>
          <p className="text-green-100 text-xs">
            Manage notifications for watchlist deals
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Push notification toggle */}
        <PushManager />

        {/* Test notification */}
        <button
          onClick={sendTestNotification}
          className="w-full bg-white rounded-xl border border-border p-4 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors"
        >
          <Bell size={20} className="text-publix-green" />
          <div className="flex-1">
            <p className="text-sm font-medium">Send Test Notification</p>
            <p className="text-xs text-muted">
              Verify notifications are working
            </p>
          </div>
          {testSent && (
            <span className="text-xs text-publix-green font-medium">Sent!</span>
          )}
        </button>

        {/* Current matches banner */}
        {watchlistMatchCount > 0 && (
          <div className="bg-publix-green-light rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Tag size={16} className="text-publix-green" />
              <p className="text-sm font-semibold text-publix-green">
                {watchlistMatchCount} watchlist item
                {watchlistMatchCount !== 1 ? "s" : ""} on BOGO!
              </p>
            </div>
            <div className="space-y-2">
              {matchedDeals.slice(0, 5).map((deal) => (
                <div
                  key={deal.id}
                  className="bg-white rounded-lg p-2 flex items-center gap-3"
                >
                  <div className="relative w-12 h-12 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden">
                    {deal.imageUrl ? (
                      <Image
                        src={deal.imageUrl}
                        alt={deal.name}
                        fill
                        className="object-contain p-1"
                        sizes="48px"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-muted">
                        <Tag size={20} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{deal.name}</p>
                    <p className="text-[10px] text-muted">
                      Matches &quot;{getMatchingKeyword(deal)}&quot; ·{" "}
                      {deal.daysLeft}d left
                    </p>
                  </div>
                </div>
              ))}
              {matchedDeals.length > 5 && (
                <p className="text-xs text-muted text-center">
                  +{matchedDeals.length - 5} more
                </p>
              )}
            </div>
          </div>
        )}

        {watchlistMatchCount === 0 && watchlist.length > 0 && (
          <div className="text-center py-8 text-muted">
            <Bell size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No watchlist items on sale this week</p>
            <p className="text-xs mt-1">
              We&apos;ll alert you when matches appear
            </p>
          </div>
        )}

        {watchlist.length === 0 && (
          <div className="text-center py-8 text-muted">
            <Bell size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Add items to your watchlist first</p>
            <p className="text-xs mt-1">
              Tap the heart on deals or add keywords on the Watchlist tab
            </p>
          </div>
        )}
      </div>

      <BottomNav watchlistMatchCount={watchlistMatchCount} />
    </div>
  );
}
