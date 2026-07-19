import { describe, expect, it } from "vitest";
import {
  createTimer,
  isExpired,
  isRunning,
  pauseTimer,
  remainingMs,
  resumeTimer,
  startTimer,
} from "./timer";

describe("timer", () => {
  it("creates a stopped timer with the right duration", () => {
    const t = createTimer(60);
    expect(t.durationMs).toBe(60_000);
    expect(isRunning(t)).toBe(false);
    expect(remainingMs(t, 0)).toBe(60_000);
  });

  it("derives remaining time from the scheduled end, not from tick counts", () => {
    const t = startTimer(createTimer(60), 1_000);
    // Simulate the tab being backgrounded then resumed 45s later.
    expect(remainingMs(t, 1_000 + 45_000)).toBe(15_000);
    // A jump straight to expiry still reports zero, not a negative number.
    expect(remainingMs(t, 1_000 + 90_000)).toBe(0);
  });

  it("pauses and resumes without losing time", () => {
    const started = startTimer(createTimer(60), 0);
    const paused = pauseTimer(started, 20_000);
    expect(paused.pausedRemainingMs).toBe(40_000);
    expect(isRunning(paused)).toBe(false);
    // Time passes while paused; remaining is frozen.
    expect(remainingMs(paused, 999_999)).toBe(40_000);

    const resumed = resumeTimer(paused, 100_000);
    expect(remainingMs(resumed, 100_000)).toBe(40_000);
    expect(remainingMs(resumed, 120_000)).toBe(20_000);
  });

  it("reports expiry only when running and out of time", () => {
    const started = startTimer(createTimer(30), 0);
    expect(isExpired(started, 29_000)).toBe(false);
    expect(isExpired(started, 30_000)).toBe(true);
    const paused = pauseTimer(started, 10_000);
    expect(isExpired(paused, 999_999)).toBe(false);
  });
});
