export type Currency = "KZT" | "USD" | "RUB";
export type Language = "ru" | "en" | "kz";
export type Marketplace = "AliExpress" | "Amazon" | "Taobao" | "Wildberries";
export type GroupStatus = "active" | "completed" | "expired";

export interface Product {
  id: string;
  name: string;
  description: string;
  marketplace: Marketplace;
  category: string;
  tags: string[];
  price_individual: number;
  price_group_min: number;
  group_threshold: number;
  image_url: string;
  rating: number;
  origin_country: string;
}

export interface Group {
  id: string;
  product_id: string;
  current_members: number;
  threshold: number;
  price_current: number;
  price_individual: number;
  expires_at: string;
  status: GroupStatus;
}

export interface User {
  id: string;
  name: string;
  city: string;
  age: number;
  interests: string[];
  budget_usd: number;
  sim_verified: boolean;
  currency_preference: Currency;
  language: Language;
}

export interface RegisterPayload {
  name: string;
  city: string;
  age: number;
  budget_usd: number;
  interests: string[];
  currency_preference: Currency;
  language: Language;
}

export interface RegisterResponse {
  user_id: string;
  token: string;
  sim_verified: boolean;
}

export interface ProductDetail {
  product: Product;
  group: Group | null;
}

export interface GroupDetail {
  group: Group;
  product: Product;
}

export interface JoinGroupResponse {
  group: Group;
  new_price: number;
  savings_pct: number;
}

export interface ApiResponse<T> {
  data: T | null;
  success: boolean;
  message: string;
  code?: number | null;
}
