import type { Currency, Product } from "@/types";
import { calculateGroupPrice, formatPrice } from "@/lib/utils";

interface Step {
  n: number;
  price: number;
  pct: number;
  reached: boolean;
  isCurrent: boolean;
}

function buildSteps(product: Product, currentMembers: number): Step[] {
  const t = product.group_threshold;
  const ns = [1, Math.ceil(t * 0.3), Math.ceil(t * 0.6), t];
  return ns.map((n, i) => {
    const price = calculateGroupPrice(product, n);
    const pct = Math.round((1 - price / product.price_individual) * 100);
    const reached = currentMembers >= n;
    const isCurrent = reached && (i === ns.length - 1 || currentMembers < ns[i + 1]);
    return { n, price, pct, reached, isCurrent };
  });
}

interface PriceLadderProps {
  product: Product;
  currentMembers: number;
  currency: Currency;
  variant?: "full" | "compact";
}

/**
 * The signature visual: price drops in real, discrete steps as members join
 * (not a decorative percent badge) — rendered as a literal ascending
 * staircase, the one mechanical fact unique to this product.
 */
export function PriceLadder({ product, currentMembers, currency, variant = "full" }: PriceLadderProps) {
  const steps = buildSteps(product, currentMembers);
  const locale = currency === "USD" ? "en-US" : "ru-KZ";
  const compact = variant === "compact";

  return (
    <div
      className={
        compact
          ? "flex items-end gap-1"
          : "rounded-2xl border border-hairline bg-panelSoft p-3"
      }
      aria-live="polite"
    >
      {!compact && (
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] font-black uppercase tracking-wider text-inkSoft">Лестница цены</p>
          <span className="text-[10px] font-bold text-inkSoft">больше людей → дешевле</span>
        </div>
      )}
      <div className={compact ? "flex flex-1 items-end gap-1" : "grid grid-cols-4 gap-1.5"}>
        {steps.map((step, i) => {
          const heightPct = 34 + i * 22;
          return (
            <div
              key={step.n}
              className={
                compact
                  ? "flex flex-1 flex-col items-center justify-end gap-0.5"
                  : "flex flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-center transition-[background-color,box-shadow] " +
                    (step.isCurrent
                      ? "bg-panel shadow-card ring-2 ring-primary"
                      : step.reached
                      ? "bg-mint/10 ring-1 ring-mint/30"
                      : "bg-panel/60 ring-1 ring-hairline")
              }
            >
              {compact ? (
                <span
                  className="w-full rounded-sm transition-[height,background-color] duration-300"
                  style={{
                    height: `${heightPct}%`,
                    backgroundColor: step.isCurrent
                      ? "var(--accent)"
                      : step.reached
                      ? "var(--mint)"
                      : "var(--border)"
                  }}
                />
              ) : (
                <>
                  <span className={`text-[10px] font-bold ${step.reached ? "text-mint" : "text-inkSoft"}`}>
                    {step.n === product.group_threshold ? `${step.n}` : `${step.n}+`} чел
                  </span>
                  <span
                    className={`text-[13px] font-black leading-none ${
                      step.isCurrent ? "text-primary" : step.reached ? "text-mint" : "text-ink"
                    }`}
                  >
                    {formatPrice(step.price, currency, locale)}
                  </span>
                  <span
                    className={`rounded-md px-1 py-0.5 text-[9px] font-black ${
                      step.reached ? "bg-mint/15 text-mint" : "bg-panelSoft text-inkSoft"
                    }`}
                  >
                    -{step.pct}%
                  </span>
                  {step.isCurrent && <span className="text-[9px] font-black text-primary">← вы</span>}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
