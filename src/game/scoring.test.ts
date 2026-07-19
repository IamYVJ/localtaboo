import { describe, expect, it } from "vitest";
import { applyOutcome, createTeamScore, pointsForOutcome, rankTeams } from "./scoring";
import { defaultRules } from "../config/defaultSettings";
import type { GameRules } from "./types";

const rules: GameRules = { ...defaultRules };

describe("pointsForOutcome", () => {
  it("awards the configured value for correct", () => {
    expect(pointsForOutcome("correct", rules)).toBe(1);
    expect(pointsForOutcome("correct", { ...rules, correctValue: 3 })).toBe(3);
  });

  it("only costs points for skips when configured", () => {
    expect(pointsForOutcome("skipped", { ...rules, skipsCostPoints: false })).toBe(0);
    expect(
      pointsForOutcome("skipped", { ...rules, skipsCostPoints: true, skipPenaltyValue: 2 }),
    ).toBe(-2);
  });

  it("deducts the penalty value", () => {
    expect(pointsForOutcome("penalty", { ...rules, penaltyValue: 1 })).toBe(-1);
  });
});

describe("applyOutcome", () => {
  it("never lets a score drop below zero", () => {
    const score = createTeamScore("t1");
    const penalised = applyOutcome(score, "penalty", -5);
    expect(penalised.score).toBe(0);
    expect(penalised.penalties).toBe(1);
  });

  it("tracks correct/skip counters", () => {
    let score = createTeamScore("t1");
    score = applyOutcome(score, "correct", 1);
    score = applyOutcome(score, "skipped", 0);
    expect(score).toMatchObject({ score: 1, correct: 1, skips: 1 });
  });
});

describe("rankTeams", () => {
  it("ranks by score and shares rank on ties", () => {
    const ranked = rankTeams([
      { teamId: "a", score: 5, correct: 5, skips: 0, penalties: 0, roundsPlayed: 1 },
      { teamId: "b", score: 8, correct: 8, skips: 0, penalties: 0, roundsPlayed: 1 },
      { teamId: "c", score: 8, correct: 8, skips: 0, penalties: 0, roundsPlayed: 1 },
    ]);
    expect(ranked[0]!.rank).toBe(1);
    expect(ranked[1]!.rank).toBe(1);
    expect(ranked[2]!.rank).toBe(3);
    expect(ranked[2]!.teamId).toBe("a");
  });
});
