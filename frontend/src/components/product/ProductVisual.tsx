import { useState } from "react";
import { Apple, Dumbbell, Headphones, Home, Keyboard, Laptop, Mouse, Shirt, Sparkles, Watch } from "lucide-react";
import type { Product } from "@/types";
import { cn } from "@/lib/utils";

interface ProductVisualProps {
  product: Product;
  className?: string;
  size?: "card" | "detail" | "thumb";
}

const categoryStyle: Record<string, { bg: string; accent: string; text: string; icon: typeof Laptop }> = {
  Electronics: { bg: "from-sky-100 via-white to-blue-200", accent: "bg-blue-600", text: "text-blue-600", icon: Laptop },
  Fashion:     { bg: "from-rose-100 via-white to-orange-100", accent: "bg-rose-500", text: "text-rose-500", icon: Shirt },
  Home:        { bg: "from-amber-100 via-white to-yellow-100", accent: "bg-amber-500", text: "text-amber-500", icon: Home },
  Sports:      { bg: "from-emerald-100 via-white to-lime-100", accent: "bg-emerald-600", text: "text-emerald-600", icon: Dumbbell },
  Beauty:      { bg: "from-fuchsia-100 via-white to-pink-100", accent: "bg-fuchsia-500", text: "text-fuchsia-500", icon: Sparkles },
  Food:        { bg: "from-lime-100 via-white to-emerald-100", accent: "bg-lime-600", text: "text-lime-700", icon: Apple },
};

function pickIcon(product: Product): typeof Laptop {
  const n = product.name.toLowerCase();
  if (n.includes("watch") || n.includes("garmin") || n.includes("forerunner")) return Watch;
  if (n.includes("headphone") || n.includes("soundcore") || n.includes("airpod")) return Headphones;
  if (n.includes("mouse")) return Mouse;
  if (n.includes("keyboard")) return Keyboard;
  return categoryStyle[product.category]?.icon ?? Laptop;
}

export function ProductVisual({ product, className, size = "card" }: ProductVisualProps) {
  const [imgError, setImgError] = useState(false);
  const style = categoryStyle[product.category] ?? categoryStyle.Electronics;
  const Icon = pickIcon(product);
  const hasImage = !!product.image_url && !imgError;
  const isDetail = size === "detail";
  const isThumb = size === "thumb";

  if (hasImage) {
    return (
      <div className={cn("relative overflow-hidden bg-stone-100", className)}>
        <img
          src={product.image_url}
          alt={product.name}
          loading={isDetail ? "eager" : "lazy"}
          className={`absolute inset-0 h-full w-full transition-transform duration-300 group-hover:scale-105 ${isDetail ? "object-cover" : "object-contain p-2"}`}
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  /* fallback: gradient + icon */
  return (
    <div className={cn("relative overflow-hidden bg-gradient-to-br", style.bg, className)}>
      <div className={cn("absolute rounded-full opacity-15 blur-2xl", style.accent, isDetail ? "-left-24 -top-24 h-72 w-72" : "-left-10 -top-10 h-32 w-32")} />
      <div className={cn("absolute rounded-full bg-white/70", isDetail ? "right-10 top-12 h-44 w-44" : "right-4 top-5 h-20 w-20")} />
      <div className="relative flex h-full items-center justify-center">
        <div className={cn("grid place-items-center rounded-3xl bg-white/80 shadow-lg ring-1 ring-black/5", isDetail ? "h-56 w-56" : isThumb ? "h-10 w-10 rounded-xl" : "h-24 w-24")}>
          <Icon className={cn(style.text, isDetail ? "h-24 w-24" : isThumb ? "h-6 w-6" : "h-12 w-12")} strokeWidth={1.5} />
        </div>
      </div>
    </div>
  );
}
