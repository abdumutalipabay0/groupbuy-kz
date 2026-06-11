"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, ChevronLeft, RefreshCw, Send, ShieldCheck, Users } from "lucide-react";
import { ProductVisual } from "@/components/product/ProductVisual";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
import { DealSuccessModal } from "@/components/ui/DealSuccessModal";
import { api } from "@/lib/api";
import { DEMO_USER, useGroupBuyStore } from "@/lib/store";
import { calculateGroupPrice, formatPrice, isGroupExpired, isGroupJoinable, savingsPct } from "@/lib/utils";
import type { Group, GroupDetail, Product } from "@/types";

interface JoinPageProps {
  params: {
    groupId: string;
  };
}

const INVITE_EVENTS = ["Аружан уже в команде", "Ссылка пришла из Telegram", "Остался последний шаг"];

export default function JoinPage({ params }: JoinPageProps) {
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
        const detail: GroupDetail = await api.group(params.groupId);
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
  }, [params.groupId]);

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
      <div className="grid min-h-screen place-items-center text-primary">
        <RefreshCw className="animate-spin" />
      </div>
    );
  }

  if (error || !product || !group) {
    return (
      <div className="mx-auto max-w-md px-4 py-8">
        <Link href="/feed" className="inline-flex items-center gap-2 text-sm font-black text-stone-600">
          <ChevronLeft size={16} />
          Лента
        </Link>
        <div className="mt-4 rounded-lg bg-white p-4 font-bold text-primary">{error ?? "Команда не найдена"}</div>
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
    <div className="mx-auto min-h-screen max-w-md bg-appBg pb-24 text-ink shadow-2xl">
      <header className="bg-gradient-to-b from-primary to-hotRed px-4 py-5 text-white">
        <Link href="/feed" className="inline-flex items-center gap-2 text-sm font-black text-white/85">
          <ChevronLeft size={16} />
          Назад
        </Link>
        <p className="mt-5 text-sm font-bold text-white/80">Telegram invite</p>
        <h1 className="text-3xl font-black leading-tight">Друг зовёт добить цену</h1>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-black">
          <ShieldCheck size={15} />
          SIM-trust: меньше фейковых групп
        </div>
      </header>

      <section className="p-4">
        <ProductVisual product={product} className="aspect-square rounded-xl border border-red-100" />

        <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase text-stone-500">Командная цена</p>
              <p className="text-4xl font-black text-primary">{formatPrice(finalPrice, user.currency_preference, locale)}</p>
              <p className="text-sm font-bold text-stone-400 line-through">одному {formatPrice(product.price_individual, user.currency_preference, locale)}</p>
            </div>
            <div className="rounded-lg bg-coupon px-3 py-2 text-right text-xs font-black text-ink">
              экономия<br />
              {formatPrice(savings, user.currency_preference, locale)}
            </div>
          </div>

          <h2 className="mt-4 text-2xl font-black leading-tight">{product.name}</h2>
          <div className="mt-3 rounded-lg bg-red-50 p-3">
            <div className="flex items-center justify-between text-xs font-black text-stone-600">
              <span className="inline-flex items-center gap-1">
                <Users size={14} />
                {group.current_members}/{group.threshold}
              </span>
              <span className="inline-flex items-center gap-1 text-primary">
                ⏱ {expired ? "истекло" : <CountdownTimer expiresAt={group.expires_at} />}
              </span>
            </div>
            <ProgressBar value={progress} className="mt-2" />
            <div className="mt-2 flex items-center justify-between">
              <p className="text-sm font-black text-primary">{left === 0 ? "🎉 Команда готова" : `Осталось ${left} ${left === 1 ? "место" : "места"}`}</p>
              <p className="text-xs font-black text-orange-700">-{savingsPct(product.price_individual, finalPrice)}%</p>
            </div>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          {INVITE_EVENTS.map((event) => (
            <div key={event} className="flex items-center gap-2 rounded-lg bg-white p-3 text-sm font-black shadow-sm">
              <CheckCircle2 size={17} className="text-emerald-600" />
              {event}
            </div>
          ))}
        </div>
      </section>

      <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-red-100 bg-white p-3 shadow-2xl">
        <Button className="w-full" data-testid="invite-join" icon={<Send size={18} />} disabled={joinDisabled} onClick={joinFromInvite}>
          {joinText}
        </Button>
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
