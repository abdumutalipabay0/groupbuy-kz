import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Dumbbell,
  Flame,
  Grid,
  Home,
  Apple,
  Laptop,
  MapPin,
  Moon,
  Search,
  Shirt,
  Sparkles,
  Sun,
  Users,
} from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
import { Button } from "@/components/ui/Button";
import { FeedSkeleton } from "@/components/ui/Skeleton";
import { NotificationsBell } from "@/components/ui/NotificationsBell";
import { api } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { DEMO_USER, useGroupBuyStore } from "@/lib/store";
import { formatPrice, isGroupExpired, savingsPct } from "@/lib/utils";
import type { Currency, Group, Product } from "@/types";

const CATEGORY_ICONS = [
  { label: "Все", category: null, icon: Grid },
  { label: "Одежда", category: "Fashion", icon: Shirt },
  { label: "Электроника", category: "Electronics", icon: Laptop },
  { label: "Спорт", category: "Sports", icon: Dumbbell },
  { label: "Красота", category: "Beauty", icon: Sparkles },
  { label: "Дом", category: "Home", icon: Home },
  { label: "Еда", category: "Food", icon: Apple },
];

export function FeedPage() {
  const user = useGroupBuyStore((state) => state.userProfile) ?? DEMO_USER;
  const setActiveGroups = useGroupBuyStore((state) => state.setActiveGroups);
  const lang = useGroupBuyStore((state) => state.lang);
  const setLang = useGroupBuyStore((state) => state.setLang);
  const theme = useGroupBuyStore((state) => state.theme);
  const setTheme = useGroupBuyStore((state) => state.setTheme);
  const t = useT();
  const [products, setProducts] = useState<Product[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [category, setCategory] = useState<string | null>(null);
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
          const liveGroups = groupList.filter((group) => group.status === "active" && !isGroupExpired(group));
          setProducts(feed);
          setGroups(groupList);
          setActiveGroups(liveGroups);
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

  const hotGroups = useMemo(() => {
    return [...groups]
      .filter((g) => g.status === "active" && !isGroupExpired(g))
      .sort((a, b) => {
        const urgencyA = a.current_members / a.threshold;
        const urgencyB = b.current_members / b.threshold;
        return urgencyB - urgencyA;
      })
      .slice(0, 3);
  }, [groups]);

  const filteredProducts = products.filter((p) => {
    const categoryMatch = !category || p.category === category;
    const searchMatch =
      search.trim() === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return categoryMatch && searchMatch;
  });
  const realCount = products.filter((product) => product.source_url).length;

  return (
    <div className="w-full bg-appBg pb-28">
      {/* Glass header */}
      <header className="glass sticky top-0 z-30 border-b border-hairline px-4 pb-3 pt-3">
        <div className="mx-auto max-w-md md:max-w-3xl lg:max-w-5xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-panel px-2.5 py-1 shadow-sm ring-1 ring-black/5">
              <MapPin size={13} className="shrink-0 text-primary" aria-hidden="true" />
              <span className="text-xs font-bold text-inkSoft">{user.city}</span>
            </span>
            <span className="rounded-full bg-mint/10 px-2 py-0.5 text-[10px] font-black text-mint ring-1 ring-mint/30">
              {realCount} real items
            </span>
            <div className="ml-auto flex items-center gap-1.5">
              <button
                className="rounded-full bg-panel px-2.5 py-1 text-[11px] font-black text-inkSoft shadow-sm ring-1 ring-black/5 transition-colors hover:ring-primary/30 active:scale-95"
                data-testid="lang-switch"
                onClick={() => setLang(lang === "ru" ? "kz" : "ru")}
              >
                {lang === "ru" ? "ҚАЗ" : "РУС"}
              </button>
              <button
                className="grid h-7 w-7 place-items-center rounded-full bg-panel text-inkSoft shadow-sm ring-1 ring-black/5 transition-colors hover:ring-primary/30 active:scale-95"
                data-testid="theme-switch"
                aria-label={theme === "dark" ? "Включить светлую тему" : "Включить тёмную тему"}
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
              </button>
              <NotificationsBell />
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-2 rounded-2xl bg-panel px-3.5 py-2.5 shadow-sm ring-1 ring-black/5 transition-shadow focus-within:ring-2 focus-within:ring-primary/30">
            <Search size={16} className="shrink-0 text-inkSoft" aria-hidden="true" />
            <label htmlFor="feed-search" className="sr-only">
              {t("feed_search")}
            </label>
            <input
              id="feed-search"
              name="search"
              autoComplete="off"
              className="flex-1 bg-transparent text-sm text-ink placeholder-inkSoft outline-none"
              placeholder={t("feed_search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                aria-label="Очистить поиск"
                className="text-xs text-inkSoft hover:text-primary"
                onClick={() => setSearch("")}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-md md:max-w-3xl lg:max-w-5xl">
        {/* Fire hero banner */}
        <section className="relative mx-4 mt-3 overflow-hidden rounded-3xl bg-fire-gradient p-5 text-white shadow-glow md:p-7">
          <div className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-white/15 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-8 h-40 w-40 rounded-full bg-black/15 blur-2xl" />
          <div className="relative">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Birge</p>
                <h1 className="mt-2 font-display text-[21px] font-black leading-snug md:text-3xl text-balance">
                  {t("feed_hero_title_1")}
                  <br />
                  {t("feed_hero_title_2")}
                </h1>
                <p className="mt-2 max-w-[230px] text-[13px] font-semibold leading-5 text-white/85 md:max-w-md md:text-sm">
                  {t("feed_hero_sub")}
                </p>
              </div>
              <div className="animate-float rounded-2xl bg-white/15 px-3 py-2.5 text-center backdrop-blur-sm">
                <p className="font-display text-xl font-black tabular-nums">{realCount}</p>
                <p className="text-[10px] font-bold text-white/75">real</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center md:max-w-md">
              {[
                ["до -35%", t("feed_discount")],
                ["SIM", "trust"],
                ["Telegram", "invite"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-xl bg-white/12 px-2 py-2 backdrop-blur-sm">
                  <p className="text-sm font-black">{value}</p>
                  <p className="text-[10px] font-bold text-white/70">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI buyer entry */}
        <Link to="/ai" className="mx-4 mt-3 block">
          <div className="flex items-center gap-3 rounded-2xl border border-hairline bg-panel px-3.5 py-3 shadow-card transition-shadow hover:shadow-lift">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-fire-gradient text-white shadow-glow">
              <Sparkles size={17} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-ink">AI-байер</p>
              <p className="truncate text-xs font-medium text-inkSoft">{t("feed_ai_hint")}</p>
            </div>
            <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-black text-primary">
              {t("feed_ai_ask")}
            </span>
          </div>
        </Link>

        {/* Category chips */}
        <section className="mt-4 overflow-x-auto px-4" style={{ scrollbarWidth: "none" }}>
          <div className="flex gap-2 pb-1">
            {CATEGORY_ICONS.map(({ label, category: cat, icon: Icon }) => {
              const active = cat === category;
              return (
                <button
                  key={label}
                  aria-pressed={active}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-black transition-[background-color,box-shadow,transform] active:scale-95 ${
                    active
                      ? "bg-charcoal text-white shadow-card"
                      : "bg-panel text-ink shadow-sm ring-1 ring-black/5 hover:ring-black/10"
                  }`}
                  onClick={() => setCategory(active ? null : cat)}
                >
                  <Icon size={15} strokeWidth={2} aria-hidden="true" />
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Hot groups */}
        {!loading && hotGroups.length > 0 && (
          <section className="mt-5 px-4">
            <div className="mb-2.5 flex items-center gap-1.5">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-fire-gradient text-white shadow-glow">
                <Flame size={13} aria-hidden="true" />
              </span>
              <h2 className="text-base font-black text-ink">{t("feed_hot")}</h2>
            </div>
            <div className="space-y-2 md:grid md:grid-cols-3 md:gap-2.5 md:space-y-0">
              {hotGroups.map((g, idx) => {
                const prod = products.find((p) => p.id === g.product_id);
                if (!prod) return null;
                const spotsLeft = Math.max(g.threshold - g.current_members, 0);
                const pct = savingsPct(prod.price_individual, g.price_current);
                const locale = user.currency_preference === "USD" ? "en-US" : "ru-KZ";
                return (
                  <Link key={g.id} to={`/product/${prod.id}`} className="block">
                    <div
                      className="animate-card-in flex items-center gap-3 rounded-2xl border border-coral/20 bg-panel px-3 py-2.5 shadow-card transition-shadow hover:shadow-lift"
                      style={{ animationDelay: `${idx * 70}ms` }}
                    >
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-coral/10 to-primary/10 text-xl">
                        🔥
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-ink">{prod.name}</p>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-inkSoft">
                          <span className="inline-flex items-center gap-0.5 font-semibold tabular-nums">
                            <Users size={11} aria-hidden="true" /> {g.current_members}/{g.threshold}
                          </span>
                          <span aria-hidden="true">·</span>
                          <CountdownTimer expiresAt={g.expires_at} className="font-bold" />
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-black text-primary tabular-nums">{formatPrice(g.price_current, user.currency_preference as Currency, locale)}</p>
                        <p className="text-[11px] font-bold text-mint">-{pct}%</p>
                      </div>
                      <div className="shrink-0 rounded-full bg-fire-gradient px-2.5 py-1 text-[11px] font-black text-white shadow-glow">
                        {spotsLeft === 0 ? "готово" : `+${spotsLeft}`}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <div className="mt-5 flex items-center justify-between px-4">
          <h2 className="text-base font-black text-ink">
            {category ? t("feed_category") : t("feed_popular")}
          </h2>
          {!loading && !error && (
            <span className="rounded-full bg-panel px-2.5 py-1 text-xs font-bold text-inkSoft shadow-sm ring-1 ring-black/5 tabular-nums">
              {filteredProducts.length} {t("feed_products")}
            </span>
          )}
        </div>

        {/* Product grid */}
        {loading ? (
          <FeedSkeleton />
        ) : error ? (
          <div className="mx-4 mt-5 rounded-2xl border border-hairline bg-panel p-4 font-medium text-primary shadow-card">
            {error}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="mt-10 px-4 text-center text-inkSoft">
            <p className="text-3xl" aria-hidden="true">🔍</p>
            <p className="mt-2 font-medium">
              {search
                ? `Ничего не найдено по «${search}»`
                : "Нет товаров в этой категории."}
            </p>
            <Button
              className="mt-4"
              variant="secondary"
              onClick={() => {
                setCategory(null);
                setSearch("");
              }}
            >
              Показать всё
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 px-4 pt-3 md:grid-cols-3 md:gap-3 lg:grid-cols-4">
            {filteredProducts.map((product, idx) => (
              <div
                key={product.id}
                className="animate-card-in"
                style={{ animationDelay: `${Math.min(idx, 10) * 45}ms` }}
              >
                <ProductCard
                  product={product}
                  group={groupByProduct.get(product.id)}
                  currency={user.currency_preference as Currency}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
