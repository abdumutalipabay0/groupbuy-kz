import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck, PartyPopper, UserPlus } from "lucide-react";
import { useGroupBuyStore } from "@/lib/store";
import type { NotificationKind } from "@/types";

const ICONS: Record<NotificationKind, typeof Bell> = {
  join: UserPlus,
  complete: PartyPopper,
  info: Bell
};

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "только что";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} мин назад`;
  return `${Math.floor(m / 60)} ч назад`;
}

export function NotificationsBell() {
  const notifications = useGroupBuyStore((s) => s.notifications);
  const markRead = useGroupBuyStore((s) => s.markNotificationsRead);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread) markRead();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        data-testid="notif-bell"
        onClick={toggle}
        className="relative grid h-9 w-9 place-items-center rounded-full text-stone-500 transition hover:bg-white hover:shadow-sm"
        aria-label="Уведомления"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-fire-gradient px-1 text-[9px] font-black text-white shadow-glow">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="animate-slide-in-up absolute right-0 top-11 z-50 w-72 overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-lift">
          <div className="flex items-center justify-between border-b border-stone-100 px-3 py-2">
            <span className="text-sm font-black text-stone-900">Уведомления</span>
            {notifications.length > 0 && <CheckCheck size={15} className="text-emerald-500" />}
          </div>
          {notifications.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs font-medium text-stone-400">
              Пока пусто. Вступи в команду — и узнаешь, когда подтянутся друзья.
            </p>
          ) : (
            <div className="max-h-80 divide-y divide-stone-50 overflow-y-auto">
              {notifications.map((n) => {
                const Icon = ICONS[n.kind];
                const body = (
                  <div className="flex items-start gap-2.5 px-3 py-2.5 transition hover:bg-stone-50">
                    <span
                      className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-white ${
                        n.kind === "complete" ? "bg-mint-gradient" : "bg-fire-gradient"
                      }`}
                    >
                      <Icon size={14} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold leading-snug text-stone-800">{n.text}</p>
                      <p className="mt-0.5 text-[10px] font-bold text-stone-400">{timeAgo(n.ts)}</p>
                    </div>
                  </div>
                );
                return n.productId ? (
                  <Link key={n.id} to={`/product/${n.productId}`} onClick={() => setOpen(false)}>
                    {body}
                  </Link>
                ) : (
                  <div key={n.id}>{body}</div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
