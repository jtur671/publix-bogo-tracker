"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Plus, Search, ChevronDown, ChevronUp } from "lucide-react";
import type { Deal, ShoppingTripItem } from "@/types";
import { cn } from "@/lib/utils";

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
  isBogo: boolean;
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
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const uncheckedItems = useMemo(() => {
    const unchecked = items.filter((i) => !i.checked);
    // BOGO items first
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

  const bogoMatches = useMemo(() => {
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
    if (bogoMatches.length === 0) return searchResults;
    const bogoNames = new Set(bogoMatches.map((d) => d.name.toLowerCase()));
    return searchResults.filter(
      (r) => !bogoNames.has(r.name.toLowerCase())
    );
  }, [searchResults, bogoMatches]);

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

        const bogoNames = new Set(deals.map((d) => d.name.toLowerCase()));
        const results: SearchResult[] = (data.results || [])
          .slice(0, 6)
          .map((r: Deal) => ({
            id: r.id,
            name: r.name,
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

  // Show results immediately when BOGO matches exist
  useEffect(() => {
    if (inputValue.trim().length >= 2 && bogoMatches.length > 0) {
      setShowResults(true);
    }
  }, [inputValue, bogoMatches]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onAddItem(inputValue.trim());
      setInputValue("");
      setShowResults(false);
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    const keyword = result.name.replace(/\s*BOGO\*?\s*$/i, "").trim();
    onAddItem(keyword);
    setInputValue("");
    setShowResults(false);
  };

  const handleSelectBogoDeal = (deal: Deal) => {
    const name = deal.name.replace(/\s*BOGO\*?\s*$/i, "").trim();
    onAddItem(name);
    setInputValue("");
    setShowResults(false);
  };

  const handleRowTap = (item: ShoppingTripItem) => {
    if (editMode) return;
    // Haptic feedback
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10);
    }
    onToggleItem(item.id);
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
              data-testid="done-button"
            >
              Done
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
                  if (searchResults.length > 0 || bogoMatches.length > 0)
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
            (bogoMatches.length > 0 || !searching) && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowResults(false)}
              />
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl border border-gray-200 shadow-lg z-20 overflow-hidden max-h-[400px] overflow-y-auto">
                {/* BOGO Deals section */}
                {bogoMatches.length > 0 && (
                  <>
                    <div className="px-4 py-2 bg-green-50 border-b border-green-100">
                      <span className="text-xs font-bold text-green-700 uppercase tracking-wide">
                        BOGO Deals
                      </span>
                    </div>
                    {bogoMatches.map((deal) => (
                      <button
                        key={deal.id}
                        onClick={() => handleSelectBogoDeal(deal)}
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
                          {deal.name.replace(/\s*BOGO\*?\s*$/i, "").trim()}
                        </span>
                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                          BOGO
                        </span>
                        <Plus
                          size={18}
                          className="text-gray-400 flex-shrink-0"
                        />
                      </button>
                    ))}
                  </>
                )}

                {/* All Products divider */}
                {bogoMatches.length > 0 &&
                  filteredSearchResults.length > 0 &&
                  !searching && (
                    <div className="px-4 py-2 bg-gray-50 border-y border-gray-100">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        All Products
                      </span>
                    </div>
                  )}

                {/* Loading indicator for search results */}
                {searching && bogoMatches.length > 0 && (
                  <div className="px-4 py-3 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-publix-green rounded-full animate-spin" />
                  </div>
                )}

                {/* Flipp search results */}
                {!searching && (
                  <>
                    {filteredSearchResults.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleSelectResult(result)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                      >
                        <span className="text-base text-gray-900 flex-1">
                          {result.name}
                        </span>
                        {result.isBogo && bogoMatches.length === 0 && (
                          <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                            BOGO
                          </span>
                        )}
                        <Plus
                          size={18}
                          className="text-gray-400 flex-shrink-0"
                        />
                      </button>
                    ))}
                    {filteredSearchResults.length === 0 &&
                      bogoMatches.length === 0 && (
                        <div className="px-4 py-3 text-center text-sm text-gray-500">
                          No products found
                        </div>
                      )}
                  </>
                )}

                <button
                  onClick={handleSubmit as () => void}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left border-t border-gray-100"
                >
                  <Plus size={18} className="text-publix-green" />
                  <span className="text-base font-semibold text-publix-green">
                    Add &ldquo;{inputValue.trim()}&rdquo;
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Item list */}
      <div className="flex-1 px-4 py-3">
        {/* Unchecked items */}
        <div className="space-y-1" role="list" aria-label="Shopping items">
          {uncheckedItems.map((item) => (
            <div
              key={item.id}
              role="listitem"
              className="shop-item-enter"
            >
              <button
                onClick={() => handleRowTap(item)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3.5 rounded-2xl active:bg-gray-50 transition-colors",
                  "min-h-[56px]"
                )}
                disabled={editMode}
              >
                {/* Checkbox */}
                <div className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center flex-shrink-0" />
                {/* Item name */}
                <span className="text-lg font-medium text-gray-900 flex-1 text-left">
                  {item.name}
                </span>
                {/* BOGO pill */}
                {item.has_bogo && (
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0">
                    BOGO
                  </span>
                )}
                {/* Remove button in edit mode */}
                {editMode && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveItem(item.id);
                    }}
                    className="text-red-500 text-sm font-semibold px-2 py-1 rounded-lg hover:bg-red-50 flex-shrink-0"
                  >
                    Remove
                  </button>
                )}
              </button>
            </div>
          ))}
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
                    <button
                      onClick={() => handleRowTap(item)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-3.5 rounded-2xl active:bg-gray-50 transition-colors",
                        "min-h-[56px] opacity-50"
                      )}
                      disabled={editMode}
                    >
                      {/* Checked checkbox */}
                      <div className="w-8 h-8 rounded-full bg-publix-green flex items-center justify-center flex-shrink-0">
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
                      </div>
                      {/* Item name with strikethrough */}
                      <span className="text-lg font-medium text-gray-400 flex-1 text-left shop-strike">
                        {item.name}
                      </span>
                      {item.has_bogo && (
                        <span className="bg-gray-100 text-gray-400 text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0">
                          BOGO
                        </span>
                      )}
                      {editMode && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveItem(item.id);
                          }}
                          className="text-red-500 text-sm font-semibold px-2 py-1 rounded-lg hover:bg-red-50 flex-shrink-0"
                        >
                          Remove
                        </button>
                      )}
                    </button>
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
      </div>
    </div>
  );
}
