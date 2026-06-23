import { Link, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ChevronLeft, Send, ShieldCheck, Users } from "lucide-react";
import { PriceLadder } from "@/components/product/PriceLadder";
import { ProductVisual } from "@/components/product/ProductVisual";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
import { DealSuccessModal } from "@/components/ui/DealSuccessModal";
import { api } from "@/lib/api";
import { DEMO_USER, useGroupBuyStore } from "@/lib/store";
import { GROUP_POLL_MS, calculateGroupPrice, formatPrice, isGroupExpired, isGroupJoinable, savingsPct } from "@/lib/utils";
import type { Group, GroupDetail, Product } from "@/types";

const INVITE_EVENTS = ["Аружан уже в команде", "Ссылка пришла из Telegram", "Остался последний шаг"];

export function JoinPage() {
  const { groupId = "" } = useParams();
  const user = useGroupBuyStore((state) => state.userProfile) ?? DEMO_USER;
  const [product, setProduct] = useState<Product | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const detail: GroupDetail = await api.group(groupId);
        if (!ignore) {
          setProduct(detail.product);
          setGroup(detail.group);
        }
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : "Invite failed to load");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [groupId]);

  // Live updates: another participant joining is visible on this invite page.
  const groupRef = useRef<Group | null>(null);
  useEffect(() => {
    groupRef.current = group;
  }, [group]);
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const detail = await api.group(groupId);
        const cur = groupRef.current;
        if (!cur || cur.id !== detail.group.id) return;
        if (
          detail.group.current_members > cur.current_members ||
          (detail.group.status === "completed" && cur.status === "active")
        ) {
          setGroup(detail.group);
        }
      } catch {
        /* transient network blip */
      }
    }, GROUP_POLL_MS);
    return () => clearInterval(timer);
  }, [groupId]);

  async function joinFromInvite() {
    if (!product || !group || joined || !isGroupJoinable(group)) return;
    const nextMembers = Math.min(group.current_members + 1, group.threshold);
    const nextPrice = calculateGroupPrice(product, nextMembers);
    const optimistic: Group = {
      ...group,
      current_members: nextMembers,
      price_current: nextPrice,
      status: nextMembers >= group.threshold ? "completed" : "active"
    };
    setGroup(optimistic);
    setJoined(true);

    try {
      const response = await api.joinGroup(group.id, user.id);
      setGroup(response.group);
      if (response.group.status === "completed") {
        window.setTimeout(() => setSuccessOpen(true), 550);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join invite");
      setGroup(group);
      setJoined(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto min-h-screen w-full max-w-md bg-appBg pb-28">
        <div className="skeleton h-44 w-full rounded-b-3xl" />
        <div className="space-y-3 p-4">
          <div className="skeleton aspect-square w-full rounded-2xl" />
          <div className="skeleton h-44 w-full rounded-2xl" />
          <div className="skeleton h-12 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !product || !group) {
    return (
      <div className="mx-auto max-w-md px-4 py-8">
        <Link to="/feed" className="inline-flex items-center gap-2 text-sm font-black text-inkSoft transition-colors hover:text-primary">
          <ChevronLeft size={16} />
          Лента
        </Link>
        <div className="mt-4 rounded-2xl border border-hairline bg-panel p-4 font-bold text-primary shadow-card">{error ?? "Команда не найдена"}</div>
      </div>
    );
  }

  const locale = user.currency_preference === "USD" ? "en-US" : "ru-KZ";
  const left = Math.max(group.threshold - group.current_members, 0);
  const progress = (group.current_members / group.threshold) * 100;
  const finalPrice = group.price_current;
  const savings = product.price_individual - finalPrice;
  const expired = isGroupExpired(group);
  const joinDisabled = joined || !isGroupJoinable(group);
  const joinText = joined
    ? "Ты в команде"
    : expired
    ? "Срок команды истёк"
    : group.status === "completed" || left === 0
    ? "Цена уже открыта"
    : "Войти и открыть цену";

  return (
    <div className="mx-auto min-h-screen max-w-md bg-appBg pb-28 text-ink md:max-w-lg">
      <header className="relative overflow-hidden rounded-b-3xl bg-fire-gradient px-4 pb-6 pt-5 text-white shadow-glow">
        <div className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-white/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-8 h-40 w-40 rounded-full bg-black/15 blur-2xl" />
        <div className="relative">
          <Link to="/feed" className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-black text-white/90 backdrop-blur-sm transition-transform active:scale-95">
            <ChevronLeft size={16} />
            Назад
          </Link>
          <p className="mt-5 text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Telegram invite</p>
          <h1 className="mt-2 font-display text-2xl font-black leading-snug text-balance">Друг зовёт добить цену</h1>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-black backdrop-blur-sm">
            <ShieldCheck size={15} />
            SIM-trust: меньше фейковых групп
          </div>
        </div>
      </header>

      <section className="p-4">
        <ProductVisual product={product} className="aspect-square overflow-hidden rounded-2xl border border-hairline shadow-card" />

        <div className="mt-4 rounded-2xl border border-hairline bg-panel p-4 shadow-lift">
          <div className="flex items-start justify-between gap-3" aria-live="polite">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-inkSoft">Командная цена</p>
              <p className="text-4xl font-black tracking-tight text-primary tabular-nums">{formatPrice(finalPrice, user.currency_preference, locale)}</p>
              <p className="text-sm font-bold text-inkSoft line-through">одному {formatPrice(product.price_individual, user.currency_preference, locale)}</p>
            </div>
            <div className="rounded-xl bg-gold-gradient px-3 py-2 text-right text-xs font-black text-charcoal shadow-sm">
              экономия<br />
              {formatPrice(savings, user.currency_preference, locale)}
            </div>
          </div>

          <h2 className="mt-4 text-xl font-black leading-snug text-ink">{product.name}</h2>
          <div className="mt-3 rounded-2xl bg-panelSoft p-3">
            <div className="flex items-center justify-between text-xs font-black text-inkSoft">
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Users size={14} aria-hidden="true" />
                {group.current_members}/{group.threshold}
              </span>
              <span className="inline-flex items-center gap-1 text-primary">
                ⏱ {expired ? "истекло" : <CountdownTimer expiresAt={group.expires_at} />}
              </span>
            </div>
            <ProgressBar value={progress} className="mt-2" />
            <div className="mt-2 flex items-center justify-between">
              <p className="text-sm font-black text-primary">{left === 0 ? "🎉 Команда готова" : `Осталось ${left} ${left === 1 ? "место" : "места"}`}</p>
              <p className="text-xs font-black text-mint">-{savingsPct(product.price_individual, finalPrice)}%</p>
            </div>
          </div>
        </div>

        <div className="mt-3">
          <PriceLadder product={product} currentMembers={group.current_members} currency={user.currency_preference} />
        </div>

        <div className="mt-3 space-y-2">
          {INVITE_EVENTS.map((event, idx) => (
            <div
              key={event}
              className="animate-card-in flex items-center gap-2 rounded-2xl border border-hairline bg-panel p-3 text-sm font-black shadow-card"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <CheckCircle2 size={17} className="text-mint" aria-hidden="true" />
              {event}
            </div>
          ))}
        </div>
      </section>

      <div className="fixed inset-x-3 bottom-3 z-40">
        <div className="glass mx-auto max-w-md rounded-2xl border border-white/60 p-2 shadow-nav md:max-w-lg">
          <Button className="w-full" data-testid="invite-join" icon={<Send size={18} />} disabled={joinDisabled} onClick={joinFromInvite}>
            {joinText}
          </Button>
        </div>
      </div>

      <DealSuccessModal
        open={successOpen}
        productName={product.name}
        finalPrice={group.price_current}
        savings={product.price_individual - group.price_current}
        currency={user.currency_preference}
        onClose={() => setSuccessOpen(false)}
      />
    </div>
  );
}
