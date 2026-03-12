"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Plus, RotateCcw, Search } from "lucide-react";
import Image from "next/image";
import { ShoppingListItem } from "@/components/shopping-list-item";
import { cn } from "@/lib/utils";
import type { Deal, WatchlistItem } from "@/types";

interface ShoppingListProps {
  items: WatchlistItem[];
  deals: Deal[];
  checkedItems: Set<string>;
  loading: boolean;
  zipCode: string;
  onAddItem: (keyword: string) => void;
  onRemoveItem: (id: string) => void;
  onToggleChecked: (id: string) => void;
  onClearChecked: () => void;
  isWatched: (deal: Deal) => boolean;
}

interface SearchResult {
  id: number;
  name: string;
  imageUrl: string;
  saleStory: string | null;
  isBogo: boolean;
}

/**
 * Find matching BOGO deals for a shopping list keyword.
 *
 * For related/sibling deals, we try progressively shorter phrases from the
 * keyword to find the best product-type match. This ensures "string cheese"
 * finds other string cheese deals (not all cheese), while "Sara Lee Butter
 * Bread" still finds other bread deals.
 */
function findMatchingDeals(item: WatchlistItem, deals: Deal[]): Deal[] {
  const kw = item.keyword.toLowerCase().trim();

  // 1. Direct keyword matches
  const directMatches = deals.filter(
    (d) =>
      d.name.toLowerCase().includes(kw) ||
      d.description.toLowerCase().includes(kw)
  );

  // 2. Find related deals — only for 3+ word keywords (likely brand + product)
  //    Short keywords like "string cheese" or "bread" are already product types,
  //    so direct matches are the full result. Longer keywords like
  //    "Sara Lee Butter Bread" contain a brand, so we extract the product type.
  const kwWords = kw.split(/\s+/);
  if (directMatches.length > 0 && kwWords.length >= 3) {
    const directIds = new Set(directMatches.map((d) => d.id));
    const otherDeals = deals.filter((d) => !directIds.has(d.id));

    // Try progressively shorter phrases by dropping words from the front
    for (let i = 1; i < kwWords.length; i++) {
      const phrase = kwWords.slice(i).join(" ");
      if (phrase.length < 4) continue;

      const siblings = otherDeals.filter(
        (d) =>
          d.name.toLowerCase().includes(phrase) ||
          d.description.toLowerCase().includes(phrase)
      );

      if (siblings.length > 0) {
        return [...directMatches, ...siblings];
      }
    }
  }

  return directMatches;
}

