"use client";

import { useState, useEffect, useCallback } from "react";
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

function itemMatchesDeal(name: string, deal: Deal): boolean {
  const lower = name.toLowerCase();
  return (
    deal.name.toLowerCase().includes(lower) ||
    deal.description.toLowerCase().includes(lower)
  );
}

export function useShoppingTrip(deals: Deal[] = []) {
  const [trip, setTrip] = useState<ShoppingTrip | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Load active trip from localStorage on mount
  useEffect(() => {
    setTrip(getStoredTrip());
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
    const history = getHistory();
    saveHistory([completed, ...history]);
    setTrip(null);
  }, [trip]);

  return {
    trip,
    loaded,
    startTrip,
    addItem,
    toggleItem,
    removeItem,
    endTrip,
  };
}
