// lib/stores/sampleTrayStore.ts
//
// Zustand store backing the new sample-tray feature.
//
// Scope: HIDES ONLY. Finished products never enter the tray — they go
// straight to the unified review page via a deep link.
//
// State is persisted to localStorage (key `pge-sample-tray`) so the tray
// survives a refresh.
"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const SAMPLE_TRAY_LIMIT = 3;

// An abandoned tray (added to, then never checked out) is reset after this
// many ms of inactivity, rather than sitting in localStorage forever. Any
// add/remove touches the clock, so an actively-used tray never expires
// mid-session — only a genuinely abandoned one does.
const TRAY_EXPIRY_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

export interface SampleTrayItem {
  productId: string;
  productName: string;
  hideType: string;
  grade?: string;
  thickness?: string;
  tanningMethod?: string;
  finish?: string;
  image?: string;
}

export interface SampleTrayState {
  items: SampleTrayItem[];
  lastActivityAt: number;
  addHide: (hide: SampleTrayItem) => boolean;
  removeHide: (productId: string) => void;
  clearTray: () => void;
  isFull: () => boolean;
  isInTray: (productId: string) => boolean;
}

export const useSampleTrayStore = create<SampleTrayState>()(
  persist(
    (set, get) => ({
      items: [],
      lastActivityAt: Date.now(),

      addHide: (hide) => {
        const { items } = get();
        if (items.length >= SAMPLE_TRAY_LIMIT) return false;
        if (items.some((i) => i.productId === hide.productId)) return false;
        set({ items: [...items, hide], lastActivityAt: Date.now() });
        return true;
      },

      removeHide: (productId) => {
        set({
          items: get().items.filter((i) => i.productId !== productId),
          lastActivityAt: Date.now(),
        });
      },

      clearTray: () => set({ items: [], lastActivityAt: Date.now() }),

      isFull: () => get().items.length >= SAMPLE_TRAY_LIMIT,

      isInTray: (productId) => get().items.some((i) => i.productId === productId),
    }),
    {
      name: "pge-sample-tray",
      storage: createJSONStorage(() => {
        // Defensive: localStorage is unavailable on the server and during
        // certain privacy-mode browsers. Falling back to an in-memory shim
        // keeps the store usable without crashing.
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
            clear: () => {},
            key: () => null,
            length: 0,
          } as Storage;
        }
        return window.localStorage;
      }),
      // Only persist the items array (plus the activity timestamp used for
      // expiry below). Methods are part of the store but should not be
      // serialized.
      partialize: (state) => ({ items: state.items, lastActivityAt: state.lastActivityAt }),
      version: 1,
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          // Corrupted entry (e.g. malformed JSON from manual tampering) —
          // zustand already falls back to the initial in-memory state
          // (items: []) rather than crashing; this just surfaces that
          // instead of failing silently.
          console.warn("Sample tray: failed to restore from localStorage, starting empty.", error);
          return;
        }
        // Legacy entries persisted before `lastActivityAt` existed are left
        // alone here (they get a fresh clock via the initial state's
        // default and a grace period) rather than being wiped immediately.
        if (state && state.items.length > 0 && Date.now() - state.lastActivityAt > TRAY_EXPIRY_MS) {
          state.clearTray();
        }
      },
    }
  )
);
