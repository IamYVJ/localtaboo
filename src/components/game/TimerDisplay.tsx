import { formatClock } from "../../utils/time";

interface TimerDisplayProps {
  remainingMs: number;
  totalMs: number;
  /** Show the warning treatment under this many ms remaining. */
  warningMs?: number;
  paused?: boolean;
}

/** Oversized, tabular countdown with a thin progress track. */
export function TimerDisplay({
  remainingMs,
  totalMs,
  warningMs = 10000,
  paused,
}: TimerDisplayProps) {
  const clamped = Math.max(0, remainingMs);
  const pct = totalMs > 0 ? Math.max(0, Math.min(100, (clamped / totalMs) * 100)) : 0;
  const warning = clamped <= warningMs && clamped > 0;
  return (
    <div className="wl-timer">
      <div className="wl-cluster wl-cluster--between">
        <span className="wl-eyebrow">{paused ? "Paused" : "Time left"}</span>
        <span
          className={`wl-timer__value ${warning ? "wl-timer__value--warning" : ""}`}
          role="timer"
          aria-live="off"
          aria-label={`${Math.ceil(clamped / 1000)} seconds remaining`}
          style={{ fontSize: "var(--text-2xl)" }}
        >
          {formatClock(clamped)}
        </span>
      </div>
      <div className="wl-timer__track">
        <div
          className={`wl-timer__fill ${warning ? "wl-timer__fill--warning" : ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
