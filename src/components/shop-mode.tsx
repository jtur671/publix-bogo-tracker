"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Plus, Search, ChevronDown, ChevronUp, ChevronRight, Tag } from "lucide-react";
import { AdSlot } from "@/components/ad-slot";
import type { Deal, DealType, ShoppingTripItem } from "@/types";
import { cn } from "@/lib/utils";
import { cleanDealSuffix, DEAL_TYPE_CONFIG, expandKeywords, dealNameMatchesAny } from "@/lib/deal-type";

interface ShopModeProps {
  items: ShoppingTripItem[];
  deals: Deal[];
  zipCode: string;
  onToggleItem: (id: string) => void;
  onAddItem: (name: string) => void;
  onRemoveItem: (id: string) => void;
  onDone: () => void;
}

interface SearchResult {
  id: number;
  name: string;
  dealType: DealType | null;
}

export function ShopMode({
  items,
  deals,
  zipCode,
  onToggleItem,
  onAddItem,
  onRemoveItem,
  onDone,
}: ShopModeProps) {
  const [inputValue, setInputValue] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showBought, setShowBought] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const uncheckedItems = useMemo(() => {
    const unchecked = items.filter((i) => !i.checked);
    // Items with deals first
    return unchecked.sort((a, b) => {
      if (a.has_bogo && !b.has_bogo) return -1;
      if (!a.has_bogo && b.has_bogo) return 1;
      return 0;
    });
  }, [items]);

  const checkedItems = useMemo(
    () => items.filter((i) => i.checked),
    [items]
  );

  const dealMatches = useMemo(() => {
    const query = inputValue.trim().toLowerCase();
    if (query.length < 2) return [];
    const seen = new Set<string>();
    return deals
      .filter((d) => {
        const key = d.name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return (
          key.includes(query) ||
          d.description.toLowerCase().includes(query)
        );
      })
      .slice(0, 10);
  }, [inputValue, deals]);

  const filteredSearchResults = useMemo(() => {
    if (dealMatches.length === 0) return searchResults;
    const matchedNames = new Set(dealMatches.map((d) => d.name.toLowerCase()));
    return searchResults.filter(
      (r) => !matchedNames.has(r.name.toLowerCase())
    );
  }, [searchResults, dealMatches]);

  const totalCount = items.length;
  const checkedCount = checkedItems.length;

  // Search with debounce
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

        const dealsByName = new Map(deals.map((d) => [d.name.toLowerCase(), d]));
        const results: SearchResult[] = (data.results || [])
          .slice(0, 6)
          .map((r: Deal) => {
            const match = dealsByName.get(r.name.toLowerCase());
            return {
              id: r.id,
              name: r.name,
              dealType: match?.dealType ?? null,
            };
          });

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

  // Show results immediately when deal matches exist
  useEffect(() => {
    if (inputValue.trim().length >= 2 && dealMatches.length > 0) {
      setShowResults(true);
    }
  }, [inputValue, dealMatches]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onAddItem(inputValue.trim());
      setInputValue("");
      setShowResults(false);
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    const keyword = cleanDealSuffix(result.name);
    onAddItem(keyword);
    setInputValue("");
    setShowResults(false);
  };

  const handleSelectDeal = (deal: Deal) => {
    const name = cleanDealSuffix(deal.name);
    onAddItem(name);
    setInputValue("");
    setShowResults(false);
  };

  const getMatchingDeals = useCallback(
    (itemName: string): Deal[] => {
      const keywords = expandKeywords(itemName);
      if (keywords.length === 0) return [];

      // Direct matches (including aliases)
      const direct = deals.filter((d) => dealNameMatchesAny(d.name, keywords));

      // For multi-word keywords, find sibling deals by product type
      const words = keywords[0].split(/\s+/);
      if (words.length >= 2) {
        const directIds = new Set(direct.map((d) => d.id));
        const others = deals.filter((d) => !directIds.has(d.id));

        for (let i = 1; i < words.length; i++) {
          const phrase = words.slice(i).join(" ");
          if (phrase.length < 3) continue;
          const siblings = others.filter((d) => dealNameMatchesAny(d.name, [phrase]));
          if (siblings.length > 0) {
            return [...direct, ...siblings];
          }
        }
      }

      return direct;
    },
    [deals]
  );

  const handleCheckOff = (item: ShoppingTripItem) => {
    if (editMode) return;
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10);
    }
    setExpandedItemId(null);
    onToggleItem(item.id);
  };

  const handleRowTap = (item: ShoppingTripItem) => {
    if (editMode) return;
    if (item.has_bogo) {
      setExpandedItemId((prev) => (prev === item.id ? null : item.id));
    } else {
      handleCheckOff(item);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-white z-30 border-b border-gray-100 safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Shopping Mode</h1>
            <p className="text-sm text-gray-500" data-testid="item-count">
              {checkedCount} of {totalCount}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={() => setEditMode(!editMode)}
                className="text-sm font-semibold text-gray-500 px-3 py-2 rounded-xl hover:bg-gray-50 active:scale-95 transition-all"
              >
                {editMode ? "Done Editing" : "Edit"}
              </button>
            )}
            <button
              onClick={onDone}
              className="bg-publix-green text-white text-sm font-bold px-5 py-2 rounded-xl hover:bg-publix-green-dark active:scale-95 transition-all"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Quick-add input */}
      <div className="sticky top-[60px] bg-white z-20 px-4 py-2 border-b border-gray-50">
        <div className="relative">
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-4 py-3">
              {searching ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-publix-green rounded-full animate-spin flex-shrink-0" />
              ) : (
                <Search size={20} className="text-gray-400 flex-shrink-0" />
              )}
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0 || dealMatches.length > 0)
                    setShowResults(true);
                }}
                placeholder="Add an item..."
                className="flex-1 text-base bg-transparent outline-none placeholder:text-gray-400"
                aria-label="Add item to shopping list"
              />
              {inputValue.trim() && (
                <button
                  type="submit"
                  className="bg-publix-green text-white text-sm font-bold px-4 py-1.5 rounded-xl active:scale-95 transition-all flex-shrink-0"
                >
                  Add
                </button>
              )}
            </div>
          </form>

          {/* Search results dropdown */}
          {showResults &&
            inputValue.trim().length >= 2 &&
            (dealMatches.length > 0 || !searching) && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowResults(false)}
              />
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl border border-gray-200 shadow-lg z-20 overflow-hidden max-h-[400px] overflow-y-auto">
                {/* Generic add option */}
                <button
                  onClick={handleSubmit as () => void}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left border-b border-gray-100"
                >
                  <Plus size={18} className="text-publix-green" />
                  <span className="text-base font-semibold text-publix-green">
                    Add &ldquo;{inputValue.trim()}&rdquo;
                  </span>
                </button>

                {/* Current Deals section */}
                {dealMatches.length > 0 && (
                  <>
                    <div className="px-4 py-2 bg-green-50 border-y border-green-100">
                      <span className="text-xs font-bold text-green-700 uppercase tracking-wide">
                        Current Deals
                      </span>
                    </div>
                    {dealMatches.map((deal) => (
                      <button
                        key={deal.id}
                        onClick={() => handleSelectDeal(deal)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                      >
                        {deal.imageUrl && (
                          <img
                            src={deal.imageUrl}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-gray-100"
                          />
                        )}
                        <span className="text-base text-gray-900 flex-1">
                          {cleanDealSuffix(deal.name)}
                        </span>
                        <span className={cn(
                          "text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0",
                          deal.dealType === "bogo" ? "bg-green-100 text-green-700" :
                          deal.dealType === "sale" ? "bg-amber-100 text-amber-700" :
                          "bg-purple-100 text-purple-700"
                        )}>
                          {DEAL_TYPE_CONFIG[deal.dealType].label}
                        </span>
                        <Plus
                          size={18}
                          className="text-gray-400 flex-shrink-0"
                        />
                      </button>
                    ))}
                  </>
                )}

                {/* Loading indicator for search results */}
                {searching && (
                  <div className="px-4 py-3 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-publix-green rounded-full animate-spin" />
                  </div>
                )}

                {!searching && filteredSearchResults.length === 0 &&
                  dealMatches.length === 0 && (
                    <div className="px-4 py-3 text-center text-sm text-gray-500">
                      No products found
                    </div>
                  )}

                {/* All Products */}
                {!searching && filteredSearchResults.length > 0 && (
                  <>
                    <div className="px-4 py-2 bg-gray-50 border-y border-gray-100">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        All Products
                      </span>
                    </div>
                    {filteredSearchResults.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleSelectResult(result)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                      >
                        <span className="text-base text-gray-900 flex-1">
                          {result.name}
                        </span>
                        {result.dealType && dealMatches.length === 0 && (
                          <span className={cn(
                            "text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0",
                            result.dealType === "bogo" ? "bg-green-100 text-green-700" :
                            result.dealType === "sale" ? "bg-amber-100 text-amber-700" :
                            "bg-purple-100 text-purple-700"
                          )}>
                            {DEAL_TYPE_CONFIG[result.dealType].label}
                          </span>
                        )}
                        <Plus
                          size={18}
                          className="text-gray-400 flex-shrink-0"
                        />
                      </button>
                    ))}
                  </>
                )}

              </div>
            </>
          )}
        </div>
      </div>

      {/* Item list */}
      <div className="flex-1 px-4 py-3">
        {/* Unchecked items */}
        <div className="space-y-1" role="list" aria-label="Shopping items">
          {uncheckedItems.map((item) => {
            const isExpanded = expandedItemId === item.id;
            const matchingDeals = isExpanded ? getMatchingDeals(item.name) : [];

            return (
              <div
                key={item.id}
                role="listitem"
                className="shop-item-enter"
              >
                <div
                  className={cn(
                    "rounded-2xl transition-colors",
                    isExpanded && "bg-green-50/50"
                  )}
                >
                  <div className={cn(
                    "w-full flex items-center gap-3 px-3 py-3.5 min-h-[56px]",
                    editMode && "pointer-events-none"
                  )}>
                    {/* Checkbox — tapping checks off */}
                    <button
                      onClick={() => handleCheckOff(item)}
                      className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
                      aria-label={`Check off ${item.name}`}
                    />
                    {/* Item name + deal pill — tapping expands deals */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => !editMode && handleRowTap(item)}
                      className="flex-1 flex items-center gap-3 cursor-pointer"
                    >
                      <span className="text-lg font-medium text-gray-900 flex-1 text-left">
                        {item.name}
                      </span>
                      {item.has_bogo && (
                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 flex items-center gap-1">
                          Deal
                          <ChevronRight
                            size={12}
                            className={cn(
                              "transition-transform duration-200",
                              isExpanded && "rotate-90"
                            )}
                          />
                        </span>
                      )}
                    </div>
                    {/* Remove button in edit mode */}
                    {editMode && (
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="text-red-500 text-sm font-semibold px-2 py-1 rounded-lg hover:bg-red-50 flex-shrink-0 pointer-events-auto"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {/* Expanded matching deals */}
                  {isExpanded && matchingDeals.length > 0 && (
                    <div className="px-3 pb-3">
                      <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2 px-1">
                        {matchingDeals.length} matching deal{matchingDeals.length !== 1 ? "s" : ""}
                      </p>
                      <div className="space-y-2">
                        {matchingDeals.map((deal) => (
                          <div
                            key={deal.id}
                            className="flex items-center gap-3 bg-white rounded-xl p-2.5 border border-green-100"
                          >
                            {deal.imageUrl ? (
                              <img
                                src={deal.imageUrl}
                                alt=""
                                className="w-14 h-14 rounded-lg object-cover flex-shrink-0 bg-gray-100"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                <Tag size={18} className="text-gray-300" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2">
                                {cleanDealSuffix(deal.name)}
                              </p>
                              {deal.saleStory && (
                                <p className={cn("text-xs mt-0.5 line-clamp-1", DEAL_TYPE_CONFIG[deal.dealType].textColor)}>
                                  {deal.saleStory}
                                </p>
                              )}
                              <span className={cn(
                                "text-[10px] font-bold mt-0.5 inline-block",
                                DEAL_TYPE_CONFIG[deal.dealType].textColor
                              )}>
                                {DEAL_TYPE_CONFIG[deal.dealType].label}
                              </span>
                              <span className={cn(
                                "text-[10px] mt-0.5 inline-block ml-1.5",
                                deal.daysLeft <= 2 ? "text-red-500 font-semibold" : "text-gray-400"
                              )}>
                                · {deal.daysLeft <= 0 ? "Expires today" : `${deal.daysLeft}d left`}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Checked items section */}
        {checkedCount > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setShowBought(!showBought)}
              className="flex items-center gap-2 px-3 py-2 w-full"
              data-testid="bought-divider"
            >
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-sm font-semibold text-gray-400">
                Bought ({checkedCount})
              </span>
              {showBought ? (
                <ChevronUp size={16} className="text-gray-400" />
              ) : (
                <ChevronDown size={16} className="text-gray-400" />
              )}
              <div className="h-px flex-1 bg-gray-200" />
            </button>

            {showBought && (
              <div className="space-y-1" role="list" aria-label="Bought items">
                {checkedItems.map((item) => (
                  <div
                    key={item.id}
                    role="listitem"
                    className="shop-item-exit"
                  >
                    <div
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-3.5 rounded-2xl transition-colors",
                        "min-h-[56px] opacity-50",
                        editMode && "pointer-events-none"
                      )}
                    >
                      {/* Checked checkbox — tapping unchecks */}
                      <button
                        onClick={() => handleCheckOff(item)}
                        className="w-8 h-8 rounded-full bg-publix-green flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
                        aria-label={`Uncheck ${item.name}`}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          className="check-fill"
                        >
                          <path
                            d="M3 8L6.5 11.5L13 5"
                            stroke="white"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                      {/* Item name with strikethrough */}
                      <span className="text-lg font-medium text-gray-400 flex-1 text-left shop-strike">
                        {item.name}
                      </span>
                      {item.has_bogo && (
                        <span className="bg-gray-100 text-gray-400 text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0">
                          Deal
                        </span>
                      )}
                      {editMode && (
                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="text-red-500 text-sm font-semibold px-2 py-1 rounded-lg hover:bg-red-50 flex-shrink-0 pointer-events-auto"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-gray-400 text-base">
              No items yet. Add some above!
            </p>
          </div>
        )}

        {/* Ad at bottom of list */}
        <div className="mt-6 mb-4">
          <AdSlot slot="XXXXXXXXXX" format="horizontal" dismissible />
        </div>
      </div>
    </div>
  );
}
