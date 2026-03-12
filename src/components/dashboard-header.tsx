"use client";

import { MapPin } from "lucide-react";

interface DashboardHeaderProps {
  zipCode: string;
  dealCount: number;
  watchlistMatchCount: number;
  watchlistTotal: number;
  validFrom?: string;
  validTo?: string;
  onChangeZip: () => void;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function DashboardHeader({
  zipCode,
  dealCount,
  watchlistMatchCount,
  watchlistTotal,
  validFrom,
  validTo,
  onChangeZip,
}: DashboardHeaderProps) {
  const dateRange =
    validFrom && validTo
      ? `${formatDate(validFrom)} \u2013 ${formatDate(validTo)}`
      : "";

  return (
    <header className="bg-gradient-to-b from-publix-green to-publix-green-dark text-white sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}>
              Publix BOGO
            </h1>
            <p className="text-white/60 text-xs font-medium mt-0.5">
              {dealCount} deals
              {dateRange && <span className="text-white/40"> &middot; </span>}
              {dateRange && <span>{dateRange}</span>}
            </p>
          </div>
          <button
            onClick={onChangeZip}
            className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm font-medium hover:bg-white/25 transition-all active:scale-95"
            aria-label={`Change location, currently ${zipCode}`}
          >
            <MapPin size={13} />
            {zipCode}
          </button>
        </div>

        {watchlistTotal > 0 && (
          <div className="mt-3 bg-white/10 backdrop-blur-sm rounded-xl px-3.5 py-2.5 flex items-center gap-2.5">
            <span className="bg-white text-publix-green text-xs font-extrabold rounded-full min-w-[22px] h-[22px] flex items-center justify-center px-1.5 flex-shrink-0 shadow-warm">
              {watchlistMatchCount}
            </span>
            <span className="text-sm text-white/80 font-medium">
              of your {watchlistTotal} {watchlistTotal === 1 ? "item" : "items"} on BOGO this week
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
