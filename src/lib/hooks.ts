"use client";
import { useEffect, useState } from "react";

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

// null until we know — lets callers wait for a real answer instead of
// guessing and causing a layout flash between breakpoints.
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [query]);
  return matches;
}

export function useIsDesktop() {
  return useMediaQuery("(min-width: 768px)");
}

// Tailwind's "xl" breakpoint — where the companion switches from a
// mobile floating toggle to a docked sidebar.
export function useIsXl() {
  return useMediaQuery("(min-width: 1280px)");
}
