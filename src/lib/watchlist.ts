import { supabase } from "./supabase";
import type { WatchlistItem } from "@/types";

export async function getWatchlist(): Promise<WatchlistItem[]> {
  const { data, error } = await supabase
    .from("watchlist")
    .select("*")
    .order("added_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function addToWatchlist(keyword: string): Promise<WatchlistItem> {
  const { data, error } = await supabase
    .from("watchlist")
    .upsert({ keyword: keyword.toLowerCase().trim() }, { onConflict: "keyword" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeFromWatchlist(id: string): Promise<void> {
  const { error } = await supabase.from("watchlist").delete().eq("id", id);
  if (error) throw error;
}

export async function updateLastMatch(
  id: string,
  dealId: number
): Promise<void> {
  const { error } = await supabase
    .from("watchlist")
    .update({ last_matched_deal_id: dealId })
    .eq("id", id);
  if (error) throw error;
}
