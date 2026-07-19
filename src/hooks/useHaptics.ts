import { useCallback } from "react";

export type HapticPattern = "tap" | "correct" | "skip" | "penalty" | "warning" | "end";

const PATTERNS: Record<HapticPattern, number | number[]> = {
  tap: 10,
  correct: 20,
  skip: [10, 40, 10],
  penalty: [40, 60, 40],
  warning: [20, 40, 20, 40],
  end: [60, 80, 120],
};

/** Vibration feedback, gated on the user preference and device support. */
export function useHaptics(enabled: boolean): (pattern: HapticPattern) => void {
  return useCallback(
    (pattern: HapticPattern) => {
      if (!enabled) return;
      if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
      try {
        navigator.vibrate(PATTERNS[pattern]);
      } catch {
        // Vibration can throw if disallowed; ignore.
      }
    },
    [enabled],
  );
}
