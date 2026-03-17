"use client";

import { useState } from "react";
import { useStoreConfig } from "@/hooks/use-store-config";
import { useWatchlist } from "@/hooks/use-watchlist";
import { useAuth } from "@/context/auth-context";
import { useDealsContext } from "@/context/deals-context";
import { BottomNav } from "@/components/bottom-nav";
import { ZipCodeModal } from "@/components/zip-code-modal";
import { InstallPrompt } from "@/components/install-prompt";
import { useShoppingTrip } from "@/hooks/use-shopping-trips";
import { MapPin, Trash2, Info, LogOut, User, Calendar, Clock } from "lucide-react";

export default function SettingsPage() {
  const { zipCode, updateZip } = useStoreConfig();
  const { user, signOut } = useAuth();
  const { deals } = useDealsContext();
  const { items: watchlist, isWatched } = useWatchlist();
  const { history, clearHistory } = useShoppingTrip(deals);
  const [showZipModal, setShowZipModal] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [historyCleared, setHistoryCleared] = useState(false);

  const watchlistMatchCount = deals.filter((d) => isWatched(d)).length;

  const handleClearData = () => {
    if (confirm("Clear all local data? This will remove your shopping list, zip code, and preferences.")) {
      localStorage.clear();
      setCleared(true);
      setTimeout(() => window.location.reload(), 500);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="bg-publix-green text-white px-4 py-3 sticky top-0 z-40">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-bold">Settings</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <InstallPrompt />

        {/* Preferences */}
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <button
            onClick={() => setShowZipModal(true)}
            className="w-full p-4 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors"
          >
            <MapPin size={20} className="text-publix-green" />
            <div className="flex-1">
              <p className="text-sm font-medium">Store Location</p>
              <p className="text-xs text-muted">Zip code: {zipCode}</p>
            </div>
            <span className="text-xs text-publix-green font-medium">Change</span>
          </button>

          <div className="border-t border-border mx-4" />

          <button
            onClick={handleClearData}
            className="w-full p-4 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors"
          >
            <Trash2 size={20} className="text-danger" />
            <div className="flex-1">
              <p className="text-sm font-medium">Clear All Data</p>
              <p className="text-xs text-muted">
                Remove shopping list, zip code, and preferences
              </p>
            </div>
            {cleared && (
              <span className="text-xs text-publix-green font-medium">
                Cleared!
              </span>
            )}
          </button>

          <div className="border-t border-border mx-4" />

          <button
            onClick={() => {
              if (confirm("Clear all trip history?")) {
                clearHistory();
                setHistoryCleared(true);
                setTimeout(() => setHistoryCleared(false), 2000);
              }
            }}
            className="w-full p-4 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors"
          >
            <Clock size={20} className="text-muted" />
            <div className="flex-1">
              <p className="text-sm font-medium">Clear Trip History</p>
              <p className="text-xs text-muted">
                {history.length} trip{history.length !== 1 ? "s" : ""} recorded
              </p>
            </div>
            {historyCleared && (
              <span className="text-xs text-publix-green font-medium">
                Cleared!
              </span>
            )}
          </button>
        </div>

        {/* App info */}
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-3 mb-3">
            <Info size={20} className="text-muted" />
            <p className="text-sm font-medium">About</p>
          </div>
          <div className="space-y-2 text-xs text-muted">
            <p>Publix BOGO Tracker v1.0</p>
            <p>
              Deal data from Flipp. Not affiliated with Publix Super Markets.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <span className="flex items-center gap-1">
                <Calendar size={11} />
                {deals.length > 0 ? `${deals.length} deals this week` : "No deals loaded"}
              </span>
              <span>·</span>
              <span>
                {watchlist.length} item{watchlist.length !== 1 ? "s" : ""}
              </span>
              <span>·</span>
              <span>{zipCode} zip</span>
            </div>
          </div>
        </div>

        {/* Account */}
        {user && (
          <div className="bg-white rounded-xl border border-border p-4">
            <div className="flex items-center gap-3 mb-3">
              <User size={20} className="text-publix-green" />
              <p className="text-sm font-medium">Account</p>
            </div>
            <p className="text-xs text-muted mb-3">{user.email}</p>
            <button
              onClick={signOut}
              className="flex items-center gap-2 text-sm text-danger font-medium hover:underline"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        )}
      </div>

      <BottomNav listMatchCount={watchlistMatchCount} />

      <ZipCodeModal
        open={showZipModal}
        currentZip={zipCode}
        onSave={(zip) => {
          updateZip(zip);
          setShowZipModal(false);
        }}
        onClose={() => setShowZipModal(false)}
      />
    </div>
  );
}
