import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "blue" | "green" | "coral" | "slate";
}

const tones = {
  blue: "bg-primary/10 text-primary ring-primary/20",
  green: "bg-mint/10 text-emerald-700 ring-mint/20",
  coral: "bg-coral/10 text-orange-700 ring-coral/20",
  slate: "bg-black/5 text-stone-700 ring-black/10"
};

export function Badge({ className, tone = "slate", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
