"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { X, ShoppingBag, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Deal, WatchlistItem } from "@/types";

interface ShoppingListItemProps {
  item: WatchlistItem;
  matchingDeals: Deal[];
  isChecked: boolean;
  onToggleChecked: () => void;
  onRemove: () => void;
  index: number;
}

/* ------------------------------------------------------------------ */
/*  Tiny deal thumbnail — 32px rounded square with image or fallback  */
/* ------------------------------------------------------------------ */
function DealThumb({ deal, size = 32 }: { deal: Deal; size?: number }) {
  return deal.imageUrl ? (
    <div
      className="relative rounded-lg bg-white border border-border/50 overflow-hidden flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <Image
        src={deal.imageUrl}
        alt={deal.name}
        fill
        className="object-contain p-0.5"
        sizes={`${size}px`}
      />
    </div>
  ) : (
    <div
      className="rounded-lg bg-white border border-border/50 flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <ShoppingBag size={size * 0.45} className="text-muted/30" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Clean deal name: strip trailing "BOGO*" suffix                    */
/* ------------------------------------------------------------------ */
function cleanDealName(name: string) {
  return name.replace(/\s*BOGO\*?\s*$/i, "");
}

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */
export function ShoppingListItem({
  item,
  matchingDeals,
  isChecked,
  onToggleChecked,
  onRemove,
  index,
}: ShoppingListItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [swiping, setSwiping] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const expandRef = useRef<HTMLDivElement>(null);

  /* --- Swipe-to-delete handlers (unchanged) --- */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setSwiping(true);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!swiping) return;
      const diff = e.touches[0].clientX - touchStartX;
      if (diff < 0) {
        setTranslateX(Math.max(diff, -100));
      }
    },
    [swiping, touchStartX]
  );

  const handleTouchEnd = useCallback(() => {
    setSwiping(false);
    if (translateX < -60) {
      onRemove();
    }
    setTranslateX(0);
  }, [translateX, onRemove]);

  /* --- Derived state --- */
  const displayName = item.keyword
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const hasBogo = matchingDeals.length > 0;
  const hasMultiple = matchingDeals.length > 1;
  const firstDeal = matchingDeals[0] as Deal | undefined;

  return (
    <div
      className="relative overflow-hidden rounded-2xl list-enter"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* Swipe-to-delete background */}
      {translateX < 0 && (
        <div className="absolute inset-0 bg-danger/90 flex items-center justify-end px-5 rounded-2xl">
          <span className="text-white text-xs font-bold tracking-wide uppercase">
            Remove
          </span>
        </div>
      )}

      {/* Main item row */}
      <div
        className={cn(
          "relative rounded-2xl transition-all duration-200 border",
          isChecked
            ? "bg-cream/80 border-border/50"
            : hasBogo
            ? "bg-paper border-publix-green/20 shadow-warm"
            : "bg-paper border-border shadow-warm",
          translateX !== 0 && "transition-none"
        )}
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* ============================================================ */}
        {/*  COMPACT ROW — always visible                                */}
        {/* ============================================================ */}
        <div
          className={cn(
            "flex items-center gap-2.5 p-2.5 pr-2 min-h-[48px]",
            hasMultiple && !isChecked && "cursor-pointer"
          )}
          onClick={
            hasMultiple && !isChecked
              ? () => setExpanded((prev) => !prev)
              : undefined
          }
          role={hasMultiple && !isChecked ? "button" : undefined}
          aria-expanded={hasMultiple && !isChecked ? expanded : undefined}
          aria-label={
            hasMultiple && !isChecked
              ? `${displayName}, ${matchingDeals.length} BOGO brands. Tap to ${expanded ? "collapse" : "expand"}`
              : undefined
          }
        >
          {/* Checkbox */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleChecked();
            }}
            className={cn(
              "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200",
              isChecked
                ? "bg-publix-green border-publix-green scale-100"
                : hasBogo
                ? "border-publix-green/40 hover:border-publix-green hover:bg-publix-green-light/50"
                : "border-gray-300 hover:border-muted"
            )}
            aria-label={
              isChecked ? `Uncheck ${displayName}` : `Check ${displayName}`
            }
          >
            {isChecked && (
              <svg
                width="12"
                height="12"
                viewBox="0 0 14 14"
                fill="none"
                className="check-fill"
              >
                <path
                  d="M3 7L6 10L11 4.5"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>

          {/* Inline thumbnail for single BOGO match */}
          {hasBogo && !isChecked && !hasMultiple && firstDeal && (
            <DealThumb deal={firstDeal} size={32} />
          )}

          {/* Stacked thumbnails for multiple matches */}
          {hasBogo && !isChecked && hasMultiple && (
            <div className="relative flex-shrink-0 w-9 h-8">
              {matchingDeals.slice(0, 2).map((deal, i) => (
                <div
                  key={deal.id}
                  className="absolute rounded-md bg-white border border-border/50 overflow-hidden"
                  style={{
                    width: 26,
                    height: 26,
                    left: i * 7,
                    top: i * 3,
                    zIndex: 2 - i,
                  }}
                >
                  {deal.imageUrl ? (
                    <Image
                      src={deal.imageUrl}
                      alt={deal.name}
                      fill
                      className="object-contain p-0.5"
                      sizes="26px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag size={11} className="text-muted/30" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Text content */}
          <div className="flex-1 min-w-0">
            {/* ---- No BOGO ---- */}
            {!hasBogo && (
              <>
                <span
                  className={cn(
                    "text-sm font-semibold transition-all duration-200 block truncate",
                    isChecked
                      ? "text-muted/60 line-through decoration-2"
                      : "text-foreground/70"
                  )}
                >
                  {displayName}
                </span>
                {!isChecked && (
                  <p className="text-[10px] text-muted/50 font-medium leading-tight">
                    Not on BOGO this week
                  </p>
                )}
              </>
            )}

            {/* ---- Checked BOGO item (show just the keyword) ---- */}
            {hasBogo && isChecked && (
              <span className="text-sm font-semibold text-muted/60 line-through decoration-2 block truncate">
                {displayName}
              </span>
            )}

            {/* ---- Single BOGO match ---- */}
            {hasBogo && !isChecked && !hasMultiple && firstDeal && (
              <div className="min-w-0">
                <span className="text-[13px] font-semibold text-foreground truncate block leading-tight">
                  {cleanDealName(firstDeal.name)}
                </span>
                {firstDeal.saleStory && (
                  <p className="text-[10px] font-bold text-publix-green leading-tight mt-0.5 truncate">
                    {firstDeal.saleStory}
                  </p>
                )}
              </div>
            )}

            {/* ---- Multiple BOGO matches ---- */}
            {hasBogo && !isChecked && hasMultiple && (
              <div className="min-w-0">
                <span className="text-[13px] font-semibold text-foreground truncate block leading-tight">
                  {displayName}
                </span>
                <p className="text-[10px] font-bold text-publix-green leading-tight mt-0.5">
                  {matchingDeals.length} brands on BOGO
                </p>
              </div>
            )}
          </div>

          {/* BOGO sticker */}
          {hasBogo && !isChecked && (
            <span
              className="bogo-sticker inline-flex items-center bg-publix-green text-white text-[8px] font-extrabold tracking-wider uppercase px-1.5 py-0.5 rounded-md shadow-[0_2px_8px_-2px_rgba(46,125,22,0.4)] flex-shrink-0"
              style={{ transform: "rotate(-2deg)" }}
            >
              BOGO
            </span>
          )}

          {/* Expand chevron for multiple matches */}
          {hasMultiple && !isChecked && (
            <ChevronRight
              size={16}
              className={cn(
                "text-muted/40 flex-shrink-0 transition-transform duration-200",
                expanded && "rotate-90"
              )}
            />
          )}

          {/* Remove button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="w-7 h-7 rounded-xl flex items-center justify-center text-muted/30 hover:text-danger hover:bg-danger/10 transition-all flex-shrink-0 active:scale-90"
            aria-label={`Remove ${displayName} from list`}
          >
            <X size={14} />
          </button>
        </div>

        {/* ============================================================ */}
        {/*  EXPANDABLE DEAL LIST — only for multiple BOGO matches       */}
        {/* ============================================================ */}
        {hasMultiple && !isChecked && (
          <div
            ref={expandRef}
            className={cn(
              "grid transition-[grid-template-rows] duration-250 ease-out",
              expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            )}
          >
            <div className="overflow-hidden">
              <div className="px-2.5 pb-2.5 pt-0.5 space-y-0.5">
                <div className="h-px bg-border/60 mb-1.5" />
                {matchingDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="flex items-center gap-2.5 py-1.5 px-1 rounded-lg hover:bg-cream/60 transition-colors"
                  >
                    <DealThumb deal={deal} size={28} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-foreground/80 truncate leading-tight">
                        {cleanDealName(deal.name)}
                      </p>
                      {deal.saleStory && (
                        <p className="text-[10px] font-bold text-publix-green leading-tight">
                          {deal.saleStory}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Green left accent for BOGO items */}
        {hasBogo && !isChecked && (
          <div className="absolute left-0 top-2.5 bottom-2.5 w-[3px] bg-publix-green rounded-r-full" />
        )}
      </div>
    </div>
  );
}
