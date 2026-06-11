import Link from "next/link";
import { Flame, Send, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { GroupProgress } from "@/components/product/GroupProgress";
import { ProductVisual } from "@/components/product/ProductVisual";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
import type { Currency, Group, Product } from "@/types";
import { calculateGroupPrice, formatPrice } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  group?: Group | null;
  currency: Currency;
}

export function ProductCard({ product, group = null, currency }: ProductCardProps) {
  const price = group?.price_current ?? calculateGroupPrice(product, group?.current_members ?? Math.ceil(product.group_threshold * 0.55));
  const locale = currency === "USD" ? "en-US" : "ru-KZ";
  const saved = product.price_individual - price;
  const members = group?.current_members ?? Math.ceil(product.group_threshold * 0.55);
  const threshold = group?.threshold ?? product.group_threshold;
  const spotsLeft = Math.max(threshold - members, 0);
  const sold = 318 + product.id.charCodeAt(product.id.length - 1) * 7;

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-lg border border-red-100 bg-white shadow-sm">
      <Link href={`/product/${product.id}`} className="relative aspect-square overflow-hidden bg-red-50">
        <div className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-[11px] font-black text-white shadow">
          <Flame size={13} />
          ХИТ
        </div>
        <div className="absolute bottom-2 right-2 z-10 rounded-full bg-black/60 px-2 py-1 text-[11px] font-semibold text-white">{sold} купили</div>
        <ProductVisual product={product} className="h-full w-full" />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-2.5">
        <div className="flex items-center justify-between gap-2">
          <Badge tone="coral">{product.marketplace}</Badge>
          <span className="text-[11px] font-bold text-stone-500">
            {group?.expires_at ? <CountdownTimer expiresAt={group.expires_at} /> : "24ч"}
          </span>
        </div>
        <h3 className="line-clamp-2 min-h-10 text-[13px] font-extrabold leading-tight text-ink">{product.name}</h3>
        <div>
          <p className="text-[11px] font-semibold text-stone-400 line-through">одному {formatPrice(product.price_individual, currency, locale)}</p>
          <div className="flex items-end gap-1">
            <span className="text-[11px] font-black text-primary">командой</span>
            <p className="text-xl font-black leading-none text-primary transition-all duration-500">{formatPrice(price, currency, locale)}</p>
          </div>
          <p className="mt-1 inline-flex rounded bg-coupon px-1.5 py-0.5 text-[11px] font-black text-ink">минус {formatPrice(saved, currency, locale)}</p>
        </div>
        <GroupProgress product={product} group={group} />
        <Link
          href={`/product/${product.id}`}
          className="mt-auto inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-black text-white shadow-glow transition hover:bg-red-600"
        >
          {spotsLeft <= 1 ? <Flame size={15} /> : <Users size={15} />}
          {spotsLeft === 0 ? "Цена открыта" : `Добить ${spotsLeft} мест`}
        </Link>
        <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-stone-500">
          <Send size={12} />
          Telegram invite снижает цену
        </div>
      </div>
    </article>
  );
}
