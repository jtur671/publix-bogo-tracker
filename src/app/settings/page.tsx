"use client";

import { useState } from "react";
import { useStoreConfig } from "@/hooks/use-store-config";
import { useWatchlist } from "@/hooks/use-watchlist";
import { useDealsContext } from "@/context/deals-context";
import { BottomNav } from "@/components/bottom-nav";
import { ZipCodeModal } from "@/components/zip-code-modal";
import { InstallPrompt } from "@/components/install-prompt";
import { MapPin, Trash2, Info, ExternalLink } from "lucide-react";

export default function SettingsPage() {
  const { zipCode, updateZip } = useStoreConfig();
  const { deals } = useDealsContext();
  const { items: watchlist, isWatched } = useWatchlist();
  const [showZipModal, setShowZipModal] = useState(false);
  const [cleared, setCleared] = useState(false);

  const watchlistMatchCount = deals.filter((d) => isWatched(d)).length;

  const handleClearData = () => {
    if (confirm("Clear all local data? This will remove your zip code and watchlist.")) {
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

        {/* Zip code */}
        <button
          onClick={() => setShowZipModal(true)}
          className="w-full bg-white rounded-xl border border-border p-4 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors"
        >
          <MapPin size={20} className="text-publix-green" />
          <div className="flex-1">
            <p className="text-sm font-medium">Store Location</p>
            <p className="text-xs text-muted">Zip code: {zipCode}</p>
          </div>
          <span className="text-xs text-publix-green font-medium">Change</span>
        </button>

        {/* Clear data */}
        <button
          onClick={handleClearData}
          className="w-full bg-white rounded-xl border border-border p-4 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors"
        >
          <Trash2 size={20} className="text-danger" />
          <div className="flex-1">
            <p className="text-sm font-medium">Clear All Data</p>
            <p className="text-xs text-muted">
              Remove watchlist, zip code, and preferences
            </p>
          </div>
          {cleared && (
            <span className="text-xs text-publix-green font-medium">
              Cleared!
            </span>
          )}
        </button>

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
            <p>
              {watchlist.length} watchlist keyword
              {watchlist.length !== 1 ? "s" : ""} · {zipCode} zip
            </p>
          </div>
        </div>

        {/* Supabase setup hint */}
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs font-medium mb-1">Cross-Device Sync</p>
          <p className="text-xs text-muted">
            To sync your watchlist across devices, set up Supabase and add your
            keys to <code className="bg-gray-200 px-1 rounded">.env.local</code>.
            Without Supabase, data is stored locally in your browser.
          </p>
        </div>
      </div>

      <BottomNav watchlistMatchCount={watchlistMatchCount} />

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
