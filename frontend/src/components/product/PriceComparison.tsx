import type { Currency } from "@/types";
import { formatPrice, savingsPct } from "@/lib/utils";

interface PriceComparisonProps {
  individual: number;
  groupPrice: number;
  currency: Currency;
}

export function PriceComparison({ individual, groupPrice, currency }: PriceComparisonProps) {
  const locale = currency === "USD" ? "en-US" : "ru-KZ";
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
        <p className="text-xs font-black uppercase tracking-wide text-stone-500">Купить одному</p>
        <p className="mt-2 text-lg font-bold text-stone-400 line-through">{formatPrice(individual, currency, locale)}</p>
      </div>
      <div className="rounded-lg border border-primary/40 bg-red-50 p-4">
        <p className="text-xs font-black uppercase tracking-wide text-primary">Командой</p>
        <p className="mt-2 text-2xl font-black text-primary transition-all duration-500">{formatPrice(groupPrice, currency, locale)}</p>
        <p className="mt-1 text-xs font-black text-orange-700">Скидка {savingsPct(individual, groupPrice)}%</p>
      </div>
    </div>
  );
}
