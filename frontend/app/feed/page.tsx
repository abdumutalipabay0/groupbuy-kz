"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Car,
  Dumbbell,
  Grid,
  Home,
  Laptop,
  MapPin,
  RefreshCw,
  Search,
  Shirt,
  Sparkles,
  Star,
} from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { DEMO_USER, useGroupBuyStore } from "@/lib/store";
import type { Currency, Group, Product } from "@/types";

const MARKETPLACES = ["Все", "AliExpress", "Amazon", "Taobao", "Wildberries"];

const CATEGORY_ICONS = [
  { label: "Одежда", icon: Shirt },
  { label: "Электроника", icon: Laptop },
  { label: "Обувь", icon: Star },
  { label: "Дом", icon: Home },
  { label: "Спорт", icon: Dumbbell },
  { label: "Красота", icon: Sparkles },
  { label: "Авто", icon: Car },
  { label: "Всё", icon: Grid },
];

const BANNERS = [
  {
    title: "AliExpress в один клик",
    subtitle: "Групповые цены от -30%",
    link: "/groups",
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    title: "Amazon доставка в KZ",
    subtitle: "Быстро и дёшево командой",
    link: "/groups",
    gradient: "from-orange-400 to-red-500",
  },
  {
    title: "Taobao групповая цена",
    subtitle: "Заказывай напрямую из Китая",
    link: "/groups",
    gradient: "from-purple-500 to-pink-500",
  },
];

export default function FeedPage() {
  const user = useGroupBuyStore((state) => state.userProfile) ?? DEMO_USER;
  const setActiveGroups = useGroupBuyStore((state) => state.setActiveGroups);
  const [products, setProducts] = useState<Product[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [marketplace, setMarketplace] = useState("Все");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    return () => {
      ignore = true;
    };
  }, [setActiveGroups, user.id]);

  const groupByProduct = useMemo(
    () => new Map(groups.map((g) => [g.product_id, g])),
    [groups]
  );

  const filteredProducts = products.filter((p) => {
    const marketplaceMatch =
      marketplace === "Все" || p.marketplace === marketplace;
    const searchMatch =
      search.trim() === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return marketplaceMatch && searchMatch;
  });

  return (
    <div className="w-full bg-appBg pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white px-4 pb-3 pt-3 shadow-sm">
        <div className="mx-auto max-w-md">
          <div className="flex items-center gap-2">
            <MapPin size={15} className="shrink-0 text-primary" />
            <span className="text-xs font-semibold text-stone-500">Алматы</span>
            <div className="ml-auto">
              <button className="grid h-9 w-9 place-items-center rounded-full text-stone-500 hover:bg-stone-100">
                <Bell size={20} />
              </button>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2 rounded-full bg-stone-100 px-3 py-2">
            <Search size={16} className="shrink-0 text-stone-400" />
            <input
              className="flex-1 bg-transparent text-sm text-stone-800 placeholder-stone-400 outline-none"
              placeholder="Поиск товаров и скидок"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="text-xs text-stone-400 hover:text-primary"
                onClick={() => setSearch("")}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-md">
        {/* Banner slider */}
        <section className="mt-3 overflow-x-auto px-4" style={{ scrollbarWidth: "none" }}>
          <div className="flex snap-x snap-mandatory gap-3 pb-1">
            {BANNERS.map((banner) => (
              <div
                key={banner.title}
                className={`relative h-36 w-[72vw] max-w-xs shrink-0 snap-start overflow-hidden rounded-2xl bg-gradient-to-br ${banner.gradient} p-4 text-white`}
              >
                <p className="text-lg font-black leading-tight">{banner.title}</p>
                <p className="mt-1 text-sm font-medium text-white/80">{banner.subtitle}</p>
                <Link
                  href={banner.link}
                  className="mt-3 inline-block text-sm font-bold underline underline-offset-2"
                >
                  Смотреть →
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Category icons */}
        <section className="mt-4 overflow-x-auto px-4" style={{ scrollbarWidth: "none" }}>
          <div className="flex gap-3 pb-1">
            {CATEGORY_ICONS.map(({ label, icon: Icon }) => (
              <button
                key={label}
                className="flex shrink-0 flex-col items-center gap-1.5"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <Icon size={24} className="text-stone-700" strokeWidth={1.7} />
                </div>
                <span className="text-[11px] font-semibold text-stone-600">{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Marketplace filter */}
        <section className="mt-4 overflow-x-auto px-4" style={{ scrollbarWidth: "none" }}>
          <div className="flex gap-2 pb-1">
            {MARKETPLACES.map((item) => (
              <button
                key={item}
                className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                  marketplace === item
                    ? "border-primary bg-primary text-white"
                    : "border-stone-200 bg-white text-stone-600"
                }`}
                onClick={() => setMarketplace(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        {/* Section header */}
        <div className="mt-4 flex items-center justify-between px-4">
          <h2 className="text-base font-black text-stone-800">Популярное сегодня</h2>
          {!loading && !error && search && (
            <span className="text-xs font-medium text-stone-500">
              {filteredProducts.length} товаров
            </span>
          )}
        </div>

        {/* Product grid */}
        {loading ? (
          <div className="grid min-h-80 place-items-center text-primary">
            <RefreshCw className="animate-spin" />
          </div>
        ) : error ? (
          <div className="mx-4 mt-5 rounded-xl border border-stone-200 bg-white p-4 font-medium text-primary">
            {error}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="mt-10 px-4 text-center text-stone-500">
            <p className="font-medium">
              {search
                ? `Ничего не найдено по «${search}»`
                : "Нет товаров в этой категории."}
            </p>
            <Button
              className="mt-4"
              variant="secondary"
              onClick={() => {
                setMarketplace("Все");
                setSearch("");
              }}
            >
              Показать всё
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 px-4 pt-3">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                group={groupByProduct.get(product.id)}
                currency={user.currency_preference as Currency}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
