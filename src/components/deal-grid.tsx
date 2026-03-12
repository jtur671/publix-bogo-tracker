"use client";

import { DealCard } from "./deal-card";
import type { Deal } from "@/types";

interface DealGridProps {
  deals: Deal[];
  loading: boolean;
  isWatched: (deal: Deal) => boolean;
  onToggleWatch: (deal: Deal) => void;
  onTapDeal?: (deal: Deal) => void;
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <div className="aspect-square skeleton" />
      <div className="p-3 space-y-2">
        <div className="h-4 skeleton rounded w-3/4" />
        <div className="h-3 skeleton rounded w-1/2" />
        <div className="h-3 skeleton rounded w-1/3" />
      </div>
    </div>
  );
}

export function DealGrid({
  deals,
  loading,
  isWatched,
  onToggleWatch,
  onTapDeal,
}: DealGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div className="text-center py-12 text-muted">
        <p className="text-lg">No deals found</p>
        <p className="text-sm mt-1">Try a different search or category</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {deals.map((deal) => (
        <DealCard
          key={deal.id}
          deal={deal}
          isWatched={isWatched(deal)}
          onToggleWatch={() => onToggleWatch(deal)}
          onTap={onTapDeal ? () => onTapDeal(deal) : undefined}
        />
      ))}
    </div>
  );
}
