"use client";

import Image from "next/image";
import { Heart, Clock, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEAL_TYPE_CONFIG, cleanDealSuffix } from "@/lib/deal-type";
import type { Deal } from "@/types";

interface DealCardProps {
  deal: Deal;
  isWatched: boolean;
  onToggleWatch: () => void;
  onTap?: () => void;
}

export function DealCard({ deal, isWatched, onToggleWatch, onTap }: DealCardProps) {
  return (
    <div
      className="bg-paper rounded-2xl border border-border overflow-hidden shadow-warm card-lift cursor-pointer"
      onClick={onTap}
      role={onTap ? "button" : undefined}
      tabIndex={onTap ? 0 : undefined}
      onKeyDown={onTap ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onTap(); } } : undefined}
      aria-label={onTap ? `View details for ${deal.name}` : undefined}
    >
      {/* Image */}
      <div className="relative aspect-square bg-cream/50">
        {deal.imageUrl ? (
          <Image
            src={deal.imageUrl}
            alt={deal.name}
            fill
            className="object-contain p-3"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted/30">
            <ShoppingBag size={40} strokeWidth={1.5} />
          </div>
        )}

        {/* Deal type badge — sticker style */}
        <div
          className={cn(
            "absolute top-2.5 left-2.5 text-white text-[9px] font-extrabold tracking-wider uppercase px-2 py-1 rounded-lg",
            DEAL_TYPE_CONFIG[deal.dealType].bg,
            DEAL_TYPE_CONFIG[deal.dealType].shadow
          )}
          style={{ transform: "rotate(-3deg)" }}
        >
          {DEAL_TYPE_CONFIG[deal.dealType].label}
        </div>

        {/* Heart button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleWatch();
          }}
          className="absolute top-2.5 right-2.5 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-warm active:scale-90 transition-transform"
        >
          <Heart
            size={15}
            className={cn(
              "transition-colors",
              isWatched
                ? "fill-danger text-danger"
                : "text-muted/50"
            )}
          />
        </button>

        {/* Expiring soon badge */}
        {deal.isExpiringSoon && (
          <div className="absolute bottom-2.5 left-2.5 bg-warning text-white text-[9px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-warm">
            <Clock size={10} />
            {deal.daysLeft === 0 ? "Last day!" : `${deal.daysLeft}d left`}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-[13px] font-bold leading-tight line-clamp-2 text-foreground">
          {cleanDealSuffix(deal.name)}
        </h3>
        {deal.saleStory && (
          <p className={cn("text-[11px] font-bold mt-1", DEAL_TYPE_CONFIG[deal.dealType].textColor)}>
            {deal.saleStory}
          </p>
        )}
        {deal.priceText && !deal.saleStory && (
          <p className="text-[11px] text-muted font-medium mt-1">{deal.priceText}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] font-semibold text-muted/70 bg-cream px-2 py-0.5 rounded-lg">
            {deal.category}
          </span>
          {!deal.isExpiringSoon && deal.daysLeft > 0 && (
            <span className="text-[10px] text-muted/50 font-medium">
              {deal.daysLeft}d left
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
