"use client";

import { useState, useEffect, useCallback } from "react";
import { itemMatchesDeal } from "@/lib/deal-type";
import type { ShoppingTrip, ShoppingTripItem, Deal, WatchlistItem } from "@/types";

const ACTIVE_TRIP_KEY = "bogo-active-trip";
const TRIP_HISTORY_KEY = "bogo-trip-history";

function getStoredTrip(): ShoppingTrip | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACTIVE_TRIP_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveTrip(trip: ShoppingTrip | null) {
  if (trip) {
    localStorage.setItem(ACTIVE_TRIP_KEY, JSON.stringify(trip));
  } else {
    localStorage.removeItem(ACTIVE_TRIP_KEY);
  }
}

function getHistory(): ShoppingTrip[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(TRIP_HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveHistory(trips: ShoppingTrip[]) {
  localStorage.setItem(TRIP_HISTORY_KEY, JSON.stringify(trips));
}

export function useShoppingTrip(deals: Deal[] = []) {
  const [trip, setTrip] = useState<ShoppingTrip | null>(null);
  const [history, setHistory] = useState<ShoppingTrip[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load active trip + history from localStorage on mount
  useEffect(() => {
    setTrip(getStoredTrip());
    setHistory(getHistory());
    setLoaded(true);
  }, []);

  // Persist trip changes
  useEffect(() => {
    if (loaded) {
      saveTrip(trip);
    }
  }, [trip, loaded]);

  const startTrip = useCallback(
    (watchlistItems: WatchlistItem[]) => {
      const items: ShoppingTripItem[] = watchlistItems.map((wi) => ({
        id: crypto.randomUUID(),
        name: wi.keyword,
        checked: false,
        checked_at: null,
        has_bogo: deals.some((d) => itemMatchesDeal(wi.keyword, d)),
        added_at: new Date().toISOString(),
      }));

      const newTrip: ShoppingTrip = {
        id: crypto.randomUUID(),
        started_at: new Date().toISOString(),
        completed_at: null,
        items,
      };

      setTrip(newTrip);
      return newTrip;
    },
    [deals]
  );

  const addItem = useCallback(
    (name: string) => {
      if (!trip) return;
      const trimmed = name.trim();
      if (!trimmed) return;

      const newItem: ShoppingTripItem = {
        id: crypto.randomUUID(),
        name: trimmed,
        checked: false,
        checked_at: null,
        has_bogo: deals.some((d) => itemMatchesDeal(trimmed, d)),
        added_at: new Date().toISOString(),
      };

      setTrip((prev) => {
        if (!prev) return prev;
        return { ...prev, items: [...prev.items, newItem] };
      });
    },
    [trip, deals]
  );

  const toggleItem = useCallback((id: string) => {
    setTrip((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((item) =>
          item.id === id
            ? {
                ...item,
                checked: !item.checked,
                checked_at: !item.checked ? new Date().toISOString() : null,
              }
            : item
        ),
      };
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setTrip((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.filter((item) => item.id !== id),
      };
    });
  }, []);

  const endTrip = useCallback(() => {
    if (!trip) return;
    const completed: ShoppingTrip = {
      ...trip,
      completed_at: new Date().toISOString(),
    };
    const updated = [completed, ...getHistory()].slice(0, 50);
    saveHistory(updated);
    setHistory(updated);
    setTrip(null);
  }, [trip]);

  const saveTripFromItems = useCallback((items: ShoppingTripItem[]) => {
    const checkedItems = items.filter((i) => i.checked);
    if (checkedItems.length === 0) return;

    const now = new Date().toISOString();
    const newTrip: ShoppingTrip = {
      id: crypto.randomUUID(),
      started_at: now,
      completed_at: now,
      items: checkedItems,
    };
    const updated = [newTrip, ...getHistory()].slice(0, 50);
    saveHistory(updated);
    setHistory(updated);
  }, []);

  const clearHistory = useCallback(() => {
    saveHistory([]);
    setHistory([]);
  }, []);

  return {
    trip,
    history,
    loaded,
    startTrip,
    addItem,
    toggleItem,
    removeItem,
    endTrip,
    saveTripFromItems,
    clearHistory,
  };
}
