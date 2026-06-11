import Link from "next/link";
import { Heart, Users } from "lucide-react";
import { GroupProgress } from "@/components/product/GroupProgress";
import { ProductVisual } from "@/components/product/ProductVisual";
import type { Currency, Group, Product } from "@/types";
import { calculateGroupPrice, formatPrice, isGroupExpired } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  group?: Group | null;
  currency: Currency;
}

function successProb(group: Group | null | undefined): number {
  if (!group) return 55;
  if (group.status === "completed") return 100;
  if (isGroupExpired(group)) return 0;
  const ratio = group.current_members / group.threshold;
  const msLeft = new Date(group.expires_at).getTime() - Date.now();
  const timeFactor = Math.min(Math.max(msLeft / 3_600_000, 0) / 48, 1) * 15;
  return Math.min(96, Math.round(ratio * 72 + timeFactor + 10));
}

export function ProductCard({ product, group = null, currency }: ProductCardProps) {
  const price =
    group?.price_current ??
    calculateGroupPrice(product, Math.ceil(product.group_threshold * 0.55));
  const locale = currency === "USD" ? "en-US" : "ru-KZ";
  const members = group?.current_members ?? Math.ceil(product.group_threshold * 0.55);
  const threshold = group?.threshold ?? product.group_threshold;
  const spotsLeft = Math.max(threshold - members, 0);
  const discountPct = Math.round(((product.price_individual - price) / product.price_individual) * 100);
  const prob = successProb(group);
  const isDone = group?.status === "completed";
  const isExpired = isGroupExpired(group);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
      {/* Image */}
      <Link href={`/product/${product.id}`} className="relative block aspect-square overflow-hidden bg-stone-100">
        <ProductVisual product={product} className="h-full w-full" />

        {/* Discount badge */}
        {discountPct > 0 && (
          <span className="absolute left-2 top-2 rounded-lg bg-primary px-2 py-0.5 text-[11px] font-black text-white shadow-sm">
            -{discountPct}%
          </span>
        )}

        {/* Heart */}
        <span
          aria-hidden="true"
          className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-stone-400 shadow-sm backdrop-blur-sm transition hover:text-red-500"
        >
          <Heart size={14} />
        </span>

        {/* Marketplace chip bottom */}
        <span className="absolute bottom-2 left-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
          {product.marketplace}
        </span>
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1.5 p-2.5">
        <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-stone-800">
          {product.name}
        </h3>

        {/* Prices */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-base font-black text-primary">
            {formatPrice(price, currency, locale)}
          </span>
          <span className="text-xs text-stone-400 line-through">
            {formatPrice(product.price_individual, currency, locale)}
          </span>
        </div>

        {/* AI or done badge */}
        <p className={`text-[10px] font-semibold ${isDone || isExpired ? "text-stone-500" : "text-emerald-600"}`}>
          {isExpired ? "⏱ Команда истекла" : isDone ? "✓ Цена зафиксирована" : `✦ AI: ${prob}% шанс закрытия`}
        </p>

        {/* Progress */}
        <GroupProgress product={product} group={group} />

        {/* CTA */}
        <Link
          href={`/product/${product.id}`}
          className={`mt-auto inline-flex h-8 w-full items-center justify-center gap-1 rounded-lg text-xs font-black text-white transition ${
            isExpired ? "bg-stone-400" : isDone ? "bg-emerald-500 hover:bg-emerald-600" : "bg-primary hover:bg-red-600"
          }`}
        >
          <Users size={12} />
          {isExpired ? "Истекло" : isDone ? "Цена открыта" : spotsLeft <= 2 ? `Осталось ${spotsLeft}!` : "Войти в команду"}
        </Link>
      </div>
    </article>
  );
}
