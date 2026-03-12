import { supabase } from "./supabase";
import type { StoreConfig } from "@/types";

const DEFAULT_ZIP = "34695";

export async function getStoreConfig(): Promise<StoreConfig> {
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error || !data) {
    return {
      id: 1,
      zip_code: DEFAULT_ZIP,
      store_name: null,
      updated_at: new Date().toISOString(),
    };
  }

  return data;
}

export async function updateZipCode(zipCode: string): Promise<StoreConfig> {
  const { data, error } = await supabase
    .from("settings")
    .upsert({ id: 1, zip_code: zipCode, updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) throw error;
  return data;
}