export function ShoppingList({
  items,
  deals,
  checkedItems,
  loading,
  zipCode,
  onAddItem,
  onRemoveItem,
  onToggleChecked,
  onClearChecked,
}: ShoppingListProps) {
  const [inputValue, setInputValue] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Search Flipp API as user types
  const doSearch = useCallback(
    async (query: string) => {
      if (query.trim().length < 2) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      setSearching(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&zip=${zipCode}`
        );
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();

        // Check which results are BOGO
        const bogoNames = new Set(deals.map((d) => d.name.toLowerCase()));

        const results: SearchResult[] = (data.results || [])
          .slice(0, 8)
          .map((r: Deal) => ({
            id: r.id,
            name: r.name,
            imageUrl: r.imageUrl,
            saleStory: r.saleStory,
            isBogo: bogoNames.has(r.name.toLowerCase()),
          }));

        setSearchResults(results);
        setShowResults(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    },
    [zipCode, deals]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(inputValue), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputValue, doSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onAddItem(inputValue.trim());
      setInputValue("");
      setShowResults(false);
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    // Extract a clean keyword from the product name (remove "BOGO*" suffix)
    const keyword = result.name
      .replace(/\s*BOGO\*?\s*$/i, "")
      .trim();
    onAddItem(keyword);
    setInputValue("");
    setShowResults(false);
  };

  const sortedItems = useMemo(() => {
    const withDeals = items.map((item) => ({
      item,
      matchingDeals: findMatchingDeals(item, deals),
      isChecked: checkedItems.has(item.id),
    }));

    return withDeals.sort((a, b) => {
      if (a.isChecked !== b.isChecked) return a.isChecked ? 1 : -1;
      if (!a.isChecked && !b.isChecked) {
        const aHasDeal = a.matchingDeals.length > 0;
        const bHasDeal = b.matchingDeals.length > 0;
        if (aHasDeal !== bHasDeal) return aHasDeal ? -1 : 1;
      }
      return 0;
    });
  }, [items, deals, checkedItems]);

  const checkedCount = [...checkedItems].filter((id) =>
    items.some((i) => i.id === id)
  ).length;

  const bogoCount = sortedItems.filter(
    (s) => s.matchingDeals.length > 0 && !s.isChecked
  ).length;

  if (loading) {
    return (
      <div className="space-y-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-paper rounded-2xl border border-border p-3.5 flex items-center gap-3"
          >
            <div className="w-7 h-7 rounded-full skeleton" />
            <div className="flex-1 space-y-2">
              <div className="h-4 skeleton rounded-lg w-2/3" />
              <div className="h-3 skeleton rounded-lg w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Backdrop to block content when dropdown is open */}
      {showResults && !searching && inputValue.trim().length >= 2 && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowResults(false)}
        />
      )}

      {/* Search/Add input with autocomplete */}
      <div className="relative z-50">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-2.5 bg-paper rounded-2xl border-2 border-dashed border-border p-2.5 focus-within:border-publix-green focus-within:border-solid focus-within:shadow-[0_0_0_3px_rgba(59,125,35,0.1)] transition-all">
            <div className="w-8 h-8 rounded-xl bg-publix-green/10 flex items-center justify-center flex-shrink-0">
              {searching ? (
                <div className="w-4 h-4 border-2 border-publix-green/30 border-t-publix-green rounded-full animate-spin" />
              ) : (
                <Search size={15} className="text-publix-green" />
              )}
            </div>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) setShowResults(true);
              }}
              placeholder="Search products to add..."
              className="flex-1 text-sm font-medium bg-transparent outline-none placeholder:text-muted/40"
              aria-label="Search and add item to shopping list"
            />
            {inputValue.trim() && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setInputValue("");
                    setShowResults(false);
                    setSearchResults([]);
                  }}
                  className="text-muted/50 hover:text-foreground text-xs font-semibold px-2 py-1.5 rounded-xl hover:bg-cream transition-all active:scale-95"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  className="bg-publix-green text-white text-xs font-bold px-3.5 py-1.5 rounded-xl hover:bg-publix-green-dark transition-all active:scale-95"
                >
                  Add
                </button>
              </div>
            )}
          </div>
        </form>

        {/* Search results dropdown */}
        {showResults && !searching && inputValue.trim().length >= 2 && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl border border-border shadow-[0_8px_30px_-4px_rgba(0,0,0,0.15)] z-50 overflow-hidden max-h-[360px] overflow-y-auto"
          >
            {searchResults.length > 0 && (
              <div className="px-3 pt-2.5 pb-1.5">
                <p className="text-[10px] font-bold text-muted/50 uppercase tracking-wider">
                  Publix products
                </p>
              </div>
            )}
            {searchResults.length === 0 && (
              <div className="px-4 py-4 text-center">
                <p className="text-sm font-semibold text-foreground/70">
                  No products found for &ldquo;{inputValue.trim()}&rdquo;
                </p>
                <p className="text-xs text-muted/60 mt-1">
                  Not in this week&apos;s flyer — add it as a custom item below
                </p>
              </div>
            )}
            {searchResults.map((result) => (
              <button
                key={result.id}
                onClick={() => handleSelectResult(result)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-cream/80 transition-colors text-left"
              >
                {result.imageUrl ? (
                  <div className="w-10 h-10 rounded-xl bg-white border border-border/50 overflow-hidden flex-shrink-0 relative">
                    <Image
                      src={result.imageUrl}
                      alt={result.name}
                      fill
                      className="object-contain p-1"
                      sizes="40px"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-cream flex items-center justify-center flex-shrink-0">
                    <Plus size={14} className="text-muted/30" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground truncate">
                      {result.name}
                    </span>
                    {result.isBogo && (
                      <span className="bg-publix-green text-white text-[8px] font-extrabold tracking-wider uppercase px-1.5 py-0.5 rounded-md flex-shrink-0"
                        style={{ transform: "rotate(-2deg)" }}
                      >
                        BOGO
                      </span>
                    )}
                  </div>
                  {result.saleStory && (
                    <p className="text-[11px] font-bold text-publix-green mt-0.5">
                      {result.saleStory}
                    </p>
                  )}
                </div>
                <Plus size={16} className="text-publix-green/50 flex-shrink-0" />
              </button>
            ))}
            {inputValue.trim() && (
              <button
                onClick={handleSubmit as () => void}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-cream/80 transition-colors text-left border-t border-border/50"
              >
                <div className="w-10 h-10 rounded-xl bg-publix-green/10 flex items-center justify-center flex-shrink-0">
                  <Plus size={16} className="text-publix-green" />
                </div>
                <span className="text-sm font-semibold text-publix-green">
                  Add &ldquo;{inputValue.trim()}&rdquo; as custom item
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* BOGO count divider */}
      {bogoCount > 0 && sortedItems.length > 0 && (
        <div className="flex items-center gap-3 px-1">
          <div className="h-px flex-1 bg-publix-green/15" />
          <span className="text-[11px] font-bold text-publix-green uppercase tracking-wider">
            {bogoCount} on BOGO
          </span>
          <div className="h-px flex-1 bg-publix-green/15" />
        </div>
      )}

      {/* Shopping list items */}
      {sortedItems.length > 0 && (
        <div className="space-y-2" role="list" aria-label="Shopping list">
          {sortedItems.map(({ item, matchingDeals, isChecked }, i) => {
            const prevItem = i > 0 ? sortedItems[i - 1] : null;
            const showDivider =
              !isChecked &&
              matchingDeals.length === 0 &&
              prevItem &&
              !prevItem.isChecked &&
              prevItem.matchingDeals.length > 0;

            return (
              <div key={item.id} role="listitem">
                {showDivider && (
                  <div className="flex items-center gap-3 px-1 py-1">
                    <div className="h-px flex-1 bg-border/60" />
                    <span className="text-[10px] font-semibold text-muted/50 uppercase tracking-wider">
                      Other items
                    </span>
                    <div className="h-px flex-1 bg-border/60" />
                  </div>
                )}
                <ShoppingListItem
                  item={item}
                  matchingDeals={matchingDeals}
                  isChecked={isChecked}
                  onToggleChecked={() => onToggleChecked(item.id)}
                  onRemove={() => onRemoveItem(item.id)}
                  index={i}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Clear checked */}
      {checkedCount > 0 && (
        <div className="flex justify-center pt-2">
          <button
            onClick={onClearChecked}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted/60 hover:text-foreground transition-all active:scale-95 px-4 py-2 rounded-xl hover:bg-cream"
          >
            <RotateCcw size={12} />
            Uncheck all ({checkedCount})
          </button>
        </div>
      )}
    </div>
  );
}
