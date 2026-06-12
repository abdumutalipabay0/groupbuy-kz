import { useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { useGroupBuyStore } from "@/lib/store";
import { NOTIFY_POLL_MS } from "@/lib/utils";

function webNotify(title: string, body: string): void {
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    try {
      new Notification(title, { body, icon: "/favicon.ico" });
    } catch {
      /* some browsers throw outside a user gesture — ignore */
    }
  }
}

/**
 * Real notifications: polls the teams the user actually joined and raises an
 * in-app + (if permitted) desktop notification when a teammate joins or a team
 * completes. Active only for logged-in users — preview mode uses the scripted
 * LiveActivity feed instead.
 */
export function useRealNotifications(): void {
  const token = useGroupBuyStore((s) => s.token);
  const preview = useGroupBuyStore((s) => s.preview);
  const push = useGroupBuyStore((s) => s.pushNotification);
  const snapshot = useRef<Map<string, { members: number; status: string }>>(new Map());
  const primed = useRef(false);

  useEffect(() => {
    if (!token || preview) return;
    snapshot.current.clear();
    primed.current = false;

    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }

    let stopped = false;
    async function poll() {
      try {
        const groups = await api.myGroups();
        for (const { group, product } of groups) {
          const prev = snapshot.current.get(group.id);
          snapshot.current.set(group.id, { members: group.current_members, status: group.status });
          if (!primed.current || !prev) continue;
          if (group.status === "completed" && prev.status !== "completed") {
            push({ text: `🎉 Команда на «${product.name}» собрана!`, kind: "complete", productId: product.id });
            webNotify("Команда собрана!", `«${product.name}» — цена открыта`);
          } else if (group.current_members > prev.members) {
            push({
              text: `В команду на «${product.name}» вступил участник (${group.current_members}/${group.threshold}) — цена снижается`,
              kind: "join",
              productId: product.id
            });
            webNotify("Новый участник в команде", `«${product.name}»: ${group.current_members}/${group.threshold}`);
          }
        }
        primed.current = true;
      } catch {
        /* transient — keep polling */
      }
    }

    poll();
    const id = setInterval(() => {
      if (!stopped) poll();
    }, NOTIFY_POLL_MS);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [token, preview, push]);
}
