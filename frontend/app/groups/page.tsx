"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowDownUp, RefreshCw, Send, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ProductVisual } from "@/components/product/ProductVisual";
import { api } from "@/lib/api";
import { DEMO_USER, useGroupBuyStore } from "@/lib/store";
import { formatPrice, isGroupExpired, savingsPct } from "@/lib/utils";
import type { GroupDetail } from "@/types";

type SortMode = "savings" | "time" | "category";

export default function GroupsPage() {
  const user = useGroupBuyStore((s) => s.userProfile) ?? DEMO_USER;
  const [items, setItems] = useState<GroupDetail[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>("savings");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const groups = await api.groups();
        const detail = await Promise.all(groups.map((g) => api.group(g.id)));
        if (!ignore) setItems(detail);
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : "Could not load groups");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (sortMode === "time")
        return (
          new Date(a.group.expires_at).getTime() - new Date(b.group.expires_at).getTime()
        );
      if (sortMode === "category")
        return a.product.category.localeCompare(b.product.category);
      return (
        savingsPct(b.product.price_individual, b.group.price_current) -
        savingsPct(a.product.price_individual, a.group.price_current)
      );
    });
  }, [items, sortMode]);

  const locale = user.currency_preference === "USD" ? "en-US" : "ru-KZ";

  return (
    <div className="mx-auto w-full max-w-6xl bg-[#f6f7f8] pb-24">
      <header className="border-b border-stone-200 bg-white px-4 py-5 shadow-sm md:px-8">
        <h1 className="text-2xl font-black text-stone-950">Групповые покупки</h1>
        <p className="mt-0.5 text-sm font-medium text-stone-500">
          Собери команду — сбей цену
        </p>
      </header>

      <section className="mx-4 mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-stone-200 bg-white p-3 shadow-sm md:mx-8">
        <ArrowDownUp size={16} className="text-stone-400" />
        {[
          ["savings", "лучшая цена"],
          ["time", "горят таймеры"],
          ["category", "категория"],
        ].map(([value, label]) => (
          <button
            key={value}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
              sortMode === value
                ? "bg-stone-950 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
            onClick={() => setSortMode(value as SortMode)}
          >
            {label}
          </button>
        ))}
      </section>

      {loading ? (
        <div className="grid min-h-80 place-items-center text-primary">
          <RefreshCw className="animate-spin" />
        </div>
      ) : error ? (
        <Card className="mx-4 border-stone-200 bg-white font-medium text-primary md:mx-8">
          {error}
        </Card>
      ) : (
        <div className="space-y-3 px-4 pt-4 md:px-8">
          {sortedItems.map(({ group, product }) => {
            const progress = (group.current_members / group.threshold) * 100;
            const pct = savingsPct(product.price_individual, group.price_current);
            const left = Math.max(group.threshold - group.current_members, 0);
            const expired = isGroupExpired(group);
            const isHot = left <= 2 && group.status === "active" && !expired;
            const statusText = expired
              ? "истекло"
              : group.status === "completed"
              ? "цена открыта"
              : "собирается";
            const actionText = expired
              ? "истекло"
              : left === 0
              ? "можно брать"
              : "позови друга";

            return (
              <Link key={group.id} href={`/product/${product.id}`} className="block">
                <Card
                  className={`grid gap-3 rounded-xl border p-3 shadow-sm transition hover:border-stone-300 sm:grid-cols-[86px_1fr_auto] sm:items-center ${
                    isHot ? "border-rose-200 bg-rose-50/30" : "border-stone-200 bg-white"
                  }`}
                >
                  <div className="relative h-24 w-24 overflow-hidden rounded-xl bg-stone-50 sm:h-[86px] sm:w-[86px]">
                    <div className={`absolute left-1 top-1 z-10 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white ${expired ? "bg-stone-500" : "bg-stone-950"}`}>
                      {expired ? "истекло" : left === 0 ? "готово" : `+${left}`}
                    </div>
                    <ProductVisual product={product} size="thumb" className="h-full w-full" />
                  </div>

                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="line-clamp-1 text-base font-bold text-stone-800">
                        {product.name}
                      </h2>
                      <Badge tone={group.status === "completed" ? "green" : expired ? "slate" : "coral"}>
                        {statusText}
                      </Badge>
                      <Badge>{product.category}</Badge>
                      {isHot && (
                        <Badge tone="coral" className="animate-pulse">
                          горит
                        </Badge>
                      )}
                    </div>
                    <ProgressBar value={progress} />
                    <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-stone-500">
                      <span className="inline-flex items-center gap-1">
                        <Users size={13} />
                        {group.current_members}/{group.threshold}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        ⏱ {expired ? "истекло" : <CountdownTimer expiresAt={group.expires_at} />}
                      </span>
                      <span className="inline-flex items-center gap-1 text-stone-700">
                        <Send size={13} />
                        {actionText}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-1.5 text-left sm:text-right">
                    <p className="text-xl font-black text-stone-950">
                      {formatPrice(group.price_current, user.currency_preference, locale)}
                    </p>
                    <p className="text-sm font-bold text-stone-500">-{pct}%</p>
                    <p className="inline-flex items-center gap-1 rounded-md bg-stone-950 px-2 py-1 text-xs font-bold text-white sm:justify-end">
                      <Trophy size={13} />
                      забрать
                    </p>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
