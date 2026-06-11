import Link from "next/link";
import { Heart, Users } from "lucide-react";
import { GroupProgress } from "@/components/product/GroupProgress";
import { ProductVisual } from "@/components/product/ProductVisual";
import type { Currency, Group, Product } from "@/types";
import { calculateGroupPrice, formatPrice } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  group?: Group | null;
  currency: Currency;
}

function successProb(group: Group | null | undefined): number {
  if (!group) return 55;
  if (group.status === "completed") return 100;
  const ratio = group.current_members / group.threshold;
  const msLeft = new Date(group.expires_at).getTime() - Date.now();
  const timeFactor = Math.min(Math.max(msLeft / 3_600_000, 0) / 48, 1) * 15;
  return Math.min(96, Math.round(ratio * 72 + timeFactor + 10));
}

export function ProductCard({ product, group = null, currency }: ProductCardProps) {
  const price =
    group?.price_current ??
    calculateGroupPrice(
      product,
      group?.current_members ?? Math.ceil(product.group_threshold * 0.55)
    );
  const locale = currency === "USD" ? "en-US" : "ru-KZ";
  const members = group?.current_members ?? Math.ceil(product.group_threshold * 0.55);
  const threshold = group?.threshold ?? product.group_threshold;
  const spotsLeft = Math.max(threshold - members, 0);
  const savingsPct = Math.round(
    ((product.price_individual - price) / product.price_individual) * 100
  );
  const prob = successProb(group);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
      {/* Image area */}
      <Link
        href={`/product/${product.id}`}
        className="relative aspect-square overflow-hidden bg-white"
      >
        {/* Marketplace badge */}
        <span className="absolute left-2 top-2 z-10 rounded-full bg-stone-800/70 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
          {product.marketplace}
        </span>
        {/* Heart button */}
        <button
          className="absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-white/80 text-stone-400 shadow-sm backdrop-blur-sm"
          onClick={(e) => e.preventDefault()}
        >
          <Heart size={14} />
        </button>
        <ProductVisual product={product} className="h-full w-full" />
        {/* Group discount badge */}
        {savingsPct > 0 && (
          <span className="absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-coupon px-2.5 py-0.5 text-[10px] font-black text-ink whitespace-nowrap">
            Группа -{savingsPct}%
          </span>
        )}
      </Link>

      {/* Info area */}
      <div className="flex flex-1 flex-col p-2.5">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-stone-800">
          {product.name}
        </h3>

        {/* Price row */}
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-lg font-black leading-none text-primary">
            {formatPrice(price, currency, locale)}
          </span>
          <span className="text-xs text-stone-400 line-through">
            {formatPrice(product.price_individual, currency, locale)}
          </span>
        </div>

        {/* AI success badge */}
        <p className="mt-0.5 text-[10px] font-semibold text-emerald-600">
          ✦ AI: {prob}% шанс закрытия
        </p>

        {/* Progress bar */}
        <div className="mt-2">
          <GroupProgress product={product} group={group} />
        </div>

        {/* CTA */}
        <Link
          href={`/product/${product.id}`}
          className="mt-2 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-primary text-sm font-black text-white transition hover:bg-red-600"
        >
          <Users size={14} />
          {spotsLeft === 0 ? "Цена открыта" : "Войти в команду"}
        </Link>
      </div>
    </article>
  );
}
