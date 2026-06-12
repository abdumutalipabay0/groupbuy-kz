import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronLeft, Send, ShieldCheck, Truck, Users } from "lucide-react";
import { GroupProgress } from "@/components/product/GroupProgress";
import { ProductVisual } from "@/components/product/ProductVisual";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
import { DealSuccessModal } from "@/components/ui/DealSuccessModal";
import { api } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { GROUP_POLL_MS, calculateGroupPrice, cn, formatPrice, isGroupExpired, isGroupJoinable, savingsPct } from "@/lib/utils";
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
    <div className="mt-3 rounded-2xl border border-stone-100 bg-stone-50/70 p-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-black uppercase tracking-wider text-stone-400">Лестница цен</p>
        <span className="text-[10px] font-bold text-stone-400">больше людей → дешевле</span>
      </div>
      <div className="mt-2 grid grid-cols-4 gap-1.5">
        {steps.map((n, i) => {
          const p = calculateGroupPrice(product, n);
          const pct = Math.round((1 - p / product.price_individual) * 100);
          const isCurrent = currentMembers >= n && (i === steps.length - 1 || currentMembers < steps[i + 1]);
          const isReached = currentMembers >= n;
          return (
            <div
              key={n}
              className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-center transition-all ${
                isCurrent
                  ? "bg-white shadow-card ring-2 ring-primary"
                  : isReached
                  ? "bg-emerald-50/80 ring-1 ring-emerald-200"
                  : "bg-white/60 ring-1 ring-stone-100"
              }`}
            >
              <span className={`text-[10px] font-bold ${isReached ? "text-emerald-600" : "text-stone-400"}`}>
                {n === t ? `${n}` : `${n}+`} чел
              </span>
              <span className={`text-[13px] font-black leading-none ${isCurrent ? "text-primary" : isReached ? "text-emerald-600" : "text-stone-500"}`}>
                {formatPrice(p, currency, locale)}
              </span>
              <span className={`rounded-md px-1 py-0.5 text-[9px] font-black ${isReached ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-500"}`}>
                -{pct}%
              </span>
              {isCurrent && <span className="text-[9px] font-black text-primary">← вы</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
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

export function ProductPage() {
  const { id = "" } = useParams();
  const user = useGroupBuyStore((s) => s.userProfile) ?? DEMO_USER;
  const t = useT();
  const upsertGroup = useGroupBuyStore((s) => s.upsertGroup);
  const preview = useGroupBuyStore((s) => s.preview);
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
        const detail: ProductDetail = await api.product(id);
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
  }, [id]);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // Live updates: poll the group every 3s so a join from another device
  // shows up here in real time (members tick up, price animates down).
  const groupRef = useRef<Group | null>(null);
  useEffect(() => {
    groupRef.current = group;
  }, [group]);
  const groupId = group?.id;
  useEffect(() => {
    if (!groupId) return;
    const timer = setInterval(async () => {
      try {
        const detail = await api.group(groupId);
        const cur = groupRef.current;
        if (!cur || cur.id !== detail.group.id) return;
        const membersGrew = detail.group.current_members > cur.current_members;
        const justCompleted = detail.group.status === "completed" && cur.status === "active";
        if (membersGrew || justCompleted) {
          setGroup(detail.group);
          setDisplayPrice(detail.group.price_current);
          upsertGroup(detail.group);
        }
      } catch {
        /* transient network blip — keep current state */
      }
    }, GROUP_POLL_MS);
    return () => clearInterval(timer);
  }, [groupId, upsertGroup]);

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
  const groupCompleted = Boolean(group && (group.status === "completed" || spotsLeft === 0));
  const canJoin = isGroupJoinable(group) && !joined;
  const inviteText =
    product && group
      ? `Я собираю команду на ${product.name}. Осталось ${spotsLeft} мест, цена ${formatPrice(displayPrice, user.currency_preference, locale)}.`
      : "";
  const inviteUrl = origin
    ? group
      ? `${origin}/join/${group.id}?ref=${user.id}`
      : `${origin}/product/${id}?ref=${user.id}`
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
    // Scripted "friends arrive" is a preview-only effect. Logged-in users get
    // real recruitment: people who open the link actually join and the live
    // poller turns those joins into real notifications.
    if (preview && !simulating && isGroupJoinable(group)) {
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
      <div className="mx-auto w-full max-w-2xl pb-44">
        <div className="skeleton aspect-square w-full" />
        <div className="mx-4 -mt-4 space-y-3 rounded-2xl border border-stone-100 bg-white p-4 shadow-card">
          <div className="skeleton h-5 w-2/3 rounded-md" />
          <div className="skeleton h-3.5 w-full rounded-md" />
          <div className="skeleton h-16 w-full rounded-2xl" />
          <div className="skeleton h-24 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Link
          to="/feed"
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
    <div className="mx-auto w-full max-w-2xl pb-48 lg:max-w-6xl">
      <header className="glass sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-stone-200/60 px-4 py-3">
        <Link
          to="/feed"
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-stone-700 shadow-sm ring-1 ring-black/5 transition hover:text-primary"
        >
          <ChevronLeft size={17} />
          Назад
        </Link>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          {viewingCount} смотрят
        </span>
      </header>

      <div className="lg:grid lg:grid-cols-[1fr_1.08fr] lg:items-start lg:gap-8 lg:px-8 lg:pt-6">
      <div className="relative aspect-square overflow-hidden bg-stone-100 lg:sticky lg:top-[72px] lg:rounded-3xl lg:shadow-card">
        <ProductVisual product={product} size="detail" className="h-full w-full" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/45 to-transparent p-3 pb-7">
          <span className="glass inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold text-ink">
            {product.marketplace}
          </span>
          <span className="rounded-full bg-black/40 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            {318 + product.id.charCodeAt(product.id.length - 1) * 7} купили
          </span>
        </div>
      </div>

      <div className="lg:min-w-0">
      <div className="relative mx-4 -mt-5 rounded-2xl border border-stone-100 bg-white p-4 shadow-lift lg:mx-0 lg:mt-0">
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

        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-stone-50 px-4 py-3">
          <div>
            <p className="text-[11px] font-medium text-stone-400">{t("product_alone")}</p>
            <p className="text-base font-semibold text-stone-400 line-through">
              {formatPrice(product.price_individual, user.currency_preference, locale)}
            </p>
          </div>
          <div className="text-stone-300">→</div>
          <div>
            <p className="text-[11px] font-medium text-stone-500">{group ? t("product_together") : "Оценка группой"}</p>
            <p
              className={cn(
                "text-[26px] font-black leading-tight tracking-tight text-primary transition-all duration-500",
                priceFlash ? "price-drop-flash" : ""
              )}
              key={displayPrice}
            >
              {formatPrice(displayPrice, user.currency_preference, locale)}
            </p>
          </div>
          {savings > 0 && (
            <span className="ml-auto rounded-xl bg-gold-gradient px-2.5 py-1.5 text-sm font-black text-ink shadow-sm">
              -{savingsPct(product.price_individual, displayPrice)}%
            </span>
          )}
        </div>
        {savings > 0 && (
          <p className="mt-2 text-center text-xs font-black text-emerald-700">
            💸 {t("product_your_savings")} — {formatPrice(savings, user.currency_preference, locale)}
          </p>
        )}
        <PriceLadder product={product} currentMembers={group?.current_members ?? 0} currency={user.currency_preference} />
      </div>

      <div className="mx-4 mt-3 grid grid-cols-3 gap-2 lg:mx-0">
        {[
          {
            icon: <ShieldCheck size={17} />,
            iconBg: "bg-emerald-50 text-emerald-600",
            title: `${group ? Math.min(group.current_members, 8) : 4} SIM`,
            sub: "верифицировано",
          },
          {
            icon: <Truck size={17} />,
            iconBg: "bg-blue-50 text-blue-600",
            title: "7–12 дней",
            sub: `в ${user.city}`,
          },
          {
            icon: <span className="text-base">⭐</span>,
            iconBg: "bg-amber-50 text-amber-600",
            title: `${product.rating.toFixed(1)}/5`,
            sub: "рейтинг",
          },
        ].map(({ icon, iconBg, title, sub }) => (
          <div
            key={sub}
            className="flex flex-col items-center gap-1.5 rounded-2xl border border-stone-100 bg-white px-2 py-3 text-center shadow-card"
          >
            <span className={`grid h-8 w-8 place-items-center rounded-xl ${iconBg}`}>{icon}</span>
            <p className="text-[11px] font-black text-stone-700">{title}</p>
            <p className="text-[10px] text-stone-400">{sub}</p>
          </div>
        ))}
      </div>

      <section className="mx-4 mt-4 space-y-4 rounded-2xl border border-stone-100 bg-white p-4 shadow-card lg:mx-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-base font-black text-stone-800">Групповая покупка</p>
            <p className="mt-0.5 text-xs font-medium text-stone-500">
              Когда команда набрана — все платят меньше
            </p>
          </div>
          {group ? (
            <Badge tone="coral" className="shrink-0 gap-1">
              ⏱ {groupExpired ? "истекло" : <CountdownTimer expiresAt={group.expires_at} />}
            </Badge>
          ) : (
            <Badge tone="slate" className="shrink-0">нет команды</Badge>
          )}
        </div>

        {group ? (
          <>
            <GroupProgress product={product} group={group} />

            <div className="flex items-center justify-between gap-3">
              <div className="flex -space-x-2">
                {AVATARS.slice(0, avatarCount).map((av, idx) => (
                  <span
                    key={`${av}-${idx}`}
                    className="grid h-8 w-8 place-items-center rounded-full border-2 border-white text-[11px] font-black text-white shadow-sm"
                    style={{
                      background: `linear-gradient(135deg, hsl(${(idx * 47 + 8) % 360} 72% 52%), hsl(${(idx * 47 + 48) % 360} 72% 40%))`,
                    }}
                  >
                    {av}
                  </span>
                ))}
              </div>
              <p className="text-right text-xs font-semibold text-stone-500">
                {groupCompleted ? "Цена открыта" : `Осталось ${spotsLeft} мест`}
              </p>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4">
            <p className="text-sm font-black text-stone-900">Активной команды пока нет</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-stone-500">
              Товар в каталоге реальный. Для демо команда создается на товарах с активным групповым сбором.
            </p>
          </div>
        )}

        <Button
          className={cn("w-full", spotsLeft <= 2 && canJoin ? "pulse-red" : "")}
          data-testid="join-group"
          disabled={!canJoin}
          icon={joined ? <Check size={18} /> : <Users size={18} />}
          onClick={joinGroup}
        >
          {!group
            ? t("product_no_group")
            : joined
            ? `${t("product_joined")} ${savingsPct(product.price_individual, displayPrice)}%`
            : groupExpired
            ? t("product_expired")
            : groupCompleted
            ? t("product_completed")
            : t("product_join")}
        </Button>

        {joined && (
          <div className="animate-slide-in-up rounded-2xl border border-yellow-300/70 bg-gold-gradient p-3 shadow-card">
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
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#229ED9] px-3 py-2 text-sm font-black text-white transition hover:brightness-110 active:scale-[0.97]"
                href={`https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(inviteText)}`}
                target="_blank"
                rel="noreferrer"
              >
                <Send size={16} />
                Telegram
              </a>
            </div>
            {liveEvents.length > 0 && (
              <div className="mt-3 space-y-1 rounded-xl bg-white/75 p-2 backdrop-blur-sm">
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

      {tags.length > 0 && (
        <div className="mx-4 mt-4 flex flex-wrap gap-2 lg:mx-0">
          {tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
      )}
      </div>
      </div>

      {group && (
        <div className="fixed inset-x-3 bottom-[86px] z-40 lg:hidden">
          <div className="glass mx-auto max-w-2xl rounded-2xl border border-white/60 p-2 shadow-nav">
            <div className="grid grid-cols-[0.85fr_1.15fr] gap-2">
              <div className="rounded-xl bg-stone-100/80 px-3 py-2 text-center">
                <span className="block text-[11px] font-medium text-stone-400">Одному</span>
                <span className="block text-sm font-semibold text-stone-400 line-through">
                  {formatPrice(product.price_individual, user.currency_preference, locale)}
                </span>
              </div>
              <button
                data-testid="sticky-team-action"
                className={cn(
                  "rounded-xl px-3 py-2 text-center text-white transition-all active:scale-[0.98]",
                  joined
                    ? "bg-[#229ED9] shadow-lg disabled:bg-[#229ED9]/60"
                    : "bg-fire-gradient shadow-glow disabled:bg-none disabled:bg-stone-300 disabled:shadow-none"
                )}
                disabled={simulating || (!joined && !canJoin)}
                onClick={joined ? copyInvite : joinGroup}
              >
                <span className="block text-[11px] font-semibold opacity-90">
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
                <span className="block text-lg font-black tracking-tight">
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
        </div>
      )}

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
