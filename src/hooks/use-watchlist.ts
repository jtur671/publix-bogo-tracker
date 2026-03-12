"use client";

import { useState, useEffect, useCallback } from "react";
import type { WatchlistItem, Deal } from "@/types";

const LOCAL_KEY = "bogo-watchlist";
const CHECKED_KEY = "bogo-checked-items";

function getLocalWatchlist(): WatchlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLocalWatchlist(items: WatchlistItem[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
}

function getLocalChecked(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = JSON.parse(localStorage.getItem(CHECKED_KEY) || "[]");
    return new Set(raw as string[]);
  } catch {
    return new Set();
  }
}

function saveLocalChecked(checked: Set<string>) {
  localStorage.setItem(CHECKED_KEY, JSON.stringify([...checked]));
}

export function useWatchlist() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [useSupabase, setUseSupabase] = useState(false);

  const loadWatchlist = useCallback(async () => {
    try {
      const { getWatchlist } = await import("@/lib/watchlist");
      const data = await getWatchlist();
      setItems(data);
      setUseSupabase(true);
    } catch {
      // Supabase not configured — use localStorage
      setItems(getLocalWatchlist());
      setUseSupabase(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadWatchlist();
    setCheckedItems(getLocalChecked());
  }, [loadWatchlist]);

  const addKeyword = useCallback(
    async (keyword: string) => {
      const trimmed = keyword.toLowerCase().trim();
      if (!trimmed) return;

      if (useSupabase) {
        try {
          const { addToWatchlist } = await import("@/lib/watchlist");
          await addToWatchlist(trimmed);
          await loadWatchlist();
          return;
        } catch {
          // fall through to localStorage
        }
      }

      const existing = getLocalWatchlist();
      if (existing.some((i) => i.keyword === trimmed)) return;
      const newItem: WatchlistItem = {
        id: crypto.randomUUID(),
        keyword: trimmed,
        added_at: new Date().toISOString(),
        last_matched_deal_id: null,
        last_notified_at: null,
      };
      const updated = [newItem, ...existing];
      saveLocalWatchlist(updated);
      setItems(updated);
    },
    [useSupabase, loadWatchlist]
  );

  const removeKeyword = useCallback(
    async (id: string) => {
      if (useSupabase) {
        try {
          const { removeFromWatchlist } = await import("@/lib/watchlist");
          await removeFromWatchlist(id);
          await loadWatchlist();
          return;
        } catch {
          // fall through
        }
      }

      const updated = getLocalWatchlist().filter((i) => i.id !== id);
      saveLocalWatchlist(updated);
      setItems(updated);

      // Also remove from checked if it was checked
      const newChecked = new Set(checkedItems);
      if (newChecked.delete(id)) {
        setCheckedItems(newChecked);
        saveLocalChecked(newChecked);
      }
    },
    [useSupabase, loadWatchlist, checkedItems]
  );

  const toggleChecked = useCallback(
    (id: string) => {
      const newChecked = new Set(checkedItems);
      if (newChecked.has(id)) {
        newChecked.delete(id);
      } else {
        newChecked.add(id);
      }
      setCheckedItems(newChecked);
      saveLocalChecked(newChecked);
    },
    [checkedItems]
  );

  const clearChecked = useCallback(() => {
    setCheckedItems(new Set());
    saveLocalChecked(new Set());
  }, []);

  const isWatched = useCallback(
    (deal: Deal) => {
      return items.some((item) => {
        const kw = item.keyword.toLowerCase();
        return (
          deal.name.toLowerCase().includes(kw) ||
          deal.description.toLowerCase().includes(kw)
        );
      });
    },
    [items]
  );

  const getMatchingKeyword = useCallback(
    (deal: Deal): string | null => {
      for (const item of items) {
        const kw = item.keyword.toLowerCase();
        if (
          deal.name.toLowerCase().includes(kw) ||
          deal.description.toLowerCase().includes(kw)
        ) {
          return item.keyword;
        }
      }
      return null;
    },
    [items]
  );

  return {
    items,
    loading,
    checkedItems,
    addKeyword,
    removeKeyword,
    toggleChecked,
    clearChecked,
    isWatched,
    getMatchingKeyword,
    refetch: loadWatchlist,
  };
}
