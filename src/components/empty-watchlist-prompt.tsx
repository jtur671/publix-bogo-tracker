"use client";

import Link from "next/link";
import { ShoppingBag, Plus, ArrowRight } from "lucide-react";

interface EmptyWatchlistPromptProps {
  /** True when user has watchlist items but none match current deals */
  hasKeywordsButNoMatches?: boolean;
}

export function EmptyWatchlistPrompt({
  hasKeywordsButNoMatches = false,
}: EmptyWatchlistPromptProps) {
  if (hasKeywordsButNoMatches) {
    return (
      <div className="bg-white rounded-2xl border border-border p-6 text-center">
        <div className="w-12 h-12 bg-publix-green-light rounded-full flex items-center justify-center mx-auto mb-3">
          <ShoppingBag size={24} className="text-publix-green" />
        </div>
        <h3 className="text-sm font-bold text-foreground">
          No matches this week
        </h3>
        <p className="text-xs text-muted mt-1.5 max-w-[260px] mx-auto leading-relaxed">
          None of your shopping list items are on sale right now. We&apos;ll notify
          you when they go on sale!
        </p>
        <div className="flex items-center justify-center gap-3 mt-4">
          <Link
            href="/watchlist"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-publix-green hover:text-publix-green-dark transition-colors"
          >
            <Plus size={14} />
            Add more items
          </Link>
          <span className="text-border">|</span>
          <Link
            href="/deals"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-publix-green hover:text-publix-green-dark transition-colors"
          >
            Browse all deals
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-border p-6 text-center">
      <div className="w-12 h-12 bg-publix-green-light rounded-full flex items-center justify-center mx-auto mb-3">
        <ShoppingBag size={24} className="text-publix-green" />
      </div>
      <h3 className="text-sm font-bold text-foreground">
        Start your shopping list
      </h3>
      <p className="text-xs text-muted mt-1.5 max-w-[260px] mx-auto leading-relaxed">
        Add items you buy regularly. We&apos;ll tag them when they go on sale so
        you never miss a deal.
      </p>
      <div className="flex items-center justify-center gap-3 mt-4">
        <Link
          href="/watchlist"
          className="inline-flex items-center gap-1.5 bg-publix-green text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-publix-green-dark transition-colors"
        >
          <Plus size={14} />
          Add items
        </Link>
        <Link
          href="/deals"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-publix-green hover:text-publix-green-dark transition-colors"
        >
          Browse deals
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
