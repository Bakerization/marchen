"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme; // resolved theme in use
  explicitTheme: Theme | null; // user-chosen value
  setTheme: (theme: Theme | null) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const getAutoTheme = (): Theme => {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18 ? "light" : "dark";
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [explicitTheme, setExplicitTheme] = useState<Theme | null>(null);
  const [autoTheme, setAutoTheme] = useState<Theme>(getAutoTheme);

  // Track system preference in case user wants to reset later
  const [systemTheme, setSystemTheme] = useState<Theme>(() =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark",
  );

  // Listen to system theme changes
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const handler = (event: MediaQueryListEvent) =>
      setSystemTheme(event.matches ? "light" : "dark");
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  // Load stored preference
  useEffect(() => {
    const stored = window.localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      setExplicitTheme(stored);
    }
  }, []);

  // Refresh auto theme periodically (every 30 min)
  useEffect(() => {
    const tick = () => setAutoTheme(getAutoTheme());
    const id = window.setInterval(tick, 30 * 60 * 1000);
    return () => window.clearInterval(id);
  }, []);

  const theme = useMemo<Theme>(
    () => explicitTheme ?? autoTheme,
    [explicitTheme, autoTheme],
  );

  // Apply to document
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.style.colorScheme = theme;
    if (explicitTheme) {
      window.localStorage.setItem("theme", explicitTheme);
    } else {
      window.localStorage.removeItem("theme");
    }
  }, [theme, explicitTheme]);

  const setTheme = (value: Theme | null) => setExplicitTheme(value);
  const toggleTheme = () => setExplicitTheme(theme === "light" ? "dark" : "light");

  const value = useMemo(
    () => ({ theme, explicitTheme, setTheme, toggleTheme }),
    [theme, explicitTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
};
