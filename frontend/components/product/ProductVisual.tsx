import { Dumbbell, Headphones, Home, Keyboard, Laptop, Mouse, Shirt, Sparkles, Watch } from "lucide-react";
import type { Product } from "@/types";
import { cn } from "@/lib/utils";

interface ProductVisualProps {
  product: Product;
  className?: string;
  size?: "card" | "detail" | "thumb";
}

const categoryStyle: Record<string, { bg: string; accent: string; text: string; icon: typeof Laptop }> = {
  Electronics: { bg: "from-sky-100 via-white to-blue-200", accent: "bg-blue-600", text: "text-blue-600", icon: Laptop },
  Fashion: { bg: "from-rose-100 via-white to-orange-100", accent: "bg-rose-500", text: "text-rose-500", icon: Shirt },
  Home: { bg: "from-amber-100 via-white to-yellow-100", accent: "bg-amber-500", text: "text-amber-500", icon: Home },
  Sports: { bg: "from-emerald-100 via-white to-lime-100", accent: "bg-emerald-600", text: "text-emerald-600", icon: Dumbbell },
  Beauty: { bg: "from-fuchsia-100 via-white to-pink-100", accent: "bg-fuchsia-500", text: "text-fuchsia-500", icon: Sparkles }
};

function pickIcon(product: Product): typeof Laptop {
  const name = product.name.toLowerCase();
  if (name.includes("watch") || name.includes("garmin")) return Watch;
  if (name.includes("headphone") || name.includes("soundcore")) return Headphones;
  if (name.includes("mouse")) return Mouse;
  if (name.includes("keyboard")) return Keyboard;
  return categoryStyle[product.category]?.icon ?? Laptop;
}

export function ProductVisual({ product, className, size = "card" }: ProductVisualProps) {
  const style = categoryStyle[product.category] ?? categoryStyle.Electronics;
  const Icon = pickIcon(product);
  const isDetail = size === "detail";
  const isThumb = size === "thumb";

  return (
    <div className={cn("relative overflow-hidden bg-gradient-to-br", style.bg, className)}>
      <div className={cn("absolute rounded-full opacity-15 blur-2xl", style.accent, isDetail ? "-left-24 -top-24 h-72 w-72" : "-left-10 -top-10 h-32 w-32")} />
      <div className={cn("absolute rounded-full bg-white/70", isDetail ? "right-10 top-12 h-44 w-44" : "right-4 top-5 h-20 w-20")} />
      <div className={cn("absolute rounded-full opacity-20", style.accent, isDetail ? "bottom-12 right-20 h-28 w-28" : "bottom-5 right-8 h-14 w-14")} />

      <div className={cn("relative flex h-full flex-col justify-between", isDetail ? "p-8" : isThumb ? "p-2" : "p-4")}>
        <div className="flex items-start justify-between gap-2">
          <span className={cn("rounded-full px-2 py-1 font-black text-white", style.accent, isDetail ? "text-sm" : "text-[10px]")}>{product.category}</span>
          <span className="rounded-full bg-white/80 px-2 py-1 text-[10px] font-black text-stone-700">{product.marketplace}</span>
        </div>

        <div className="grid flex-1 place-items-center">
          <div className={cn("grid place-items-center rounded-[2rem] bg-white/80 shadow-xl ring-1 ring-black/5", isDetail ? "h-64 w-64" : isThumb ? "h-12 w-12 rounded-xl" : "h-28 w-28 rounded-3xl")}>
            <Icon className={cn(style.text, isDetail ? "h-28 w-28" : isThumb ? "h-7 w-7" : "h-14 w-14")} strokeWidth={1.7} />
          </div>
        </div>

        {!isThumb ? (
          <div>
            <p className={cn("font-black leading-tight text-ink", isDetail ? "max-w-xl text-4xl" : "line-clamp-2 text-sm")}>{product.name}</p>
            <p className={cn("mt-1 font-bold text-stone-600", isDetail ? "text-base" : "text-[11px]")}>{product.origin_country} · {product.rating.toFixed(1)} rating</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
