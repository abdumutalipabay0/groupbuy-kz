import { useEffect, useState } from "react";
import { TrendingDown, Users, Zap, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "join" | "save" | "close" | "share";

interface ActivityToast {
  id: string;
  kind: ToastKind;
  text: string;
}

const POOL: Array<{ kind: ToastKind; text: string }> = [
  { kind: "join", text: "Айгерим вступила через Telegram-ссылку" },
  { kind: "save", text: "Тимур сэкономил 12 500 ₸ на Xiaomi Watch" },
  { kind: "close", text: "Команда на Baseus Charger закрылась!" },
  { kind: "join", text: "Данияр зашёл через SIM ID" },
  { kind: "save", text: "Мади открыл командную цену первым" },
  { kind: "close", text: "Dyson Supersonic — остался 1 слот!" },
  { kind: "join", text: "Алина и 3 подруги вошли в одну команду" },
  { kind: "save", text: "Арзу сэкономила 8 900 ₸ на наушниках" },
  { kind: "share", text: "Бауыржан поделился ссылкой в 3 чата" },
  { kind: "close", text: "Команда Samsung Buds закрылась за 4 мин!" },
  { kind: "join", text: "Нуркен вступил — цена упала ещё" },
  { kind: "save", text: "Команда из Астаны сэкономила 34 000 ₸" },
  { kind: "share", text: "Жанар отправила invite 7 контактам" },
  { kind: "join", text: "Асель присоединилась с телефона" },
  { kind: "close", text: "Последнее место в команде Logitech занято!" },
];

const ICONS: Record<ToastKind, typeof Users> = {
  join: Users,
  save: TrendingDown,
  close: Zap,
  share: Share2,
};

const COLORS: Record<ToastKind, string> = {
  join: "bg-blue-500",
  save: "bg-mint-gradient",
  close: "bg-fire-gradient",
  share: "bg-amber-500",
};

let poolIdx = Math.floor(Math.random() * POOL.length);

export function LiveActivity() {
  const [toasts, setToasts] = useState<ActivityToast[]>([]);

  useEffect(() => {
    function push() {
      const item = POOL[poolIdx % POOL.length];
      poolIdx++;
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev.slice(-2), { id, ...item }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4200);
    }

    const first = setTimeout(push, 2800);
    let interval: ReturnType<typeof setInterval>;
    const starter = setTimeout(() => {
      push();
      interval = setInterval(push, 7000 + Math.random() * 6000);
    }, 10000);

    return () => {
      clearTimeout(first);
      clearTimeout(starter);
      clearInterval(interval);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-6 left-3 z-50 hidden flex-col gap-2 md:flex" aria-live="polite">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.kind];
        const color = COLORS[toast.kind];
        return (
          <div
            key={toast.id}
            className="glass animate-slide-in-left flex max-w-[270px] items-center gap-3 rounded-2xl px-3 py-2.5 shadow-lift ring-1 ring-black/5"
          >
            <div className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-xl text-white shadow-sm", color)}>
              <Icon size={15} />
            </div>
            <p className="text-[11px] font-black leading-tight text-ink">{toast.text}</p>
          </div>
        );
      })}
    </div>
  );
}
