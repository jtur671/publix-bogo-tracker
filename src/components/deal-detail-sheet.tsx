"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import Image from "next/image";
import { X, ShoppingBag, Heart, HeartOff, Clock, Tag, ExternalLink, Copy, Check } from "lucide-react";
import { cn, daysLeft as freshDaysLeft } from "@/lib/utils";
import { DEAL_TYPE_CONFIG, cleanDealSuffix } from "@/lib/deal-type";
import type { Deal } from "@/types";

interface DealDetailSheetProps {
  deal: Deal | null;
  isWatched: boolean;
  onToggleWatch: () => void;
  onClose: () => void;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function DealDetailSheet({
  deal,
  isWatched,
  onToggleWatch,
  onClose,
}: DealDetailSheetProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [touchStartY, setTouchStartY] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  // Animate in
  useEffect(() => {
    if (deal) {
      setCopied(false);
      // Small delay to trigger CSS transition
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setVisible(true);
        });
      });
    } else {
      setVisible(false);
    }
  }, [deal]);

  // Close with animation
  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    if (!deal) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [deal, handleClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (deal) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [deal]);

  // Swipe-down to dismiss
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
    setDragging(true);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!dragging) return;
      const diff = e.touches[0].clientY - touchStartY;
      if (diff > 0) {
        setTranslateY(diff);
      }
    },
    [dragging, touchStartY]
  );

  const handleTouchEnd = useCallback(() => {
    setDragging(false);
    if (translateY > 120) {
      handleClose();
    }
    setTranslateY(0);
  }, [translateY, handleClose]);

  if (!deal) return null;

  const cleanName = cleanDealSuffix(deal.name);
  const days = freshDaysLeft(deal.validTo);
  const expired = days < 0;
  const expiringSoon = !expired && days <= 2;

  return (
    <div
      ref={backdropRef}
      className={cn(
        "fixed inset-0 z-[100] transition-colors duration-300",
        visible ? "bg-black/50" : "bg-black/0 pointer-events-none"
      )}
      onClick={(e) => {
        if (e.target === backdropRef.current) handleClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Deal details for ${cleanName}`}
    >
      <div
        ref={sheetRef}
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto transition-transform duration-300 ease-out",
          visible ? "translate-y-0" : "translate-y-full",
          dragging && "transition-none"
        )}
        style={
          translateY > 0
            ? { transform: `translateY(${translateY}px)` }
            : undefined
        }
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="sticky top-0 z-10 bg-white rounded-t-3xl pt-3 pb-2 flex justify-center">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          aria-label="Close deal details"
        >
          <X size={16} className="text-foreground" />
        </button>

        <div className="px-5 pb-8">
          {/* Product image */}
          <div className="relative w-full aspect-[4/3] max-w-[280px] mx-auto mb-5 bg-gray-50 rounded-2xl overflow-hidden">
            {deal.imageUrl ? (
              <Image
                src={deal.imageUrl}
                alt={cleanName}
                fill
                className="object-contain p-4"
                sizes="280px"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <ShoppingBag size={64} className="text-muted/20" />
              </div>
            )}

            {/* Deal type sticker */}
            <div
              className={cn(
                "absolute top-3 left-3 text-white text-xs font-extrabold tracking-wider uppercase px-3 py-1.5 rounded-xl shadow-lg",
                DEAL_TYPE_CONFIG[deal.dealType].bg
              )}
              style={{ transform: "rotate(-3deg)" }}
            >
              {DEAL_TYPE_CONFIG[deal.dealType].label}
            </div>

            {/* Expired / Expiring soon badge */}
            {expired && (
              <div className="absolute top-3 right-3 bg-gray-400 text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                <Clock size={10} />
                Expired
              </div>
            )}
            {expiringSoon && (
              <div className="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                <Clock size={10} />
                {days === 0 ? "Last day!" : `${days}d left`}
              </div>
            )}
          </div>

          {/* Category badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-cream text-foreground/70 text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5">
              <Tag size={11} />
              {deal.category}
            </span>
            {expiringSoon && !expiringSoon && null}
          </div>

          {/* Deal name */}
          <h2 className="text-xl font-bold text-foreground leading-tight mb-1">
            {cleanName}
          </h2>

          {/* Sale story */}
          {deal.saleStory && (
            <p className={cn("text-base font-bold mb-2", DEAL_TYPE_CONFIG[deal.dealType].textColor)}>
              {deal.saleStory}
            </p>
          )}

          {/* Price text */}
          {deal.priceText && (
            <p className="text-sm text-muted mb-3">{deal.priceText}</p>
          )}

          {/* Description */}
          {deal.description && (
            <p className="text-sm text-foreground/70 leading-relaxed mb-4">
              {deal.description}
            </p>
          )}

          {/* Valid dates */}
          <div className="bg-cream rounded-xl p-3 mb-5">
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="text-[10px] font-semibold text-muted/60 uppercase tracking-wider mb-0.5">
                  Valid
                </p>
                <p className="font-semibold text-foreground">
                  {formatDate(deal.validFrom)} - {formatDate(deal.validTo)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold text-muted/60 uppercase tracking-wider mb-0.5">
                  Time left
                </p>
                <p
                  className={cn(
                    "font-bold",
                    expired
                      ? "text-gray-400"
                      : expiringSoon
                        ? "text-amber-600"
                        : "text-publix-green"
                  )}
                >
                  {expired
                    ? "Expired"
                    : days === 0
                      ? "Last day!"
                      : `${days} day${days !== 1 ? "s" : ""}`}
                </p>
              </div>
            </div>
          </div>

          {/* Clip coupon — only for coupon deals */}
          {deal.dealType === "coupon" && (
            <div className="mb-3 space-y-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(cleanName);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className={cn(
                  "w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] border-2",
                  copied
                    ? "bg-purple-50 border-purple-300 text-purple-700"
                    : "bg-purple-50 border-purple-200 text-purple-700 hover:border-purple-300"
                )}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? `"${cleanName}" copied!` : `Copy "${cleanName}" to search`}
              </button>
              <a
                href="https://www.publix.com/savings/digital-coupons"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] bg-purple-600 text-white shadow-lg shadow-purple-600/25"
              >
                <ExternalLink size={18} />
                Open Publix Digital Coupons
              </a>
            </div>
          )}

          {/* Action button */}
          <button
            onClick={onToggleWatch}
            className={cn(
              "w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
              isWatched
                ? "bg-red-50 text-red-600 border-2 border-red-200"
                : "bg-publix-green text-white shadow-lg shadow-publix-green/25"
            )}
          >
            {isWatched ? (
              <>
                <HeartOff size={18} />
                Remove from Shopping List
              </>
            ) : (
              <>
                <Heart size={18} />
                Add to Shopping List
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
