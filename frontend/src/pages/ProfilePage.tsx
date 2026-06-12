import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Coins,
  Crown,
  Flame,
  Gift,
  LogOut,
  Send,
  ShieldCheck,
  Star,
  Store,
  TrendingDown,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { DEMO_USER, useGroupBuyStore } from "@/lib/store";
import { formatPrice, isGroupExpired } from "@/lib/utils";

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

export function ProfilePage() {
  const navigate = useNavigate();
  const user = useGroupBuyStore((s) => s.userProfile) ?? DEMO_USER;
  const clear = useGroupBuyStore((s) => s.clear);
  const activeGroups = useGroupBuyStore((s) => s.activeGroups);

  function logout() {
    clear();
    navigate("/login", { replace: true });
  }
  const visibleGroups = activeGroups.filter((group) => group.status === "active" && !isGroupExpired(group));
  const coins = 180 + visibleGroups.length * 40;
  const totalSaved = 18200;
  const streakDays = 2;
  const inviteSent = 7;

  return (
    <div className="mx-auto w-full max-w-2xl pb-28 lg:max-w-5xl">
      {/* Header */}
      <header className="relative overflow-hidden rounded-b-3xl bg-fire-gradient px-4 py-5 text-white shadow-glow">
        <div className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-white/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-8 h-40 w-40 rounded-full bg-black/15 blur-2xl" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <Link
              to="/feed"
              className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-sm font-black text-white/90 ring-1 ring-white/30 backdrop-blur-sm transition hover:bg-white/25"
            >
              <ArrowLeft size={16} />
              Лента
            </Link>
            <button
              data-testid="logout"
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-black text-white/90 ring-1 ring-white/30 backdrop-blur-sm transition hover:bg-white/25"
            >
              <LogOut size={15} />
              Выйти
            </button>
          </div>
          <div className="mt-5 flex items-center gap-4">
            <div className="animate-float grid h-16 w-16 shrink-0 place-items-center rounded-full bg-white/20 text-3xl font-black ring-2 ring-white/40 backdrop-blur-sm">
              {user.name.slice(0, 1)}
            </div>
            <div>
              <h1 className="font-display text-2xl font-black leading-tight">{user.name}</h1>
              <p className="text-sm font-bold text-white/80">{user.city}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold text-white ring-1 ring-white/30 backdrop-blur-sm">
                  <ShieldCheck size={13} />
                  SIM verified
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-black text-white ring-1 ring-white/30 backdrop-blur-sm">
                  {user.role === "seller" ? "Продавец" : "Покупатель"}
                </span>
                <span className="text-xs font-black text-white/70">{user.currency_preference}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="lg:px-4">
      {/* Stats */}
      <section className="mx-4 mt-4 grid grid-cols-3 gap-3">
        {[
          { icon: Coins, label: "монет", value: coins, color: "bg-amber-50 text-amber-600" },
          { icon: TrendingDown, label: "сэкономлено", value: null, display: formatPrice(totalSaved, "KZT"), color: "bg-emerald-50 text-emerald-600" },
          { icon: Send, label: "инвайтов", value: inviteSent, color: "bg-blue-50 text-blue-600" },
        ].map(({ icon: Icon, label, value, display, color }, idx) => (
          <div
            key={label}
            className="animate-card-in flex flex-col items-center justify-center rounded-2xl border border-stone-100 bg-white py-4 shadow-card"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <span className={`grid h-8 w-8 place-items-center rounded-xl ${color}`}>
              <Icon size={17} />
            </span>
            <p className="mt-1.5 text-xl font-black text-ink">
              {display ?? (value !== null ? <AnimatedNumber value={value!} /> : "—")}
            </p>
            <p className="text-[10px] font-bold text-stone-500">{label}</p>
          </div>
        ))}
      </section>

      {/* Desktop: explicit two columns so the lists can never auto-misalign */}
      <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-2">
      <div>
      {/* Streak */}
      <section className="mx-4 mt-3 rounded-2xl border border-stone-100 bg-white p-4 shadow-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-red-50 text-primary">
              <Flame size={17} />
            </span>
            <div>
              <p className="text-sm font-black text-ink">
                {streakDays}-дневная серия покупок 🔥
              </p>
              <p className="text-xs font-bold text-stone-500">Заходи каждый день и собирай монеты</p>
            </div>
          </div>
          <span className="font-display text-2xl font-black text-fire">{streakDays}</span>
        </div>
        <div className="mt-3">
          <div className="flex gap-1.5">
            {Array.from({ length: 7 }, (_, i) => (
              <div
                key={i}
                className={`flex-1 rounded-lg py-3 text-center text-[10px] font-black transition-all ${
                  i < streakDays ? "bg-fire-gradient text-white shadow-glow" : "bg-stone-100 text-stone-400"
                }`}
              >
                {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"][i]}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="mx-4 mt-3 rounded-2xl border border-stone-100 bg-white p-4 shadow-card">
        <p className="text-sm font-black text-ink">Достижения</p>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {ACHIEVEMENTS.map(({ icon: Icon, label, done }, idx) => (
            <div
              key={label}
              className={`animate-card-in flex flex-col items-center gap-1 rounded-xl p-3 text-center transition-all ${
                done ? "bg-primary/10 text-primary ring-1 ring-primary/20" : "bg-stone-100 text-stone-400"
              }`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <Icon size={22} />
              <p className="text-[10px] font-black leading-tight">{label}</p>
              {done && <span className="text-[10px] font-black text-emerald-600">✓</span>}
            </div>
          ))}
        </div>
      </section>

      {/* Coins progress */}
      <section className="relative mx-4 mt-3 overflow-hidden rounded-2xl border border-yellow-300/70 bg-gold-gradient p-4 shadow-card">
        <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/30 blur-2xl" />
        <div className="relative">
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
        </div>
      </section>

      </div>
      <div>
      {/* Leaderboard */}
      <section className="mx-4 mt-3 rounded-2xl border border-stone-100 bg-white p-4 shadow-card">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-500">
            <Trophy size={17} />
          </span>
          <p className="text-sm font-black text-ink">Топ инвайтеров недели</p>
        </div>
        <div className="mt-3 space-y-2">
          {LEADERBOARD.map((entry, idx) => (
            <div
              key={entry.name}
              className={`animate-card-in flex items-center gap-3 rounded-xl p-3 ${
                entry.isMe
                  ? "bg-red-50/60 ring-1 ring-primary/30"
                  : "bg-stone-50"
              }`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-black shadow-sm ${
                  idx === 0
                    ? "bg-gold-gradient text-ink"
                    : idx === 1
                    ? "bg-stone-300 text-white"
                    : idx === 2
                    ? "bg-orange-300 text-white"
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
      {visibleGroups.length > 0 && (
        <section className="mx-4 mt-3 rounded-2xl border border-stone-100 bg-white p-4 shadow-card">
          <p className="text-sm font-black text-ink">Мои активные команды</p>
          <div className="mt-3 space-y-2">
            {visibleGroups.slice(0, 4).map((g) => (
              <div key={g.id} className="flex items-center justify-between rounded-xl bg-red-50/60 px-3 py-2 ring-1 ring-red-100">
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

      </div>
      </div>
      {/* CTA */}
      <div className="mx-4 mt-4 space-y-2">
        {user.role === "seller" && (
          <Link to="/seller">
            <Button className="w-full" variant="secondary" icon={<Store size={18} />}>
              Кабинет продавца
            </Button>
          </Link>
        )}
        <Link to="/feed">
          <Button className="w-full" icon={<Zap size={18} />}>
            Найти новую сделку
          </Button>
        </Link>
      </div>
      </div>
    </div>
  );
}
