import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppNotification, Group, User } from "@/types";

interface GroupBuyState {
  token: string | null;
  userProfile: User | null;
  activeGroups: Group[];
  lang: "ru" | "kz";
  theme: "light" | "dark";
  preview: boolean;
  notifications: AppNotification[];
  setSession: (input: { user: User; token: string }) => void;
  setActiveGroups: (groups: Group[]) => void;
  upsertGroup: (group: Group) => void;
  setLang: (lang: "ru" | "kz") => void;
  setTheme: (theme: "light" | "dark") => void;
  enterPreview: () => void;
  pushNotification: (n: Pick<AppNotification, "text" | "kind"> & { productId?: string }) => void;
  markNotificationsRead: () => void;
  clear: () => void;
}

let notifSeq = 0;

export const DEMO_USER: User = {
  id: "u001",
  name: "Aruzhan",
  city: "Almaty",
  age: 24,
  interests: ["gaming", "electronics", "gadgets"],
  budget_usd: 120,
  sim_verified: true,
  currency_preference: "KZT",
  language: "ru",
  role: "buyer",
  phone: ""
};

export const useGroupBuyStore = create<GroupBuyState>()(
  persist(
    (set) => ({
      token: null,
      userProfile: null,
      activeGroups: [],
      lang: "ru",
      theme: "light",
      preview: false,
      notifications: [],
      setSession: ({ user, token }) =>
        set({ userProfile: user, token, preview: false, notifications: [] }),
      setActiveGroups: (groups) => set({ activeGroups: groups }),
      upsertGroup: (group) =>
        set((state) => ({
          activeGroups: [group, ...state.activeGroups.filter((item) => item.id !== group.id)]
        })),
      setLang: (lang) => set({ lang }),
      setTheme: (theme) => set({ theme }),
      enterPreview: () =>
        set({ preview: true, token: null, userProfile: DEMO_USER, notifications: [] }),
      pushNotification: ({ text, kind, productId }) =>
        set((state) => ({
          notifications: [
            { id: `n${++notifSeq}-${Date.now()}`, text, kind, productId, ts: Date.now(), read: false },
            ...state.notifications
          ].slice(0, 30)
        })),
      markNotificationsRead: () =>
        set((state) => ({ notifications: state.notifications.map((n) => ({ ...n, read: true })) })),
      clear: () =>
        set({ token: null, userProfile: null, activeGroups: [], preview: false, notifications: [] })
    }),
    {
      name: "groupbuy-session",
      partialize: (state) => ({
        token: state.token,
        userProfile: state.userProfile,
        activeGroups: state.activeGroups,
        lang: state.lang,
        theme: state.theme,
        preview: state.preview
      })
    }
  )
);

