"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Coins,
  Flame,
  Gift,
  Megaphone,
  RefreshCw,
  Search,
  Share2,
  SlidersHorizontal,
  Trophy,
  User,
  Zap,
} from "lucide-react";
import { SimBadge } from "@/components/auth/SimBadge";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { DEMO_USER, useGroupBuyStore } from "@/lib/store";
import { formatPrice } from "@/lib/utils";
import type { Currency, Group, Product } from "@/types";

const CATEGORIES = ["Все", "Electronics", "Fashion", "Home", "Sports", "Beauty"];

const CATEGORY_LABELS: Record<string, string> = {
  "Все": "Все",
  Electronics: "Гаджеты",
  Fashion: "Стиль",
  Home: "Дом",
  Sports: "Спорт",
  Beauty: "Бьюти",
};

const COUPONS = [
  { title: "-2 000 ₸ за друга", caption: "забрать до 23:59", reward: 80 },
  { title: "Flash -40%", caption: "только сегодня", reward: 120 },
  { title: "Монеты x3", caption: "за первый invite", reward: 60 },
  { title: "Доставка free", caption: "после 2 шеров", reward: 40 },
];

function useOnlineCount(base = 312) {
  const [count, setCount] = useState(base);
  useEffect(() => {
    const id = setInterval(() => {
      setCount((c) => c + Math.floor(Math.random() * 7) - 3);
    }, 4000);
    return () => clearInterval(id);
  }, []);
  return Math.max(count, 200);
}

// Flash sale ends at midnight tonight
function todayMidnight() {
  const d = new Date();
  d.setHours(23, 59, 59, 0);
  return d.toISOString();
}

