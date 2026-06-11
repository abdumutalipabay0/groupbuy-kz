import clsx, { type ClassValue } from "clsx";
import type { Currency, Group, Product } from "@/types";

const EXCHANGE_RATES: Record<Currency, number> = {
  USD: 1,
  KZT: 450,
  RUB: 90
};

export function cn(...values: ClassValue[]): string {
  return clsx(values);
}

export function formatPrice(usd: number, currency: Currency, locale = "ru-KZ"): string {
  const converted = usd * EXCHANGE_RATES[currency];
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "USD" ? 2 : 0
  }).format(converted);
}

export function calculateGroupPrice(product: Product, currentMembers: number): number {
  const progress = Math.min(Math.max(currentMembers, 0), product.group_threshold) / product.group_threshold;
  const price = product.price_individual - (product.price_individual - product.price_group_min) * progress;
  return Number(Math.max(price, product.price_group_min).toFixed(2));
}

export function savingsPct(individual: number, groupPrice: number): number {
  return Math.round((1 - groupPrice / individual) * 1000) / 10;
}

export function hoursLeft(isoDate: string): string {
  const diffMs = new Date(isoDate).getTime() - Date.now();
  if (diffMs <= 0) return "0h";
  const hours = Math.floor(diffMs / 3_600_000);
  const minutes = Math.floor((diffMs % 3_600_000) / 60_000);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export function isGroupExpired(group: Group | null | undefined): boolean {
  if (!group) return false;
  if (group.status === "expired") return true;
  if (group.status !== "active") return false;
  const expiresAt = new Date(group.expires_at).getTime();
  return Number.isFinite(expiresAt) && expiresAt <= Date.now();
}

export function isGroupJoinable(group: Group | null | undefined): group is Group {
  return Boolean(
    group &&
      group.status === "active" &&
      !isGroupExpired(group) &&
      group.current_members < group.threshold
  );
}
