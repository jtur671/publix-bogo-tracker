import { createClient } from "@/lib/supabase/client";
import type { StoreConfig } from "@/types";

const DEFAULT_ZIP = "34695";

export async function getStoreConfig(): Promise<StoreConfig> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .single();

  if (error || !data) {
    return {
      id: "default",
      zip_code: DEFAULT_ZIP,
      store_name: null,
      updated_at: new Date().toISOString(),
    };
  }

  return data;
}

export async function updateZipCode(zipCode: string): Promise<StoreConfig> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("settings")
    .upsert(
      {
        user_id: user.id,
        zip_code: zipCode,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}
