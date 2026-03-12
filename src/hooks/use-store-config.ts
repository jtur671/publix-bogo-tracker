"use client";

import { useState, useEffect, useCallback } from "react";
import type { StoreConfig } from "@/types";

const LOCAL_KEY = "bogo-zip-code";
const DEFAULT_ZIP = "34695";

export function useStoreConfig() {
  const [config, setConfig] = useState<StoreConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_KEY);
    if (stored) {
      setConfig({
        id: 1,
        zip_code: stored,
        store_name: null,
        updated_at: new Date().toISOString(),
      });
      setNeedsSetup(false);
    } else {
      setNeedsSetup(true);
    }
    setLoading(false);
  }, []);

  const updateZip = useCallback(async (zip: string) => {
    localStorage.setItem(LOCAL_KEY, zip);
    const newConfig: StoreConfig = {
      id: 1,
      zip_code: zip,
      store_name: null,
      updated_at: new Date().toISOString(),
    };
    setConfig(newConfig);
    setNeedsSetup(false);

    // Also save to Supabase for cross-device sync
    try {
      const { updateZipCode } = await import("@/lib/store-config");
      await updateZipCode(zip);
    } catch {
      // Supabase not configured yet — that's fine, localStorage works
    }
  }, []);

  const zipCode = config?.zip_code || DEFAULT_ZIP;

  return { config, zipCode, loading, needsSetup, updateZip };
}
