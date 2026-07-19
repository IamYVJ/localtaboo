import type { TimerState } from "./types";

/**
 * Timestamp-based timer helpers. Remaining time is always computed from the
 * scheduled end time so it stays accurate even when the tab is backgrounded
 * and interval ticks are throttled or dropped.
 */

export function createTimer(durationSec: number): TimerState {
  return {
    durationMs: Math.max(0, Math.round(durationSec * 1000)),
    endsAt: null,
    pausedRemainingMs: null,
  };
}

export function startTimer(timer: TimerState, now: number): TimerState {
  return {
    ...timer,
    endsAt: now + timer.durationMs,
    pausedRemainingMs: null,
  };
}

export function pauseTimer(timer: TimerState, now: number): TimerState {
  if (timer.endsAt === null || timer.pausedRemainingMs !== null) {
    return timer;
  }
  return {
    ...timer,
    pausedRemainingMs: Math.max(0, timer.endsAt - now),
    endsAt: null,
  };
}

export function resumeTimer(timer: TimerState, now: number): TimerState {
  if (timer.pausedRemainingMs === null) {
    return timer;
  }
  return {
    ...timer,
    endsAt: now + timer.pausedRemainingMs,
    pausedRemainingMs: null,
  };
}

export function remainingMs(timer: TimerState, now: number): number {
  if (timer.pausedRemainingMs !== null) {
    return timer.pausedRemainingMs;
  }
  if (timer.endsAt === null) {
    return timer.durationMs;
  }
  return Math.max(0, timer.endsAt - now);
}

export function isRunning(timer: TimerState): boolean {
  return timer.endsAt !== null && timer.pausedRemainingMs === null;
}

export function isExpired(timer: TimerState, now: number): boolean {
  return isRunning(timer) && remainingMs(timer, now) <= 0;
}
