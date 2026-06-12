export type Currency = "KZT" | "USD" | "RUB";
export type Language = "ru" | "en" | "kz";
export type Role = "buyer" | "seller";
export type Marketplace =
  | "AliExpress"
  | "Amazon"
  | "Taobao"
  | "Wildberries"
  | "OpenFoodFacts"
  | "OpenBeautyFacts"
  | "OpenProductsFacts";
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
  source_id?: string | null;
  source_url?: string | null;
  source_price?: number | null;
  source_currency?: string | null;
  source_location?: string | null;
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
  role: Role;
  phone: string;
  shop_name?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  sim_verified?: boolean;
}

export interface SimRequestResponse {
  phone: string;
  sent: boolean;
  dev_code?: string;
}

export interface RegisterRequest {
  phone: string;
  code: string;
  role: Role;
  name: string;
  password?: string;
  city?: string;
  age?: number;
  interests?: string[];
  budget_usd?: number;
  currency_preference?: Currency;
  language?: Language;
  shop_name?: string;
}

export interface SellerProductInput {
  name: string;
  description?: string;
  category: string;
  marketplace?: string;
  tags: string[];
  price_individual: number;
  price_group_min: number;
  group_threshold: number;
  image_url?: string;
  origin_country?: string;
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

export interface AiBuyerParsed {
  budget_usd: number | null;
  categories: string[];
  tags: string[];
  hints: string[];
}

export interface AiBuyerResponse {
  reply: string;
  product: Product | null;
  group: Group | null;
  created: boolean;
  parsed: AiBuyerParsed;
  ai?: "gemini" | "rules";
  from_internet?: boolean;
}

export type NotificationKind = "join" | "complete" | "info";

export interface AppNotification {
  id: string;
  text: string;
  kind: NotificationKind;
  ts: number;
  read: boolean;
  productId?: string;
}

export interface ApiResponse<T> {
  data: T | null;
  success: boolean;
  message: string;
  code?: number | null;
}
