"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Currency, Group, Language, User } from "@/types";

interface GroupBuyState {
  token: string | null;
  userProfile: User | null;
  activeGroups: Group[];
  setSession: (input: { user: User; token: string }) => void;
  setActiveGroups: (groups: Group[]) => void;
  upsertGroup: (group: Group) => void;
  clear: () => void;
}

export const DEMO_USER: User = {
  id: "u001",
  name: "Aruzhan",
  city: "Almaty",
  age: 24,
  interests: ["gaming", "electronics", "gadgets"],
  budget_usd: 120,
  sim_verified: true,
  currency_preference: "KZT",
  language: "ru"
};

export const useGroupBuyStore = create<GroupBuyState>()(
  persist(
    (set) => ({
      token: null,
      userProfile: null,
      activeGroups: [],
      setSession: ({ user, token }) => set({ userProfile: user, token }),
      setActiveGroups: (groups) => set({ activeGroups: groups }),
      upsertGroup: (group) =>
        set((state) => ({
          activeGroups: [group, ...state.activeGroups.filter((item) => item.id !== group.id)]
        })),
      clear: () => set({ token: null, userProfile: null, activeGroups: [] })
    }),
    {
      name: "groupbuy-session",
      partialize: (state) => ({
        token: state.token,
        userProfile: state.userProfile,
        activeGroups: state.activeGroups
      })
    }
  )
);

export function makeUserFromRegistration(input: {
  id: string;
  name: string;
  city: string;
  age: number;
  interests: string[];
  budget_usd: number;
  currency_preference: Currency;
  language: Language;
}): User {
  return {
    ...input,
    sim_verified: true
  };
}
