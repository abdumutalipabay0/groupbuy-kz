"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowDownUp, RefreshCw, Send, Trophy, User, Users } from "lucide-react";
import { SimBadge } from "@/components/auth/SimBadge";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ProductVisual } from "@/components/product/ProductVisual";
import { api } from "@/lib/api";
import { DEMO_USER, useGroupBuyStore } from "@/lib/store";
import { formatPrice, savingsPct } from "@/lib/utils";
import type { GroupDetail } from "@/types";

type SortMode = "savings" | "time" | "category";

function useOnlineCount(base = 312) {
  const [count, setCount] = useState(base);
  useEffect(() => {
    const id = setInterval(() => setCount((c) => c + Math.floor(Math.random() * 7) - 3), 4500);
    return () => clearInterval(id);
  }, []);
  return Math.max(count, 200);
}

export default function GroupsPage() {
  const user = useGroupBuyStore((s) => s.userProfile) ?? DEMO_USER;
  const [items, setItems] = useState<GroupDetail[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>("savings");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const onlineCount = useOnlineCount();

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
    return () => { ignore = true; };
  }, []);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (sortMode === "time")
        return new Date(a.group.expires_at).getTime() - new Date(b.group.expires_at).getTime();
      if (sortMode === "category")
        return a.product.category.localeCompare(b.product.category);
      return (
        savingsPct(b.product.price_individual, b.group.price_current) -
        savingsPct(a.product.price_individual, a.group.price_current)
      );
    });
  }, [items, sortMode]);

  const locale = user.currency_preference === "USD" ? "en-US" : "ru-KZ";
  const totalSaved = items.reduce(
    (acc, { group, product }) => acc + (product.price_individual - group.price_current) * group.current_members,
    0
  );

  return (
    <div className="mx-auto w-full max-w-6xl pb-12">
      <header className="bg-gradient-to-b from-primary to-hotRed px-4 py-5 text-white md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-white/80">Команды, которые можно добить</p>
            <h1 className="text-3xl font-black">Закрой сделку раньше таймера</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-black">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              {onlineCount} онлайн
            </span>
            <SimBadge />
            <Link className="rounded-md bg-white px-4 py-2 text-sm font-black text-primary" href="/feed">
              Лента
            </Link>
            <Link className="grid h-9 w-9 place-items-center rounded-md bg-white/20" href="/profile">
              <User size={17} />
            </Link>
          </div>
        </div>

        {/* Stats banner */}
        <div className="mt-4 grid gap-2 md:grid-cols-4">
          {[
            ["invite_rate", "68%", "шарят сделки"],
            ["join_rate", "34%", "вступают по ссылке"],
            ["repeat", "x2.4", "возврат за купонами"],
            ["saved", formatPrice(totalSaved, "KZT", locale), "сэкономлено сегодня"],
          ].map(([key, value, label]) => (
            <div key={key} className="rounded-lg bg-white/15 p-3">
              <p className="text-2xl font-black">{value}</p>
              <p className="text-xs font-bold text-white/80">{label}</p>
            </div>
          ))}
        </div>
      </header>

      {/* Sort */}
      <section className="mx-4 mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-red-100 bg-white p-3 shadow-sm md:mx-8">
        <ArrowDownUp size={18} className="text-primary" />
        {[
          ["savings", "самая жирная цена"],
          ["time", "горят таймеры"],
          ["category", "категория"],
        ].map(([value, label]) => (
          <button
            key={value}
            className={`rounded-full px-3 py-2 text-sm font-black transition ${
              sortMode === value ? "bg-primary text-white" : "bg-red-50 text-stone-700 hover:bg-red-100"
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
        <Card className="mx-4 border-coral/30 bg-white font-bold text-primary md:mx-8">{error}</Card>
      ) : (
        <div className="space-y-3 px-4 pt-4 md:px-8">
          {sortedItems.map(({ group, product }) => {
            const progress = (group.current_members / group.threshold) * 100;
            const pct = savingsPct(product.price_individual, group.price_current);
            const left = Math.max(group.threshold - group.current_members, 0);
            const isHot = left <= 2 && group.status === "active";

            return (
              <Link key={group.id} href={`/product/${product.id}`} className="block">
                <Card
                  className={`grid gap-3 p-3 transition hover:border-primary/50 hover:bg-red-50 sm:grid-cols-[86px_1fr_auto] sm:items-center ${
                    isHot ? "border-primary/40 bg-red-50/50" : ""
                  }`}
                >
                  <div className="relative h-24 w-24 overflow-hidden rounded-md bg-red-50 sm:h-[86px] sm:w-[86px]">
                    <div className="absolute left-1 top-1 z-10 rounded bg-primary px-1.5 py-0.5 text-[10px] font-black text-white">
                      {left === 0 ? "готово" : `+${left}`}
                    </div>
                    <ProductVisual product={product} size="thumb" className="h-full w-full" />
                  </div>

                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="line-clamp-1 text-base font-black">{product.name}</h2>
                      <Badge tone={group.status === "completed" ? "green" : "coral"}>
                        {group.status === "completed" ? "цена открыта" : "собирается"}
                      </Badge>
                      <Badge>{product.category}</Badge>
                      {isHot && (
                        <Badge tone="coral" className="animate-pulse">
                          🔥 горит
                        </Badge>
                      )}
                    </div>
                    <ProgressBar value={progress} />
                    <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-stone-600">
                      <span className="inline-flex items-center gap-1">
                        <Users size={14} />
                        {group.current_members}/{group.threshold}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        ⏱ <CountdownTimer expiresAt={group.expires_at} />
                      </span>
                      <span className="inline-flex items-center gap-1 text-primary">
                        <Send size={14} />
                        {left === 0 ? "можно брать" : "позови друга"}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-2 text-left sm:text-right">
                    <p className="text-xl font-black text-primary">
                      {formatPrice(group.price_current, user.currency_preference, locale)}
                    </p>
                    <p className="text-sm font-black text-orange-700">-{pct}%</p>
                    <p className="inline-flex items-center gap-1 rounded-full bg-coupon px-2 py-1 text-xs font-black text-ink sm:justify-end">
                      <Trophy size={14} />
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
