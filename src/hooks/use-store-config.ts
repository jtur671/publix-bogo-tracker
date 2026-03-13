"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import type { StoreConfig } from "@/types";

const LOCAL_KEY = "bogo-zip-code";
const DEFAULT_ZIP = "34695";

export function useStoreConfig() {
  const { user } = useAuth();
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
      setLoading(false);
    } else if (user) {
      // Try loading from Supabase
      import("@/lib/store-config")
        .then(({ getStoreConfig }) => getStoreConfig())
        .then((data) => {
          if (data.zip_code && data.zip_code !== DEFAULT_ZIP) {
            localStorage.setItem(LOCAL_KEY, data.zip_code);
            setConfig(data);
            setNeedsSetup(false);
          } else {
            setNeedsSetup(true);
          }
        })
        .catch(() => {
          setNeedsSetup(true);
        })
        .finally(() => setLoading(false));
    } else {
      setNeedsSetup(true);
      setLoading(false);
    }
  }, [user]);

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
    if (user) {
      try {
        const { updateZipCode } = await import("@/lib/store-config");
        await updateZipCode(zip);
      } catch {
        // Supabase save failed — localStorage is the primary store
      }
    }
  }, [user]);

  const zipCode = config?.zip_code || DEFAULT_ZIP;

  return { config, zipCode, loading, needsSetup, updateZip };
}
