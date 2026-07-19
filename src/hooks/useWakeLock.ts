import { useCallback, useEffect, useRef, useState } from "react";

type WakeLockSentinelLike = {
  released: boolean;
  release: () => Promise<void>;
  addEventListener: (type: "release", listener: () => void) => void;
};

type NavigatorWithWakeLock = Navigator & {
  wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinelLike> };
};

/**
 * Screen Wake Lock helper. Only requests after being called (which happens on a
 * user gesture), reacquires on visibility change, and degrades silently where
 * the API is unavailable.
 */
export function useWakeLock(): {
  supported: boolean;
  active: boolean;
  request: () => Promise<void>;
  release: () => Promise<void>;
} {
  const supported = typeof navigator !== "undefined" && "wakeLock" in navigator;
  const sentinelRef = useRef<WakeLockSentinelLike | null>(null);
  const wantLockRef = useRef(false);
  const [active, setActive] = useState(false);

  const request = useCallback(async () => {
    wantLockRef.current = true;
    if (!supported) return;
    try {
      const nav = navigator as NavigatorWithWakeLock;
      const sentinel = await nav.wakeLock!.request("screen");
      sentinelRef.current = sentinel;
      setActive(true);
      sentinel.addEventListener("release", () => {
        setActive(false);
        sentinelRef.current = null;
      });
    } catch {
      setActive(false);
    }
  }, [supported]);

  const release = useCallback(async () => {
    wantLockRef.current = false;
    const sentinel = sentinelRef.current;
    sentinelRef.current = null;
    setActive(false);
    if (sentinel && !sentinel.released) {
      try {
        await sentinel.release();
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === "visible" && wantLockRef.current && !sentinelRef.current) {
        void request();
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [request]);

  return { supported, active, request, release };
}
