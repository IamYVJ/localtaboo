import { useEffect, useState } from "react";

/**
 * Returns a periodically-updated timestamp for rendering countdowns.
 * Also updates immediately when the tab regains visibility so the display
 * catches up after being backgrounded.
 */
export function useNow(active: boolean, intervalMs = 250): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    const timer = window.setInterval(() => {
      if (!cancelled) setNow(Date.now());
    }, intervalMs);

    const onVisibility = () => {
      if (document.visibilityState === "visible") setNow(Date.now());
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [active, intervalMs]);

  return now;
}
