"use client";

import { useState } from "react";
import { MapPin, X } from "lucide-react";

interface ZipCodeModalProps {
  open: boolean;
  currentZip?: string;
  onSave: (zip: string) => void;
  onClose?: () => void;
  isFirstRun?: boolean;
}

export function ZipCodeModal({
  open,
  currentZip,
  onSave,
  onClose,
  isFirstRun,
}: ZipCodeModalProps) {
  const [zip, setZip] = useState(currentZip || "");
  const [error, setError] = useState("");

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{5}$/.test(zip)) {
      setError("Please enter a valid 5-digit zip code");
      return;
    }
    onSave(zip);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-publix-green-light rounded-full flex items-center justify-center">
              <MapPin size={20} className="text-publix-green" />
            </div>
            <div>
              <h2 className="font-bold text-lg">
                {isFirstRun ? "Welcome!" : "Change Location"}
              </h2>
              <p className="text-xs text-muted">
                {isFirstRun
                  ? "Enter your zip to find deals"
                  : "Update your store location"}
              </p>
            </div>
          </div>
          {!isFirstRun && onClose && (
            <button onClick={onClose} className="text-muted hover:text-foreground">
              <X size={20} />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={5}
            value={zip}
            onChange={(e) => {
              setZip(e.target.value.replace(/\D/g, ""));
              setError("");
            }}
            placeholder="Enter zip code (e.g. 34695)"
            className="w-full border border-border rounded-xl px-4 py-3 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-publix-green/30 focus:border-publix-green"
            autoFocus
          />
          {error && (
            <p className="text-danger text-xs mt-2 text-center">{error}</p>
          )}
          <button
            type="submit"
            className="w-full bg-publix-green text-white font-semibold rounded-xl py-3 mt-4 hover:bg-publix-green-dark transition-colors"
          >
            {isFirstRun ? "Find Deals" : "Update"}
          </button>
        </form>
      </div>
    </div>
  );
}
