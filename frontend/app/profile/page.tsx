"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Coins,
  Crown,
  Flame,
  Gift,
  Send,
  ShieldCheck,
  Star,
  TrendingDown,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { DEMO_USER, useGroupBuyStore } from "@/lib/store";
import { formatPrice } from "@/lib/utils";

const LEADERBOARD = [
  { name: "Тимур А.", invites: 34, saved: 89500, city: "Алматы" },
  { name: "Айгерим К.", invites: 28, saved: 72300, city: "Астана" },
  { name: "Данияр М.", invites: 21, saved: 54100, city: "Алматы" },
  { name: "Ты", invites: 7, saved: 18200, city: "—", isMe: true },
  { name: "Алина Б.", invites: 5, saved: 12900, city: "Шымкент" },
];

const ACHIEVEMENTS = [
  { icon: Zap, label: "Первый invite", done: true },
  { icon: Users, label: "Команда x3", done: true },
  { icon: Flame, label: "Серия 3 дня", done: false },
  { icon: Crown, label: "Топ-5 недели", done: false },
];

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(value / 30);
    const id = setInterval(() => {
      start = Math.min(start + step, value);
      setDisplay(start);
      if (start >= value) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [value]);
  return (
    <span>
      {display.toLocaleString("ru-KZ")}
      {suffix}
    </span>
  );
}

