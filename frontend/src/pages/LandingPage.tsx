import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  Gift,
  LogIn,
  ShieldCheck,
  Ticket,
  TrendingDown,
  Users,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { forceDemoMode } from "@/lib/api";
import { useGroupBuyStore } from "@/lib/store";

const RECENT_JOINS = [
  "Айгерим из Алматы только что сэкономила 12 500 ₸",
  "Тимур вступил в команду — цена упала",
  "Команда на Dyson закрылась за 3 мин",
  "Мади: первый invite → -40% скидка",
  "Данияр из Астаны забрал купон"
];

function useOnlineCount() {
  const [count, setCount] = useState(318);
  useEffect(() => {
    const id = setInterval(() => setCount((c) => c + Math.floor(Math.random() * 7) - 3), 4000);
    return () => clearInterval(id);
  }, []);
  return Math.max(count, 200);
}

export function LandingPage() {
  const navigate = useNavigate();
  const enterPreview = useGroupBuyStore((s) => s.enterPreview);
  const [recentIdx, setRecentIdx] = useState(0);
  const onlineCount = useOnlineCount();

  useEffect(() => {
    const id = setInterval(() => setRecentIdx((i) => (i + 1) % RECENT_JOINS.length), 3200);
    return () => clearInterval(id);
  }, []);

  function startPreview() {
    forceDemoMode(true); // run entirely on bundled demo data, no account
    enterPreview();
    navigate("/feed");
  }

  return (
    <div className="mx-auto grid min-h-screen w-full max-w-6xl gap-5 px-4 py-6 md:grid-cols-[1fr_0.85fr] md:items-center md:gap-10 md:px-8">
      <section className="flex flex-col justify-center">
        {/* Live ticker */}
        <div className="mb-4 flex items-center gap-3 rounded-full bg-white px-4 py-2.5 shadow-card ring-1 ring-black/5">
          <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-500" />
          <p key={recentIdx} className="animate-slide-in-up truncate text-xs font-black text-emerald-700">
            {RECENT_JOINS[recentIdx]}
          </p>
          <span className="ml-auto shrink-0 text-[10px] font-black text-stone-400">{onlineCount} онлайн</span>
        </div>

        <Badge tone="coral" className="w-fit gap-1">
          <Zap size={14} />
          Pinduoduo-механика для Казахстана
        </Badge>
        <h1 className="mt-4 font-display text-4xl font-black leading-[1.05] text-ink md:text-6xl">
          Вместе <span className="text-fire">дешевле</span>.
        </h1>
        <p className="mt-4 max-w-xl text-base font-medium leading-7 text-stone-600 md:text-lg">
          Birge объединяет покупателей в группы, чтобы получить оптовую цену на зарубежных
          маркетплейсах. Набралась команда — все платят меньше. Цены сразу в тенге с доставкой.
        </p>

        {/* Value props */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          {[
            [Ticket, "купон", "-2 000 ₸"],
            [Users, "команда", "2–10 чел."],
            [TrendingDown, "скидка", "до -40%"]
          ].map(([Icon, title, value]) => {
            const Typed = Icon as typeof Ticket;
            return (
              <div key={title as string} className="rounded-2xl border border-stone-100 bg-white p-3 shadow-card">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-gold-gradient text-ink shadow-sm">
                  <Typed size={16} />
                </span>
                <p className="mt-2 text-[11px] font-bold text-stone-500">{title as string}</p>
                <p className="text-sm font-black text-ink">{value as string}</p>
              </div>
            );
          })}
        </div>

        {/* CTAs */}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link to="/register" className="sm:flex-1">
            <Button className="w-full" data-testid="cta-register" icon={<ShieldCheck size={18} />}>
              Создать аккаунт по SIM
              <ArrowRight size={16} />
            </Button>
          </Link>
          <Link to="/login" className="sm:flex-1">
            <Button className="w-full" variant="secondary" icon={<LogIn size={18} />}>
              Войти
            </Button>
          </Link>
        </div>
        <button
          data-testid="preview-cta"
          onClick={startPreview}
          className="mt-2.5 inline-flex items-center gap-1.5 self-start text-sm font-black text-stone-500 underline-offset-4 transition hover:text-primary hover:underline"
        >
          <Eye size={15} />
          Посмотреть демо без входа
        </button>
        <p className="mt-2 text-center text-[11px] font-bold text-stone-400 sm:text-left">
          {onlineCount} человек сейчас ищут сделки в Birge
        </p>
      </section>

      <aside className="flex items-center">
        <Card className="w-full space-y-5">
          <div className="overflow-hidden rounded-2xl bg-fire-gradient p-4 text-white shadow-glow">
            <p className="text-sm font-black text-white/80">Стартовый пакет</p>
            <p className="mt-1 font-display text-4xl font-black">-2 000 ₸</p>
            <p className="mt-1 text-sm font-bold text-white/85">после первой командной покупки</p>
          </div>

          <div className="space-y-2">
            {[
              ["68%", "пользователей шарят сделки друзьям"],
              ["34%", "приходят по Telegram-ссылке"],
              ["x2.4", "возврат за новыми купонами"]
            ].map(([val, label]) => (
              <div key={val} className="flex items-center gap-3 rounded-xl bg-stone-50 px-3 py-2">
                <span className="text-lg font-black text-primary">{val}</span>
                <span className="text-xs font-bold text-stone-600">{label}</span>
              </div>
            ))}
          </div>

          {/* SIM/eSIM trust — dark premium panel */}
          <div className="relative overflow-hidden rounded-2xl bg-ink-gradient p-4 text-white">
            <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-primary/30 blur-3xl" />
            <div className="relative">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15">
                <ShieldCheck size={22} />
              </span>
              <h2 className="mt-3 font-display text-xl font-black">SIM/eSIM как бейдж доверия</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-white/70">
                1 симка = 1 человек = 1 место в группе. Так команды защищены от ботов и накруток.
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/10 pt-3 text-center">
                {[
                  [Gift, "Купон\nсразу"],
                  [Users, "Команда\nреальна"],
                  [ShieldCheck, "SIM\nдоверие"]
                ].map(([Icon, label]) => {
                  const Typed = Icon as typeof Gift;
                  return (
                    <div key={label as string} className="text-[11px] font-bold text-white/60">
                      <Typed size={18} className="mx-auto mb-1 text-white" />
                      {(label as string).split("\n").map((l) => (
                        <span key={l} className="block">
                          {l}
                        </span>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      </aside>
    </div>
  );
}
