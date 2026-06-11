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

function marketplaceLabel(marketplace: Product["marketplace"]): string {
  const labels: Record<Product["marketplace"], string> = {
    AliExpress: "AliExpress",
    Amazon: "Amazon",
    Taobao: "Taobao",
    Wildberries: "Wildberries",
    OpenFoodFacts: "OpenFood",
    OpenBeautyFacts: "OpenBeauty",
    OpenProductsFacts: "OpenProducts",
  };
  return labels[marketplace];
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
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
      <Link href={`/product/${product.id}`} className="relative block aspect-[4/3] overflow-hidden bg-white">
        <ProductVisual product={product} className="h-full w-full" />

        {discountPct > 0 && (
          <span className="absolute left-2 top-2 rounded-md bg-rose-600 px-1.5 py-0.5 text-[10px] font-black text-white shadow-sm">
            -{discountPct}%
          </span>
        )}

        <span
          aria-hidden="true"
          className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/95 text-stone-400 shadow-sm ring-1 ring-black/5 transition hover:text-rose-600"
        >
          <Heart size={14} />
        </span>

        <span className="absolute bottom-2 left-2 max-w-[80%] truncate rounded-full bg-stone-950/70 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
          {product.source_url ? "real · " : ""}
          {marketplaceLabel(product.marketplace)}
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-2.5">
        <h3 className="line-clamp-2 min-h-[34px] text-[13px] font-bold leading-[17px] text-stone-900">
          {product.name}
        </h3>

        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          <span className="text-[17px] font-black leading-none text-stone-950">
            {formatPrice(price, currency, locale)}
          </span>
          <span className="text-[11px] font-semibold text-stone-400 line-through">
            {formatPrice(product.price_individual, currency, locale)}
          </span>
        </div>

        <p className={`text-[10px] font-black ${isDone || isExpired ? "text-stone-500" : "text-emerald-600"}`}>
          {isExpired ? "истекло" : isDone ? "цена зафиксирована" : `AI ${prob}% закрытия`}
        </p>

        <GroupProgress product={product} group={group} />

        <Link
          href={`/product/${product.id}`}
          className={`mt-auto inline-flex h-8 w-full items-center justify-center gap-1 rounded-md text-xs font-black transition ${
            isExpired
              ? "bg-stone-200 text-stone-500"
              : isDone
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
              : "bg-stone-950 text-white hover:bg-primary"
          }`}
        >
          <Users size={12} />
          {isExpired ? "Истекло" : isDone ? "Цена открыта" : spotsLeft <= 2 ? `Осталось ${spotsLeft}!` : "Войти в команду"}
        </Link>
      </div>
    </article>
  );
}
