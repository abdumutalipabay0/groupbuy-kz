"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Grid2X2, ShoppingBag, User } from "lucide-react";

const TABS = [
  { label: "Главная", href: "/feed", icon: ShoppingBag, activeOn: ["/feed", "/product"] },
  { label: "Каталог", href: "/groups", icon: Grid2X2, activeOn: ["/groups"] },
  { label: "Профиль", href: "/profile", icon: User, activeOn: ["/profile"] },
];

const HIDDEN_PATHS = ["/register", "/join"];

export function BottomNav() {
  const pathname = usePathname();

  const shouldHide = HIDDEN_PATHS.some((p) => pathname.startsWith(p));
  if (shouldHide) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-3">
        {TABS.map(({ label, href, icon: Icon, activeOn }) => {
          const isActive = activeOn.some((path) => pathname === path || pathname.startsWith(`${path}/`));
          return (
            <Link
              key={label}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-2.5 text-[10px] font-semibold transition-colors ${
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
