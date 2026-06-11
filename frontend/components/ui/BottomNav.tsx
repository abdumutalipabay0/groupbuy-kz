"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Grid2X2, Heart, ShoppingBag, ShoppingCart, User } from "lucide-react";

const TABS = [
  { label: "Главная", href: "/feed", icon: ShoppingBag },
  { label: "Каталог", href: "/groups", icon: Grid2X2 },
  { label: "Избранное", href: "/feed", icon: Heart },
  { label: "Корзина", href: "/feed", icon: ShoppingCart },
  { label: "Профиль", href: "/profile", icon: User },
];

const HIDDEN_PATHS = ["/register", "/join"];

export function BottomNav() {
  const pathname = usePathname();

  const shouldHide = HIDDEN_PATHS.some((p) => pathname.startsWith(p));
  if (shouldHide) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-200 bg-white">
      <div className="mx-auto flex max-w-md items-center justify-around">
        {TABS.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/feed" && pathname.startsWith(href));
          return (
            <Link
              key={label}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] font-semibold transition-colors ${
                isActive ? "text-primary" : "text-stone-400"
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
