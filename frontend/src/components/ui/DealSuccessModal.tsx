import { CheckCircle2, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import type { Currency } from "@/types";

interface DealSuccessModalProps {
  open: boolean;
  productName: string;
  finalPrice: number;
  savings: number;
  currency: Currency;
  onClose: () => void;
  shareUrl?: string;
}

const CONFETTI_COLORS = ["#E60012", "#FFC93C", "#12B981", "#229ED9", "#FF5A1F", "#A855F7"];
const CONFETTI = Array.from({ length: 28 }, (_, index) => index);

export function DealSuccessModal({ open, productName, finalPrice, savings, currency, onClose, shareUrl }: DealSuccessModalProps) {
  if (!open) return null;
  const locale = currency === "USD" ? "en-US" : "ru-KZ";
  const shareText = `Команда закрылась! Взяли ${productName} командой — сэкономили ${formatPrice(savings, currency, locale)} 🎉`;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4 backdrop-blur-sm" data-testid="deal-success-modal">
      <div className="animate-pop-in relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-5 text-ink shadow-lift">
        {/* falling confetti */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {CONFETTI.map((item) => (
            <span
              key={item}
              className="absolute top-0 h-2.5 w-1.5 rounded-sm"
              style={{
                left: `${(item * 37) % 100}%`,
                background: CONFETTI_COLORS[item % CONFETTI_COLORS.length],
                animation: `confetti-fall ${2.4 + (item % 5) * 0.4}s ${(item % 7) * 0.25}s linear infinite`
              }}
            />
          ))}
        </div>
        <button className="absolute right-3 top-3 z-10 rounded-full bg-stone-100 p-2 transition hover:bg-stone-200" aria-label="Close" onClick={onClose}>
          <X size={16} />
        </button>
        <div className="relative">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-mint-gradient text-white shadow-lg">
            <CheckCircle2 size={34} />
          </div>
          <h2 className="mt-4 font-display text-2xl font-black leading-tight">Команда закрыта</h2>
          <p className="mt-2 text-sm font-bold text-stone-600">{productName}</p>
          <div className="mt-4 overflow-hidden rounded-2xl bg-fire-gradient p-4 text-white shadow-glow">
            <p className="text-xs font-black uppercase tracking-wide text-white/75">Итоговая командная цена</p>
            <p className="font-display text-4xl font-black tracking-tight">{formatPrice(finalPrice, currency, locale)}</p>
            <p className="mt-2 inline-flex rounded-lg bg-gold-gradient px-2.5 py-1 text-sm font-black text-ink shadow-sm">
              сэкономили {formatPrice(savings, currency, locale)}
            </p>
          </div>
          <div className="mt-4 space-y-2">
            <p className="text-xs font-black uppercase tracking-wide text-stone-400">Способ оплаты</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Kaspi Pay", color: "bg-[#FF6B00]", emoji: "🟠" },
                { label: "Kaspi Red", color: "bg-[#E60012]", emoji: "🔴" },
                { label: "Halyk", color: "bg-emerald-600", emoji: "🟢" },
              ].map(({ label, color, emoji }) => (
                <button
                  key={label}
                  type="button"
                  className={`rounded-xl ${color} py-2.5 text-xs font-black text-white transition hover:brightness-110 active:scale-[0.97]`}
                >
                  {emoji} {label}
                </button>
              ))}
            </div>
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
              🔒 Оплата списывается только после сбора команды. Защита покупателя.
            </p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {shareUrl && (
              <a
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#229ED9] px-3 py-2 text-sm font-black text-white transition hover:brightness-110 active:scale-[0.97]"
                href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noreferrer"
              >
                <Send size={16} />
                Telegram
              </a>
            )}
            <Button
              className={shareUrl ? "" : "col-span-2"}
              icon={<Sparkles size={17} />}
              onClick={onClose}
            >
              Ещё сделки
            </Button>
          </div>
          <p className="mt-3 flex items-center justify-center gap-1 text-xs font-bold text-stone-500">
            <Sparkles size={14} />
            Mock-flow хакатона: вирусная механика без реальных платежей.
          </p>
        </div>
      </div>
    </div>
  );
}
