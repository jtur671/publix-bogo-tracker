"use client";

import { useState } from "react";
import { useStoreConfig } from "@/hooks/use-store-config";
import { useWatchlist } from "@/hooks/use-watchlist";
import { usePublixAccount } from "@/hooks/use-publix-account";
import { useAuth } from "@/context/auth-context";
import { useDealsContext } from "@/context/deals-context";
import { BottomNav } from "@/components/bottom-nav";
import { ZipCodeModal } from "@/components/zip-code-modal";
import { InstallPrompt } from "@/components/install-prompt";
import { MapPin, Trash2, Info, LogOut, User, Scissors, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { zipCode, updateZip } = useStoreConfig();
  const { user, signOut } = useAuth();
  const { deals } = useDealsContext();
  const { items: watchlist, isWatched } = useWatchlist();
  const publix = usePublixAccount();
  const [showZipModal, setShowZipModal] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [publixEmail, setPublixEmail] = useState("");
  const [publixPassword, setPublixPassword] = useState("");
  const [clipState, setClipState] = useState<"idle" | "clipping" | "success" | "error">("idle");
  const [clipMessage, setClipMessage] = useState("");

  // Pre-fill email from saved value on first render
  const emailValue = publixEmail || publix.email || "";

  const watchlistMatchCount = deals.filter((d) => isWatched(d)).length;

  const handleClearData = () => {
    if (confirm("Clear all local data? This will remove your zip code and watchlist.")) {
      localStorage.clear();
      setCleared(true);
      setTimeout(() => window.location.reload(), 500);
    }
  };

  const handleClipAll = async () => {
    const email = emailValue.trim();
    if (!email || !publixPassword || clipState === "clipping") return;

    // Save email for next time (never the password)
    publix.saveEmail(email);

    setClipState("clipping");
    setClipMessage("");

    try {
      const res = await fetch("/api/clip-coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: publixPassword }),
      });

      let data: { clipped?: number; error?: string };
      try {
        data = await res.json();
      } catch {
        data = { error: "Unexpected server response" };
      }

      if (!res.ok) {
        setClipState("error");
        setClipMessage(data.error || "Failed to clip coupons");
      } else {
        setClipState("success");
        setClipMessage(
          data.clipped && data.clipped > 0
            ? `${data.clipped} coupon${data.clipped !== 1 ? "s" : ""} clipped!`
            : "All coupons already clipped!"
        );
      }
    } catch {
      setClipState("error");
      setClipMessage("Network error. Please try again.");
    }

    // Clear password from memory after use
    setPublixPassword("");

    // Auto-reset to idle after showing result
    setTimeout(() => {
      setClipState((s) => (s === "success" || s === "error" ? "idle" : s));
    }, 5000);
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

        {/* Clip All Coupons */}
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-3 mb-3">
            <Scissors size={20} className="text-purple-600" />
            <div>
              <p className="text-sm font-medium">Clip All Coupons</p>
              <p className="text-xs text-muted">
                Sign in to Publix to clip every digital coupon
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <input
              type="email"
              placeholder="Publix account email"
              value={emailValue}
              onChange={(e) => setPublixEmail(e.target.value)}
              disabled={clipState === "clipping"}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 disabled:opacity-50"
            />
            <input
              type="password"
              placeholder="Password (not saved)"
              value={publixPassword}
              onChange={(e) => setPublixPassword(e.target.value)}
              disabled={clipState === "clipping"}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 disabled:opacity-50"
            />

            {publix.hasEmail && (
              <button
                onClick={publix.clearEmail}
                className="text-xs text-danger hover:underline"
              >
                Forget saved email
              </button>
            )}

            {clipState === "idle" && (
              <button
                onClick={handleClipAll}
                disabled={!emailValue.trim() || !publixPassword}
                className="w-full py-2.5 rounded-xl font-bold text-sm bg-purple-600 text-white disabled:opacity-40 transition-opacity active:scale-[0.98]"
              >
                Clip All Coupons
              </button>
            )}

            {clipState === "clipping" && (
              <div className="flex items-center justify-center gap-2 py-2.5 text-sm text-purple-600 font-medium">
                <Loader2 size={16} className="animate-spin" />
                Clipping coupons...
              </div>
            )}

            {clipState === "success" && (
              <p className="text-sm text-publix-green font-medium text-center py-2.5">
                {clipMessage}
              </p>
            )}

            {clipState === "error" && (
              <p className="text-sm text-danger font-medium text-center py-2.5">
                {clipMessage}
              </p>
            )}
          </div>
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
            <p>
              {watchlist.length} watchlist keyword
              {watchlist.length !== 1 ? "s" : ""} · {zipCode} zip
            </p>
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
