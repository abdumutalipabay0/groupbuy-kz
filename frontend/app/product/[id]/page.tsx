"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronLeft, RefreshCw, Send, ShieldCheck, Truck, Users } from "lucide-react";
import { GroupProgress } from "@/components/product/GroupProgress";
import { ProductVisual } from "@/components/product/ProductVisual";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
import { DealSuccessModal } from "@/components/ui/DealSuccessModal";
import { api } from "@/lib/api";
import { calculateGroupPrice, cn, formatPrice, isGroupExpired, isGroupJoinable, savingsPct } from "@/lib/utils";
import { DEMO_USER, useGroupBuyStore } from "@/lib/store";
import type { Currency, Group, Product, ProductDetail } from "@/types";

const AVATARS = ["AN", "TM", "DK", "AZ", "MR", "LK", "JS", "BK", "YA", "IV"];

function PriceLadder({
  product,
  currentMembers,
  currency,
}: {
  product: Product;
  currentMembers: number;
  currency: Currency;
}) {
  const t = product.group_threshold;
  const steps = [1, Math.ceil(t * 0.3), Math.ceil(t * 0.6), t];
  const locale = currency === "USD" ? "en-US" : "ru-KZ";
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-stone-100 bg-stone-50">
      <p className="px-3 pt-2.5 text-[11px] font-black uppercase tracking-wide text-stone-400">Лестница цен</p>
      <div className="flex">
        {steps.map((n, i) => {
          const p = calculateGroupPrice(product, n);
          const pct = Math.round((1 - p / product.price_individual) * 100);
          const isCurrent = currentMembers >= n && (i === steps.length - 1 || currentMembers < steps[i + 1]);
          const isReached = currentMembers >= n;
          return (
            <div key={n} className={`flex flex-1 flex-col items-center gap-0.5 px-1 py-2.5 ${isCurrent ? "bg-primary/10" : ""}`}>
              <span className={`text-[10px] font-bold ${isReached ? "text-emerald-600" : "text-stone-400"}`}>
                {n === t ? `${n}` : `${n}+`} чел
              </span>
              <span className={`text-sm font-black ${isCurrent ? "text-primary" : isReached ? "text-emerald-600" : "text-stone-500"}`}>
                {formatPrice(p, currency, locale)}
              </span>
              <span className={`rounded px-1 text-[10px] font-black ${isReached ? "bg-emerald-100 text-emerald-700" : "bg-stone-200 text-stone-500"}`}>
                -{pct}%
              </span>
              {isCurrent && <span className="mt-0.5 text-[9px] font-black text-primary">← вы</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ProductPageProps {
  params: { id: string };
}

function useViewingCount(base = 54) {
  const [count, setCount] = useState(base + Math.floor(Math.random() * 30));
  useEffect(() => {
    const id = setInterval(() => {
      setCount((c) => Math.max(base, c + Math.floor(Math.random() * 5) - 2));
    }, 5000);
    return () => clearInterval(id);
  }, [base]);
  return count;
}

export default function ProductPage({ params }: ProductPageProps) {
  const user = useGroupBuyStore((s) => s.userProfile) ?? DEMO_USER;
  const upsertGroup = useGroupBuyStore((s) => s.upsertGroup);
  const [product, setProduct] = useState<Product | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [displayPrice, setDisplayPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [copied, setCopied] = useState(false);
  const [liveEvents, setLiveEvents] = useState<string[]>([]);
  const [successOpen, setSuccessOpen] = useState(false);
  const [origin, setOrigin] = useState("");
  const [priceFlash, setPriceFlash] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const prevPriceRef = useRef(0);
  const viewingCount = useViewingCount(48);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const detail: ProductDetail = await api.product(params.id);
        if (!ignore) {
          setProduct(detail.product);
          setGroup(detail.group);
          const p =
            detail.group?.price_current ??
            calculateGroupPrice(
              detail.product,
              Math.ceil(detail.product.group_threshold * 0.5)
            );
          setDisplayPrice(p);
          prevPriceRef.current = p;
        }
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : "Product failed to load");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [params.id]);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // Flash animation when price drops
  useEffect(() => {
    if (displayPrice < prevPriceRef.current && prevPriceRef.current > 0) {
      setPriceFlash(true);
      const t = setTimeout(() => setPriceFlash(false), 900);
      return () => clearTimeout(t);
    }
    prevPriceRef.current = displayPrice;
  }, [displayPrice]);

  const locale = user.currency_preference === "USD" ? "en-US" : "ru-KZ";
  const savings = product ? product.price_individual - displayPrice : 0;
  const avatarCount = group ? Math.min(group.current_members, AVATARS.length) : 4;
  const spotsLeft = group ? Math.max(group.threshold - group.current_members, 0) : 0;
  const groupExpired = isGroupExpired(group);
  const groupCompleted = group?.status === "completed" || spotsLeft === 0;
  const canJoin = isGroupJoinable(group) && !joined;
  const inviteText =
    product && group
      ? `Я собираю команду на ${product.name}. Осталось ${spotsLeft} мест, цена ${formatPrice(displayPrice, user.currency_preference, locale)}.`
      : "";
  const inviteUrl = origin
    ? group
      ? `${origin}/join/${group.id}?ref=${user.id}`
      : `${origin}/product/${params.id}?ref=${user.id}`
    : "";

  async function joinGroup() {
    if (!product || !group || !canJoin) return;
    const optimisticMembers = Math.min(group.current_members + 1, group.threshold);
    const optimisticPrice = calculateGroupPrice(product, optimisticMembers);
    const optimisticGroup: Group = {
      ...group,
      current_members: optimisticMembers,
      price_current: optimisticPrice,
      status: optimisticMembers >= group.threshold ? "completed" : "active",
    };
    setGroup(optimisticGroup);
    setDisplayPrice(optimisticPrice);
    setJoined(true);
    upsertGroup(optimisticGroup);
    try {
      const res = await api.joinGroup(group.id, user.id);
      setGroup(res.group);
      setDisplayPrice(res.new_price);
      upsertGroup(res.group);
      if (res.group.status === "completed") {
        window.setTimeout(() => setSuccessOpen(true), 450);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join group");
      setGroup(group);
      setDisplayPrice(group.price_current);
      setJoined(false);
    }
  }

  async function copyInvite() {
    if (!group) return;
    try {
      await navigator.clipboard.writeText(`${inviteText} ${inviteUrl}`);
    } catch {
      /* embedded browsers may block */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
    if (!simulating && isGroupJoinable(group)) {
      startFriendSimulation();
    }
  }

  function startFriendSimulation() {
    if (!product || !group || simulating || !isGroupJoinable(group)) return;
    setSimulating(true);
    setLiveEvents(["📨 Ссылка ушла в Telegram"]);
    const missing = Math.max(group.threshold - group.current_members, 0);
    const friendNames = ["Айгерим", "Тимур", "Дана", "Мади", "Алекс"].slice(
      0,
      Math.max(missing, 1)
    );
    friendNames.forEach((friend, idx) => {
      window.setTimeout(() => {
        setLiveEvents((e) => [...e, `👀 ${friend} перешёл по ссылке`]);
      }, 900 + idx * 900);
      window.setTimeout(() => {
        setLiveEvents((e) => [...e, `✅ ${friend} вступил в команду`]);
        setGroup((cur) => {
          if (!cur || !isGroupJoinable(cur)) return cur;
          const nm = Math.min(cur.current_members + 1, cur.threshold);
          const np = calculateGroupPrice(product, nm);
          setDisplayPrice(np);
          const updated: Group = {
            ...cur,
            current_members: nm,
            price_current: np,
            status: nm >= cur.threshold ? "completed" : "active",
          };
          upsertGroup(updated);
          if (updated.status === "completed") {
            window.setTimeout(() => setSuccessOpen(true), 450);
          }
          return updated;
        });
      }, 1300 + idx * 900);
    });
    window.setTimeout(() => setSimulating(false), 1600 + friendNames.length * 900);
  }

  const tags = useMemo(() => product?.tags.slice(0, 5) ?? [], [product]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center text-slate-300">
        <RefreshCw className="animate-spin" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Link
          href="/feed"
          className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-stone-600 hover:text-primary"
        >
          <ChevronLeft size={16} />
          Назад в ленту
        </Link>
        <Card className="border-coral/30 bg-white text-primary">
          {error ?? "Товар не найден"}
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl pb-28">
      {/* White header with back button */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-4 bg-white px-4 py-3 shadow-sm">
        <Link
          href="/feed"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-700 hover:text-primary"
        >
          <ChevronLeft size={18} />
          Назад
        </Link>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          {viewingCount} смотрят
        </span>
      </header>

      {/* Large product image */}
      <div className="relative aspect-square overflow-hidden bg-stone-100">
        <ProductVisual product={product} size="detail" className="h-full w-full" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/40 to-transparent p-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            {product.marketplace}
          </span>
          <span className="rounded-full bg-black/40 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            {318 + product.id.charCodeAt(product.id.length - 1) * 7} купили
          </span>
        </div>
      </div>

      {/* Product info card */}
      <div className="mx-4 -mt-4 rounded-2xl bg-white p-4 shadow-md">
        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge tone="blue">{product.marketplace}</Badge>
          <Badge tone="slate">{product.category}</Badge>
          <Badge tone="coral">{product.origin_country}</Badge>
          {product.source_url && (
            <a href={product.source_url} target="_blank" rel="noreferrer">
              <Badge tone="green">real source</Badge>
            </a>
          )}
        </div>

        {/* Name */}
        <h1 className="mt-3 text-xl font-black leading-snug text-stone-900">{product.name}</h1>
        <p className="mt-1.5 text-sm font-normal leading-6 text-stone-500">
          {product.description}
        </p>
        {product.source_price && product.source_currency && (
          <p className="mt-2 text-xs font-semibold text-stone-400">
            Source price: {product.source_price} {product.source_currency}
            {product.source_location ? ` · ${product.source_location}` : ""}
          </p>
        )}

        {/* Price comparison (inline) */}
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-stone-50 px-4 py-3">
          <div>
            <p className="text-[11px] font-medium text-stone-400">Одному</p>
            <p className="text-base font-semibold text-stone-400 line-through">
              {formatPrice(product.price_individual, user.currency_preference, locale)}
            </p>
          </div>
          <div className="text-stone-300">→</div>
          <div>
            <p className="text-[11px] font-medium text-stone-500">Командой</p>
            <p
              className={cn(
                "text-2xl font-black text-primary transition-all duration-500",
                priceFlash ? "price-drop-flash" : ""
              )}
              key={displayPrice}
            >
              {formatPrice(displayPrice, user.currency_preference, locale)}
            </p>
          </div>
          {savings > 0 && (
            <span className="ml-auto rounded-lg bg-coupon px-2.5 py-1 text-sm font-black text-ink">
              -{savingsPct(product.price_individual, displayPrice)}%
            </span>
          )}
        </div>
        <PriceLadder product={product} currentMembers={group?.current_members ?? 0} currency={user.currency_preference} />
      </div>

      {/* Trust panel */}
      <div className="mx-4 mt-3 grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center gap-1 rounded-xl border border-stone-100 bg-white px-2 py-3 text-center shadow-sm">
          <ShieldCheck size={18} className="text-emerald-500" />
          <p className="text-[11px] font-black text-stone-700">{group ? Math.min(group.current_members, 8) : 4} SIM</p>
          <p className="text-[10px] text-stone-400">верифицировано</p>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-xl border border-stone-100 bg-white px-2 py-3 text-center shadow-sm">
          <Truck size={18} className="text-blue-500" />
          <p className="text-[11px] font-black text-stone-700">7–12 дней</p>
          <p className="text-[10px] text-stone-400">в {user.city}</p>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-xl border border-stone-100 bg-white px-2 py-3 text-center shadow-sm">
          <span className="text-lg">⭐</span>
          <p className="text-[11px] font-black text-stone-700">{product.rating.toFixed(1)}/5</p>
          <p className="text-[10px] text-stone-400">рейтинг</p>
        </div>
      </div>

      {/* Team section */}
      <section className="mx-4 mt-4 space-y-4 rounded-2xl border border-stone-100 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-base font-black text-stone-800">Групповая покупка</p>
            <p className="mt-0.5 text-xs font-medium text-stone-500">
              Когда команда набрана — все платят меньше
            </p>
          </div>
          <Badge tone="coral" className="shrink-0 gap-1">
            ⏱ {groupExpired ? "истекло" : group?.expires_at ? <CountdownTimer expiresAt={group.expires_at} /> : "24:00"}
          </Badge>
        </div>

        <GroupProgress product={product} group={group} />

        <div className="flex items-center justify-between gap-3">
          <div className="flex -space-x-2">
            {AVATARS.slice(0, avatarCount).map((av, idx) => (
              <span
                key={`${av}-${idx}`}
                className="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-primary text-[11px] font-black text-white"
              >
                {av}
              </span>
            ))}
          </div>
          <p className="text-right text-xs font-semibold text-stone-500">
            {spotsLeft === 0 ? "Команда готова!" : `Осталось ${spotsLeft} мест`}
          </p>
        </div>

        {/* Join button */}
        <Button
          className={cn("w-full", spotsLeft <= 2 && canJoin ? "pulse-red" : "")}
          data-testid="join-group"
          disabled={!canJoin}
          icon={joined ? <Check size={18} /> : <Users size={18} />}
          onClick={joinGroup}
        >
          {!group
            ? "Нет активной команды"
            : joined
            ? `Ты в команде · скидка ${savingsPct(product.price_individual, displayPrice)}%`
            : groupExpired
            ? "Срок команды истёк"
            : groupCompleted
            ? "Цена уже открыта"
            : "Войти в команду"}
        </Button>

        {/* Invite panel */}
        {joined && (
          <div className="animate-slide-in-up rounded-xl border border-yellow-300 bg-coupon p-3">
            <p className="text-sm font-black text-ink">Добей сделку: отправь ссылку другу</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button
                variant="primary"
                data-testid="copy-invite"
                icon={<Send size={16} />}
                disabled={simulating}
                onClick={copyInvite}
              >
                {simulating ? "Друзья заходят..." : copied ? "Скопировано ✓" : "Скопировать"}
              </Button>
              <a
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#229ED9] px-3 py-2 text-sm font-black text-white"
                href={`https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(inviteText)}`}
                target="_blank"
                rel="noreferrer"
              >
                <Send size={16} />
                Telegram
              </a>
            </div>
            {liveEvents.length > 0 && (
              <div className="mt-3 space-y-1 rounded-lg bg-white/70 p-2">
                {liveEvents.slice(-5).map((ev, idx) => (
                  <p
                    key={`${ev}-${idx}`}
                    className="animate-slide-in-up text-xs font-semibold text-stone-700"
                  >
                    {ev}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="mx-4 mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
      )}

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200 bg-white p-3 shadow-2xl">
        <div className="mx-auto grid max-w-2xl grid-cols-[0.85fr_1.15fr] gap-2">
          <div className="rounded-xl bg-stone-50 px-3 py-2 text-center">
            <span className="block text-[11px] font-medium text-stone-400">Одному</span>
            <span className="block text-sm font-semibold text-stone-400 line-through">
              {formatPrice(product.price_individual, user.currency_preference, locale)}
            </span>
          </div>
          <button
            data-testid="sticky-team-action"
            className={cn(
              "rounded-xl px-3 py-2 text-center text-white shadow-glow",
              joined ? "bg-[#229ED9] disabled:bg-[#229ED9]/60" : "bg-primary disabled:bg-stone-300"
            )}
            disabled={!group || simulating || (!joined && !canJoin)}
            onClick={joined ? copyInvite : joinGroup}
          >
            <span className="block text-[11px] font-semibold">
              {simulating
                ? "команда реагирует"
                : joined
                ? "добей через Telegram"
                : groupExpired
                ? "команда истекла"
                : groupCompleted
                ? "цена открыта"
                : spotsLeft <= 1
                ? "последний рывок"
                : "командой сейчас"}
            </span>
            <span className="block text-lg font-black">
              {simulating
                ? "Подожди..."
                : joined
                ? "Скопировать invite"
                : groupExpired
                ? "Истекло"
                : groupCompleted
                ? "Готово"
                : formatPrice(displayPrice, user.currency_preference, locale)}
            </span>
          </button>
        </div>
      </div>

      <DealSuccessModal
        open={successOpen}
        productName={product.name}
        finalPrice={displayPrice}
        savings={product.price_individual - displayPrice}
        currency={user.currency_preference}
        shareUrl={inviteUrl}
        onClose={() => setSuccessOpen(false)}
      />
    </div>
  );
}