export default function ProfilePage() {
  const user = useGroupBuyStore((s) => s.userProfile) ?? DEMO_USER;
  const activeGroups = useGroupBuyStore((s) => s.activeGroups);
  const coins = 180 + activeGroups.length * 40;
  const totalSaved = 18200;
  const dealsJoined = 3 + activeGroups.length;
  const streakDays = 2;
  const inviteSent = 7;

  return (
    <div className="mx-auto w-full max-w-2xl pb-24">
      {/* Header */}
      <header className="bg-gradient-to-b from-primary to-hotRed px-4 py-5 text-white">
        <Link href="/feed" className="inline-flex items-center gap-2 text-sm font-black text-white/85">
          <ArrowLeft size={16} />
          Лента
        </Link>
        <div className="mt-5 flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-white/20 text-3xl font-black">
            {user.name.slice(0, 1)}
          </div>
          <div>
            <h1 className="text-3xl font-black">{user.name}</h1>
            <p className="text-sm font-bold text-white/80">{user.city}</p>
            <div className="mt-1 flex items-center gap-2">
              <Badge tone="green" className="gap-1">
                <ShieldCheck size={13} />
                SIM verified
              </Badge>
              <span className="text-xs font-black text-white/70">
                {user.currency_preference}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <section className="mx-4 mt-4 grid grid-cols-3 gap-3">
        {[
          { icon: Coins, label: "монет", value: coins, color: "text-amber-600" },
          { icon: TrendingDown, label: "сэкономлено", value: null, display: formatPrice(totalSaved, "KZT"), color: "text-emerald-600" },
          { icon: Send, label: "инвайтов", value: inviteSent, color: "text-blue-600" },
        ].map(({ icon: Icon, label, value, display, color }) => (
          <div
            key={label}
            className="flex flex-col items-center justify-center rounded-xl border border-red-100 bg-white py-4 shadow-sm"
          >
            <Icon size={22} className={color} />
            <p className="mt-1 text-xl font-black text-ink">
              {display ?? (value !== null ? <AnimatedNumber value={value!} /> : "—")}
            </p>
            <p className="text-[10px] font-bold text-stone-500">{label}</p>
          </div>
        ))}
      </section>

      {/* Streak */}
      <section className="mx-4 mt-3 rounded-xl border border-red-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame size={20} className="text-primary" />
            <div>
              <p className="text-sm font-black text-ink">
                {streakDays}-дневная серия покупок 🔥
              </p>
              <p className="text-xs font-bold text-stone-500">Заходи каждый день и собирай монеты</p>
            </div>
          </div>
          <span className="text-2xl font-black text-primary">{streakDays}</span>
        </div>
        <div className="mt-3">
          <div className="flex gap-1">
            {Array.from({ length: 7 }, (_, i) => (
              <div
                key={i}
                className={`flex-1 rounded py-3 text-center text-[10px] font-black ${
                  i < streakDays ? "bg-primary text-white" : "bg-stone-100 text-stone-400"
                }`}
              >
                {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"][i]}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="mx-4 mt-3 rounded-xl border border-red-100 bg-white p-4 shadow-sm">
        <p className="text-sm font-black text-ink">Достижения</p>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {ACHIEVEMENTS.map(({ icon: Icon, label, done }) => (
            <div
              key={label}
              className={`flex flex-col items-center gap-1 rounded-lg p-3 text-center ${
                done ? "bg-primary/10 text-primary" : "bg-stone-100 text-stone-400"
              }`}
            >
              <Icon size={22} />
              <p className="text-[10px] font-black leading-tight">{label}</p>
              {done && <span className="text-[10px] font-black text-emerald-600">✓</span>}
            </div>
          ))}
        </div>
      </section>

      {/* Coins progress */}
      <section className="mx-4 mt-3 rounded-xl border border-yellow-300 bg-coupon p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift size={20} />
            <p className="text-sm font-black text-ink">До секретного купона</p>
          </div>
          <span className="text-sm font-black text-ink">{coins}/300 монет</span>
        </div>
        <ProgressBar value={(coins / 300) * 100} className="mt-3" />
        <p className="mt-2 text-xs font-bold text-stone-700">
          {300 - coins > 0
            ? `Ещё ${300 - coins} монет — и откроется скрытая скидка -15%`
            : "🎉 Купон разблокирован! Применяется автоматически."}
        </p>
      </section>

      {/* Leaderboard */}
      <section className="mx-4 mt-3 rounded-xl border border-red-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-amber-500" />
          <p className="text-sm font-black text-ink">Топ инвайтеров недели</p>
        </div>
        <div className="mt-3 space-y-2">
          {LEADERBOARD.map((entry, idx) => (
            <div
              key={entry.name}
              className={`flex items-center gap-3 rounded-lg p-3 ${
                entry.isMe
                  ? "border border-primary/30 bg-red-50"
                  : "bg-stone-50"
              }`}
            >
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-black ${
                  idx === 0
                    ? "bg-amber-400 text-white"
                    : idx === 1
                    ? "bg-stone-400 text-white"
                    : idx === 2
                    ? "bg-orange-400 text-white"
                    : "bg-stone-200 text-stone-600"
                }`}
              >
                {idx === 0 ? "🏆" : idx + 1}
              </span>
              <div className="flex-1">
                <p className={`text-sm font-black ${entry.isMe ? "text-primary" : "text-ink"}`}>
                  {entry.name}
                  {entry.isMe && " (ты)"}
                </p>
                <p className="text-[11px] font-bold text-stone-500">{entry.city}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-ink">{entry.invites} инв.</p>
                <p className="text-[11px] font-bold text-emerald-600">
                  {formatPrice(entry.saved, "KZT")}
                </p>
              </div>
              {idx === 0 && <Star size={16} className="shrink-0 text-amber-400" />}
            </div>
          ))}
        </div>
      </section>

      {/* Active deals */}
      {activeGroups.length > 0 && (
        <section className="mx-4 mt-3 rounded-xl border border-red-100 bg-white p-4 shadow-sm">
          <p className="text-sm font-black text-ink">Мои активные команды</p>
          <div className="mt-3 space-y-2">
            {activeGroups.slice(0, 4).map((g) => (
              <div key={g.id} className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2">
                <div>
                  <p className="text-xs font-black text-ink">Группа #{g.id}</p>
                  <p className="text-[10px] font-bold text-stone-500">
                    {g.current_members}/{g.threshold} участников
                  </p>
                </div>
                <p className="text-sm font-black text-primary">
                  {formatPrice(g.price_current, user.currency_preference)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <div className="mx-4 mt-4">
        <Link href="/feed">
          <Button className="w-full" icon={<Zap size={18} />}>
            Найти новую сделку
          </Button>
        </Link>
      </div>
    </div>
  );
}
