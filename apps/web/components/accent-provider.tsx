'use client';

import * as React from 'react';

export const ACCENT_OPTIONS = ['#3b82f6', '#6366f1', '#10b981', '#f97316', '#e4e4e7'] as const;
export type Accent = (typeof ACCENT_OPTIONS)[number];

const STORAGE_KEY = 'vector-accent';

interface AccentContextValue {
  accent: Accent;
  setAccent: (accent: Accent) => void;
}

const AccentContext = React.createContext<AccentContextValue | null>(null);

function hexToSoft(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},0.14)`;
}

function apply(accent: string) {
  const root = document.documentElement;
  root.style.setProperty('--primary', accent);
  root.style.setProperty('--primary-soft', hexToSoft(accent));
}

export function AccentProvider({ children }: { children: React.ReactNode }) {
  const [accent, setAccentState] = React.useState<Accent>('#3b82f6');

  React.useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Accent | null;
    if (stored && ACCENT_OPTIONS.includes(stored)) {
      setAccentState(stored);
      apply(stored);
    }
  }, []);

  const setAccent = React.useCallback((next: Accent) => {
    setAccentState(next);
    apply(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  return <AccentContext.Provider value={{ accent, setAccent }}>{children}</AccentContext.Provider>;
}

export function useAccent() {
  const ctx = React.useContext(AccentContext);
  if (!ctx) throw new Error('useAccent must be used within AccentProvider');
  return ctx;
}
