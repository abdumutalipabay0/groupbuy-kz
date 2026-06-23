import { Link, useLocation } from "react-router-dom";
import { Grid2X2, ShoppingBag, Sparkles, Store, User } from "lucide-react";
import { useT, type I18nKey } from "@/lib/i18n";
import { useGroupBuyStore } from "@/lib/store";

interface Tab {
  labelKey?: I18nKey;
  label?: string;
  href: string;
  icon: typeof ShoppingBag;
  activeOn: string[];
}

const HIDDEN_PATHS = ["/register", "/login", "/join"];

export function BottomNav() {
  const pathname = useLocation().pathname;
  const role = useGroupBuyStore((s) => s.userProfile?.role);
  const t = useT();

  const shouldHide = pathname === "/" || HIDDEN_PATHS.some((p) => pathname.startsWith(p));
  if (shouldHide) return null;

  // Sellers keep the catalog AND get their shop cabinet (5 tabs).
  const tabs: Tab[] = [
    { labelKey: "nav_home", href: "/feed", icon: ShoppingBag, activeOn: ["/feed", "/product"] },
    { labelKey: "nav_ai", href: "/ai", icon: Sparkles, activeOn: ["/ai"] },
    { labelKey: "nav_catalog", href: "/groups", icon: Grid2X2, activeOn: ["/groups"] },
    ...(role === "seller"
      ? [{ label: "Магазин", href: "/seller", icon: Store, activeOn: ["/seller"] } as Tab]
      : []),
    { labelKey: "nav_profile", href: "/profile", icon: User, activeOn: ["/profile"] }
  ];

  return (
    <nav className="fixed inset-x-3 bottom-3 z-50">
      <div className="glass mx-auto max-w-md rounded-2xl border border-white/60 shadow-nav">
        <div className={`grid ${tabs.length === 5 ? "grid-cols-5" : "grid-cols-4"} px-2 py-1.5`}>
          {tabs.map(({ labelKey, label, href, icon: Icon, activeOn }) => {
            const isActive = activeOn.some(
              (path) => pathname === path || pathname.startsWith(`${path}/`)
            );
            const text = labelKey ? t(labelKey) : label;
            return (
              <Link
                key={href}
                to={href}
                aria-current={isActive ? "page" : undefined}
                className="flex flex-col items-center gap-0.5 py-1 text-[10px] font-bold transition-colors"
              >
                <span
                  aria-hidden="true"
                  className={`grid h-8 w-14 place-items-center rounded-xl transition-[background-color,color] duration-200 ${
                    isActive ? "bg-primary/10 text-primary" : "text-inkSoft"
                  }`}
                >
                  <Icon size={21} strokeWidth={isActive ? 2.3 : 1.8} />
                </span>
                <span className={isActive ? "text-primary" : "text-inkSoft"}>{text}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
