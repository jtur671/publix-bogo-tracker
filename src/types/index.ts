export interface FlippItem {
  id: number;
  name: string;
  description: string;
  price: string | null;
  pre_price_text: string | null;
  price_text: string | null;
  sale_story: string | null;
  image_url: string | null;
  clean_image_url: string | null;
  clipping_image_url: string | null;
  valid_from: string;
  valid_to: string;
  merchant_name: string;
  merchant_id: number;
  flyer_id: number;
  flyer_item_id: number;
  category_names: string[];
}

export type DealType = "bogo" | "sale" | "coupon";

export interface Deal {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  price: string | null;
  priceText: string | null;
  saleStory: string | null;
  validFrom: string;
  validTo: string;
  category: string;
  daysLeft: number;
  isExpiringSoon: boolean;
  merchantName: string;
  dealType: DealType;
}

export interface WatchlistItem {
  id: string;
  keyword: string;
  added_at: string;
  last_matched_deal_id: number | null;
  last_notified_at: string | null;
  user_id?: string;
}

export interface StoreConfig {
  id: number | string;
  zip_code: string;
  store_name: string | null;
  updated_at: string;
  user_id?: string;
}

export interface PushSubscription {
  id: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  created_at: string;
  user_id?: string;
}

export type Category = {
  name: string;
  icon: string;
  keywords: string[];
};

export interface ShoppingTripItem {
  id: string;
  name: string;
  checked: boolean;
  checked_at: string | null;
  has_bogo: boolean;
  added_at: string;
}

export interface ShoppingTrip {
  id: string;
  started_at: string;
  completed_at: string | null;
  items: ShoppingTripItem[];
}
