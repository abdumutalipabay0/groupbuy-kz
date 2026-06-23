import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: ReactNode;
}

const variants = {
  primary:
    "bg-fire-gradient text-white shadow-glow hover:brightness-110 disabled:shadow-none",
  secondary: "bg-panelSoft text-ink hover:brightness-95 dark:hover:brightness-110",
  ghost: "bg-transparent text-ink hover:bg-black/5 dark:hover:bg-white/5",
  danger: "bg-coral text-white hover:brightness-90"
};

export function Button({ className, variant = "primary", icon, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-[transform,background-color,box-shadow,filter] duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
        variants[variant],
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
