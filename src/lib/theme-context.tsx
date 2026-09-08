"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { palettes, type ThemeMode, type ThemePalette } from "./theme";

const STORAGE_KEY = "dlsu-tracker-theme";

const ThemeModeContext = createContext<{ mode: ThemeMode; toggle: () => void }>({
  mode: "dark",
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("dark");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") setMode(stored);
  }, []);

  useEffect(() => {
    document.documentElement.style.colorScheme = mode;
    document.documentElement.dataset.theme = mode;
  }, [mode]);

  const toggle = () => {
    setMode((m) => {
      const next: ThemeMode = m === "dark" ? "light" : "dark";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  };

  return <ThemeModeContext.Provider value={{ mode, toggle }}>{children}</ThemeModeContext.Provider>;
}

export function useThemeMode() {
  return useContext(ThemeModeContext);
}

export function useTheme(): ThemePalette {
  const { mode } = useThemeMode();
  return palettes[mode];
}