export default function FeedPage() {
  const user = useGroupBuyStore((state) => state.userProfile) ?? DEMO_USER;
  const setActiveGroups = useGroupBuyStore((state) => state.setActiveGroups);
  const [products, setProducts] = useState<Product[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [category, setCategory] = useState("Все");
  const [budget, setBudget] = useState(1000);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimedCoupons, setClaimedCoupons] = useState<string[]>([]);
  const [coins, setCoins] = useState(180);
  const [flashExpiry] = useState(todayMidnight);
  const onlineCount = useOnlineCount();

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const groupList = await api.groups();
        let feed: Product[];
        try {
          feed = await api.feed(user.id);
        } catch {
          feed = await api.feed(DEMO_USER.id);
        }
        if (!ignore) {
          setProducts(feed);
          setGroups(groupList);
          setActiveGroups(groupList);
        }
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : "Could not load feed");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [setActiveGroups, user.id]);

  const groupByProduct = useMemo(
    () => new Map(groups.map((g) => [g.product_id, g])),
    [groups]
  );
  const locale = user.currency_preference === "USD" ? "en-US" : "ru-KZ";
  const currency = user.currency_preference as Currency;

  const urgentGroups = groups
    .filter((g) => g.status !== "expired")
    .sort((a, b) => b.current_members / b.threshold - a.current_members / a.threshold)
    .slice(0, 3);

  const filteredProducts = products.filter((p) => {
    const catMatch = category === "Все" || p.category === category;
    const budgetMatch = p.price_individual <= budget;
    const searchMatch =
      search.trim() === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return catMatch && budgetMatch && searchMatch;
  });

  const missionProgress = Math.min(100, 34 + claimedCoupons.length * 22);

  function claimCoupon(coupon: (typeof COUPONS)[number]) {
    if (claimedCoupons.includes(coupon.title)) return;
    setClaimedCoupons((items) => [...items, coupon.title]);
    setCoins((v) => v + coupon.reward);
  }

  return (
    <div className="mx-auto w-full max-w-7xl pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-gradient-to-b from-primary to-hotRed px-4 pb-4 pt-3 text-white shadow-lg md:px-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-white/80">GroupBuy KZ</p>
            <h1 className="text-2xl font-black leading-tight">Собери команду, сбей цену</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-black sm:inline-flex">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              {onlineCount} онлайн
            </span>
            <SimBadge />
            <Link
              className="rounded-md bg-white px-3 py-2 text-xs font-black text-primary"
              href="/groups"
            >
              Команды
            </Link>
            <Link
              className="grid h-9 w-9 place-items-center rounded-md bg-white/20 text-white"
              href="/profile"
            >
              <User size={17} />
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="mt-3 flex items-center gap-2 rounded-full bg-white px-3 py-2 text-stone-500">
          <Search size={17} className="shrink-0" />
          <input
            className="flex-1 bg-transparent text-sm font-semibold text-ink placeholder-stone-400 outline-none"
            placeholder="найти товар, который добьют друзья"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="text-xs font-black text-stone-400 hover:text-primary"
              onClick={() => setSearch("")}
            >
              ✕
            </button>
          )}
        </div>

        {/* Flash sale */}
        <div className="mt-2 flex items-center justify-between rounded-lg bg-white/15 px-3 py-1.5">
          <div className="flex items-center gap-2">
            <Zap size={15} className="text-coupon" />
            <span className="text-xs font-black text-white">Flash Sale -40%</span>
          </div>
          <span className="text-xs font-black text-coupon">
            <CountdownTimer expiresAt={flashExpiry} />
          </span>
        </div>
      </header>

      {/* Coupons */}
      <section className="px-4 pt-4 md:px-8">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {COUPONS.map((coupon, index) => {
            const claimed = claimedCoupons.includes(coupon.title);
            return (
              <button
                key={coupon.title}
                data-testid={`coupon-${index}`}
                className={`rounded-lg border p-3 text-left text-ink shadow-sm transition active:scale-[0.99] ${
                  claimed
                    ? "border-emerald-200 bg-mint/15"
                    : "border-yellow-300 bg-coupon hover:-translate-y-0.5"
                }`}
                onClick={() => claimCoupon(coupon)}
                type="button"
              >
                <div className="flex items-center gap-2">
                  {claimed ? (
                    <CheckCircle2 size={18} className="text-emerald-700" />
                  ) : index === 0 ? (
                    <Gift size={18} />
                  ) : index === 1 ? (
                    <Flame size={18} />
                  ) : index === 2 ? (
                    <Trophy size={18} />
                  ) : (
                    <Zap size={18} />
                  )}
                  <p className="text-sm font-black">{coupon.title}</p>
                </div>
                <p className="mt-1 text-[11px] font-semibold text-stone-700">
                  {claimed ? `+${coupon.reward} монет в кошельке` : coupon.caption}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Daily mission */}
      <section className="mx-4 mt-4 grid gap-3 rounded-lg border border-red-100 bg-white p-3 shadow-sm md:mx-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase text-stone-500">Daily mission</p>
              <h2 className="text-lg font-black text-ink">Собери 3 действия → скрытый купон</h2>
            </div>
            <div className="inline-flex shrink-0 items-center gap-1 rounded-full bg-coupon px-3 py-1 text-sm font-black text-ink">
              <Coins size={17} />
              <span key={coins} className="animate-count-up">{coins}</span>
            </div>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-red-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-coral transition-all duration-700"
              style={{ width: `${missionProgress}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs font-bold text-stone-500">
            <span>{claimedCoupons.length}/3 выполнено</span>
            <span>{missionProgress >= 100 ? "🎉 купон открыт!" : "добей прогресс"}</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {["зашёл", "забрал", "позвал"].map((item, index) => (
            <div
              key={item}
              className={`rounded-md px-2 py-3 text-xs font-black transition ${
                index <= claimedCoupons.length
                  ? "animate-pop-in bg-red-50 text-primary"
                  : "bg-stone-100 text-stone-500"
              }`}
            >
              {index < claimedCoupons.length ? "✓ " : ""}{item}
            </div>
          ))}
        </div>
      </section>

      {/* Hot teams */}
      <section className="mx-4 mt-4 rounded-lg border border-red-100 bg-white p-3 shadow-sm md:mx-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <Megaphone size={18} />
            <p className="text-sm font-black">Горящие команды</p>
          </div>
          <Link href="/groups" className="text-xs font-black text-stone-500 hover:text-primary">
            все →
          </Link>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {urgentGroups.map((group) => {
            const product = products.find((p) => p.id === group.product_id);
            if (!product) return null;
            const left = Math.max(group.threshold - group.current_members, 0);
            return (
              <Link
                key={group.id}
                href={`/product/${product.id}`}
                className="rounded-md bg-red-50 p-3 text-sm transition hover:bg-red-100"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="line-clamp-1 font-black text-ink">{product.name}</span>
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-black text-white">
                    {left === 0 ? "готово" : `+${left}`}
                  </span>
                </div>
                <p className="mt-1 text-xs font-bold text-primary">
                  {formatPrice(group.price_current, currency, locale)} командой
                </p>
                <p className="mt-1 text-[10px] font-bold text-stone-500">
                  ⏱ <CountdownTimer expiresAt={group.expires_at} />
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Filters */}
      <section className="mt-4 flex flex-col gap-3 px-4 md:flex-row md:items-center md:justify-between md:px-8">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((item) => (
            <button
              key={item}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-black transition ${
                category === item
                  ? "bg-primary text-white shadow-glow"
                  : "bg-white text-stone-700 shadow-sm"
              }`}
              onClick={() => setCategory(item)}
            >
              {CATEGORY_LABELS[item]}
            </button>
          ))}
        </div>
        <label className="flex min-w-56 items-center gap-3 rounded-full bg-white px-3 py-2 text-sm font-black text-stone-700 shadow-sm">
          <SlidersHorizontal size={18} />
          ${budget}
          <input
            className="w-full accent-primary"
            type="range"
            min={10}
            max={1000}
            step={10}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
          />
        </label>
      </section>

      {/* Results count */}
      {!loading && !error && search && (
        <p className="px-4 pt-3 text-xs font-bold text-stone-500 md:px-8">
          {filteredProducts.length > 0
            ? `${filteredProducts.length} результат${filteredProducts.length === 1 ? "" : "а"} по «${search}»`
            : `Ничего не найдено по «${search}»`}
        </p>
      )}

      {/* Product grid */}
      {loading ? (
        <div className="grid min-h-80 place-items-center text-primary">
          <RefreshCw className="animate-spin" />
        </div>
      ) : error ? (
        <div className="mx-4 mt-5 rounded-lg border border-coral/30 bg-white p-4 font-bold text-primary md:mx-8">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 px-4 pt-4 md:grid-cols-3 md:gap-3 md:px-8 lg:grid-cols-5">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              group={groupByProduct.get(product.id)}
              currency={user.currency_preference}
            />
          ))}
        </div>
      )}

      {!loading && !error && filteredProducts.length === 0 && (
        <div className="mt-10 text-center text-stone-600">
          <p>{search ? `Ничего не найдено по «${search}»` : "Под этот бюджет сделок нет."}</p>
          <Button
            className="mt-4"
            variant="secondary"
            onClick={() => { setBudget(1000); setSearch(""); }}
          >
            Показать всё
          </Button>
        </div>
      )}

      {/* Mobile sticky */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-red-100 bg-white/95 px-4 py-2 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-stone-500">
              Daily mission · <span key={coins} className="animate-count-up">{coins}</span> монет
            </p>
            <p className="text-sm font-black text-ink">
              {missionProgress >= 100 ? "🎉 Секретный купон открыт" : "Поделись сделкой = купон"}
            </p>
          </div>
          <Button className="min-h-10 px-3" icon={<Share2 size={16} />}>
            Шер
          </Button>
        </div>
      </div>
    </div>
  );
}
