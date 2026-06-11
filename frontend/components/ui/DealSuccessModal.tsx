"use client";

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

const CONFETTI = Array.from({ length: 20 }, (_, index) => index);

export function DealSuccessModal({ open, productName, finalPrice, savings, currency, onClose, shareUrl }: DealSuccessModalProps) {
  if (!open) return null;
  const locale = currency === "USD" ? "en-US" : "ru-KZ";
  const shareText = `Команда закрылась! Взяли ${productName} командой — сэкономили ${formatPrice(savings, currency, locale)} 🎉`;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4" data-testid="deal-success-modal">
      <div className="relative w-full max-w-md overflow-hidden rounded-xl bg-white p-5 text-ink shadow-2xl">
        {CONFETTI.map((item) => (
          <span
            key={item}
            className="absolute h-2 w-3 rounded-sm bg-coupon"
            style={{
              left: `${(item * 37) % 100}%`,
              top: `${(item * 23) % 70}%`,
              transform: `rotate(${item * 31}deg)`,
              opacity: 0.55
            }}
          />
        ))}
        <button className="absolute right-3 top-3 rounded-full bg-stone-100 p-2" aria-label="Close" onClick={onClose}>
          <X size={16} />
        </button>
        <div className="relative">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-mint/15 text-emerald-600">
            <CheckCircle2 size={34} />
          </div>
          <h2 className="mt-4 text-3xl font-black">Команда закрыта</h2>
          <p className="mt-2 text-sm font-bold text-stone-600">{productName}</p>
          <div className="mt-4 rounded-lg bg-gradient-to-r from-primary to-coral p-4 text-white">
            <p className="text-xs font-black uppercase text-white/75">Итоговая командная цена</p>
            <p className="text-4xl font-black">{formatPrice(finalPrice, currency, locale)}</p>
            <p className="mt-1 inline-flex rounded bg-coupon px-2 py-1 text-sm font-black text-ink">
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
                <button key={label} className={`rounded-lg ${color} py-2.5 text-xs font-black text-white`}>
                  {emoji} {label}
                </button>
              ))}
            </div>
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
              🔒 Оплата списывается только после сбора команды. Защита покупателя.
            </p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {shareUrl && (
              <a
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#229ED9] px-3 py-2 text-sm font-black text-white"
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
