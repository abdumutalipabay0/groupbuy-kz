"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Gift, Lock, ShieldCheck, Ticket, TrendingDown, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { makeUserFromRegistration, useGroupBuyStore } from "@/lib/store";
import type { Currency, Language } from "@/types";

const CITIES = ["Almaty", "Astana", "Shymkent", "Other"];
const INTERESTS = ["gaming", "electronics", "fashion", "sports", "beauty", "home", "travel", "food"];

const RECENT_JOINS = [
  "Айгерим из Алматы только что сэкономила 12 500 ₸",
  "Тимур вступил в команду — цена упала",
  "Команда на Dyson закрылась за 3 мин",
  "Мади: первый invite → -40% скидка",
  "Данияр из Астаны забрал купон",
];

function useOnlineCount() {
  const [count, setCount] = useState(318);
  useEffect(() => {
    const id = setInterval(() => setCount((c) => c + Math.floor(Math.random() * 7) - 3), 4000);
    return () => clearInterval(id);
  }, []);
  return Math.max(count, 200);
}

export default function RegisterPage() {
  const router = useRouter();
  const setSession = useGroupBuyStore((s) => s.setSession);
  const [name, setName] = useState("Aruzhan");
  const [city, setCity] = useState("Almaty");
  const [age, setAge] = useState(24);
  const [budget, setBudget] = useState(120);
  const [currency, setCurrency] = useState<Currency>("KZT");
  const [language] = useState<Language>("ru");
  const [interests, setInterests] = useState<string[]>(["gaming", "electronics", "gadgets"]);
  const [simConnected, setSimConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [recentIdx, setRecentIdx] = useState(0);
  const onlineCount = useOnlineCount();

  useEffect(() => {
    const id = setInterval(() => setRecentIdx((i) => (i + 1) % RECENT_JOINS.length), 3200);
    return () => clearInterval(id);
  }, []);

  function toggleInterest(interest: string) {
    setInterests((cur) =>
      cur.includes(interest) ? cur.filter((i) => i !== interest) : [...cur, interest]
    );
  }

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const payload = { name, city, age, budget_usd: budget, interests, currency_preference: currency, language };
      const res = await api.register(payload);
      setSession({ token: res.token, user: makeUserFromRegistration({ id: res.user_id, ...payload }) });
      router.push("/feed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto grid min-h-screen w-full max-w-6xl gap-5 px-4 py-5 md:grid-cols-[1fr_0.85fr] md:px-8 md:py-8">
      <section className="flex flex-col justify-center">
        {/* Live ticker */}
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
          <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-500" />
          <p key={recentIdx} className="animate-slide-in-up text-xs font-black text-emerald-800">
            {RECENT_JOINS[recentIdx]}
          </p>
          <span className="ml-auto shrink-0 text-[10px] font-black text-stone-500">
            {onlineCount} онлайн
          </span>
        </div>

        <div className="mb-7">
          <Badge tone="coral" className="gap-1">
            <Zap size={14} />
            Pinduoduo-механика для KZ
          </Badge>
          <h1 className="mt-4 text-4xl font-black leading-tight text-ink md:text-6xl">
            Входи, забирай купон, собирай команду.
          </h1>
          <p className="mt-4 max-w-xl text-base font-medium text-stone-600 md:text-lg">
            Групповая цена открывается, когда ты зовёшь друзей через Telegram.
            Чем быстрее закрылась команда — тем заметнее падение цены.
          </p>
        </div>

        {/* Value props */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          {[
            [Ticket, "купон", "-2 000 ₸"],
            [Users, "команда", "2–10 чел."],
            [TrendingDown, "скидка", "до -40%"],
          ].map(([Icon, title, value]) => {
            const TypedIcon = Icon as typeof Ticket;
            return (
              <div key={title as string} className="rounded-lg border border-yellow-300 bg-coupon p-3">
                <TypedIcon size={18} />
                <p className="mt-1 text-[11px] font-bold text-stone-700">{title as string}</p>
                <p className="text-sm font-black text-ink">{value as string}</p>
              </div>
            );
          })}
        </div>

        <Card className="space-y-5 border-red-100">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-black">
              Имя
              <input
                className="w-full rounded-md border border-red-100 bg-red-50 px-3 py-3 text-ink outline-none focus:border-primary"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="space-y-2 text-sm font-black">
              Город
              <select
                className="w-full rounded-md border border-red-100 bg-red-50 px-3 py-3 text-ink outline-none focus:border-primary"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              >
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="space-y-2 text-sm font-black">
              Возраст
              <input
                type="number"
                min={13}
                max={100}
                className="w-full rounded-md border border-red-100 bg-red-50 px-3 py-3 text-ink outline-none focus:border-primary"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
              />
            </label>
            <label className="space-y-2 text-sm font-black">
              Валюта
              <select
                className="w-full rounded-md border border-red-100 bg-red-50 px-3 py-3 text-ink outline-none focus:border-primary"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
              >
                <option>KZT</option>
                <option>USD</option>
                <option>RUB</option>
              </select>
            </label>
          </div>

          <label className="block space-y-3 text-sm font-black">
            Бюджет на сделки: ${budget}
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

          <div className="space-y-3">
            <p className="text-sm font-black">Что ловим в ленте</p>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  className={`rounded-full px-3 py-2 text-sm font-black transition ${
                    interests.includes(interest)
                      ? "bg-primary text-white shadow-glow"
                      : "bg-red-50 text-stone-700 hover:bg-red-100"
                  }`}
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="rounded-md bg-coral/10 px-3 py-2 text-sm font-bold text-primary">{error}</p>
          )}

          <Button
            className="w-full"
            disabled={loading || interests.length === 0 || !name.trim()}
            onClick={submit}
          >
            {loading ? "Открываем купон..." : "Забрать купон и войти"}
          </Button>

          <p className="text-center text-[11px] font-bold text-stone-500">
            {onlineCount} человек сейчас ищут сделки
          </p>
        </Card>
      </section>

      <aside className="flex items-center">
        <Card className="w-full space-y-5 border-primary/20 bg-white">
          <div className="rounded-lg bg-gradient-to-r from-primary to-coral p-4 text-white">
            <p className="text-sm font-black text-white/80">Стартовый пакет</p>
            <p className="mt-2 text-4xl font-black">-2 000 ₸</p>
            <p className="mt-1 text-sm font-bold text-white/85">после первой командной покупки</p>
          </div>

          {/* Social proof */}
          <div className="space-y-2">
            {[
              ["68%", "пользователей шарят сделки друзьям"],
              ["34%", "приходят по Telegram-ссылке"],
              ["x2.4", "возврат за новыми купонами"],
            ].map(([val, label]) => (
              <div key={val} className="flex items-center gap-3 rounded-lg bg-red-50 px-3 py-2">
                <span className="text-lg font-black text-primary">{val}</span>
                <span className="text-xs font-bold text-stone-600">{label}</span>
              </div>
            ))}
          </div>

          <div className="flex h-14 w-14 items-center justify-center rounded-md bg-red-50 text-primary">
            <Lock size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black">SIM/eSIM как бейдж доверия</h2>
            <p className="mt-3 text-sm font-medium leading-6 text-stone-600">
              Для демо это UI-концепт: устройство помечается как проверенное,
              чтобы командам было спокойнее входить в сделку.
            </p>
          </div>
          {simConnected ? (
            <Badge tone="green" className="gap-2 text-sm">
              <ShieldCheck size={16} />
              Устройство проверено
            </Badge>
          ) : (
            <Button
              className="w-full"
              icon={<ShieldCheck size={18} />}
              onClick={() => setSimConnected(true)}
            >
              Подключить SIM ID
            </Button>
          )}

          {/* Trust indicators */}
          <div className="grid grid-cols-3 gap-2 border-t border-red-100 pt-4 text-center">
            {[
              [Gift, "Купон\nсразу"],
              [Users, "Команда\nреальна"],
              [ShieldCheck, "SIM\nдоверие"],
            ].map(([Icon, label]) => {
              const TypedIcon = Icon as typeof Gift;
              return (
                <div key={label as string} className="text-xs font-bold text-stone-500">
                  <TypedIcon size={20} className="mx-auto mb-1 text-primary" />
                  {(label as string).split("\n").map((l) => <span key={l} className="block">{l}</span>)}
                </div>
              );
            })}
          </div>
        </Card>
      </aside>
    </div>
  );
}
