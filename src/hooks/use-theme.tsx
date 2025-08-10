import { useCallback, useEffect, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "theme-preference";

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark") return stored;
    } catch (e) {
      // ignore
    }
    return getSystemTheme();
  });

  useEffect(() => {
    // applique la classe `dark` sur <html>
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      // ignore
    }
  }, [theme]);

  // écoute le changement de préférence système (optionnel mais sympa)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handle = (e: MediaQueryListEvent) => {
      // si l'utilisateur n'a pas choisi manuellement (on suppose que si localStorage a une valeur on respecte)
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored !== "light" && stored !== "dark") {
          setTheme(e.matches ? "dark" : "light");
        }
      } catch {
        // ignore
      }
    };
    if (mq && mq.addEventListener) {
      mq.addEventListener("change", handle);
      return () => mq.removeEventListener("change", handle);
    } else if (mq && (mq as any).addListener) {
      // fallback older browsers
      (mq as any).addListener(handle);
      return () => (mq as any).removeListener(handle);
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const setLight = useCallback(() => setTheme("light"), []);
  const setDark = useCallback(() => setTheme("dark"), []);

  return { theme, toggle, setLight, setDark } as const;
}
