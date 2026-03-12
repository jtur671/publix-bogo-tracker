"use client";

import { MapPin } from "lucide-react";

interface StoreHeaderProps {
  zipCode: string;
  dealCount: number;
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

export function StoreHeader({
  zipCode,
  dealCount,
  validFrom,
  validTo,
  onChangeZip,
}: StoreHeaderProps) {
  const dateRange =
    validFrom && validTo
      ? `${formatDate(validFrom)} – ${formatDate(validTo)}`
      : "";

  return (
    <div className="bg-publix-green text-white px-4 py-3 sticky top-0 z-40">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Publix BOGO</h1>
          <p className="text-green-100 text-xs">
            {dealCount} deals {dateRange && `· ${dateRange}`}
          </p>
        </div>
        <button
          onClick={onChangeZip}
          className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1.5 text-sm hover:bg-white/30 transition-colors"
        >
          <MapPin size={14} />
          {zipCode}
        </button>
      </div>
    </div>
  );
}
