"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useStoreConfig } from "@/hooks/use-store-config";
import type { Deal } from "@/types";

interface DealsContextValue {
  deals: Deal[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  zipCode: string;
}

const DealsContext = createContext<DealsContextValue | null>(null);

export function DealsProvider({ children }: { children: ReactNode }) {
  const { zipCode } = useStoreConfig();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeals = useCallback(async () => {
    if (!zipCode) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/deals?zip=${zipCode}`);
      if (!res.ok) throw new Error("Failed to fetch deals");
      const data = await res.json();
      setDeals(data.deals);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [zipCode]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  return (
    <DealsContext.Provider
      value={{ deals, loading, error, refetch: fetchDeals, zipCode }}
    >
      {children}
    </DealsContext.Provider>
  );
}

/**
 * Consume the shared deals context. Must be used within a DealsProvider.
 * Replaces direct useDeals() calls across pages to eliminate redundant API hits.
 */
export function useDealsContext(): DealsContextValue {
  const ctx = useContext(DealsContext);
  if (!ctx) {
    throw new Error("useDealsContext must be used within a DealsProvider");
  }
  return ctx;
}
