import clsx, { type ClassValue } from "clsx";
import type { Currency, Group, Product } from "@/types";

const EXCHANGE_RATES: Record<Currency, number> = {
  USD: 1,
  KZT: Number(import.meta.env.VITE_KZT_PER_USD) || 450,
  RUB: Number(import.meta.env.VITE_RUB_PER_USD) || 90
};

/** Polling cadences (ms), overridable via env. */
export const GROUP_POLL_MS = Number(import.meta.env.VITE_GROUP_POLL_MS) || 3000;
export const NOTIFY_POLL_MS = Number(import.meta.env.VITE_NOTIFY_POLL_MS) || 8000;

export function cn(...values: ClassValue[]): string {
  return clsx(values);
}

/** Pretty-print a KZ mobile number as you type: "+7 700 123 45 67". */
export function formatKzPhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("8")) digits = "7" + digits.slice(1);
  if (!digits.startsWith("7")) digits = "7" + digits;
  digits = digits.slice(0, 11);
  const rest = digits.slice(1); // the 10 national digits (7XX XXX XX XX)
  let out = "+7";
  if (rest.length) out += " " + rest.slice(0, 3);
  if (rest.length > 3) out += " " + rest.slice(3, 6);
  if (rest.length > 6) out += " " + rest.slice(6, 8);
  if (rest.length > 8) out += " " + rest.slice(8, 10);
  return out;
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
