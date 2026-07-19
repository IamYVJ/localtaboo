import { describe, expect, it } from "vitest";
import {
  canSkip,
  clueGiverName,
  evaluateCompletion,
  isCycleBoundary,
  remainingSkips,
  rotateClueGiver,
} from "./rules";
import { defaultRules } from "../config/defaultSettings";
import type { GameRules, Team } from "./types";

const rules: GameRules = { ...defaultRules };

describe("skip rules", () => {
  it("respects a finite skip limit", () => {
    expect(canSkip({ ...rules, skipLimit: 2 }, 1)).toBe(true);
    expect(canSkip({ ...rules, skipLimit: 2 }, 2)).toBe(false);
  });

  it("treats -1 as unlimited", () => {
    expect(canSkip({ ...rules, skipLimit: -1 }, 100)).toBe(true);
    expect(remainingSkips({ ...rules, skipLimit: -1 }, 5)).toBe(Infinity);
  });
});

describe("clue-giver rotation", () => {
  const team: Team = { id: "t", name: "T", players: ["A", "B", "C"], clueGiverIndex: 0 };

  it("advances and wraps", () => {
    let next = rotateClueGiver(team);
    expect(clueGiverName(next)).toBe("B");
    next = rotateClueGiver(next);
    next = rotateClueGiver(next);
    expect(clueGiverName(next)).toBe("A");
  });

  it("is a no-op with no players", () => {
    const empty: Team = { id: "t", name: "T", players: [], clueGiverIndex: 0 };
    expect(rotateClueGiver(empty)).toEqual(empty);
    expect(clueGiverName(empty)).toBe("");
  });
});

describe("evaluateCompletion", () => {
  const base = { teamCount: 2, rules };

  it("does not complete mid-cycle", () => {
    expect(isCycleBoundary(1, 2)).toBe(false);
    const result = evaluateCompletion({
      ...base,
      turnIndex: 1,
      scores: [
        { teamId: "a", score: 99 },
        { teamId: "b", score: 0 },
      ],
    });
    expect(result.complete).toBe(false);
  });

  it("completes with a unique leader once the target is reached", () => {
    const result = evaluateCompletion({
      ...base,
      turnIndex: 2,
      rules: { ...rules, targetScore: 10 },
      scores: [
        { teamId: "a", score: 12 },
        { teamId: "b", score: 4 },
      ],
    });
    expect(result).toMatchObject({ complete: true, winnerTeamIds: ["a"], isDraw: false });
  });

  it("declares a draw when tied and tiebreaker is draw", () => {
    const result = evaluateCompletion({
      ...base,
      turnIndex: 2,
      rules: { ...rules, targetScore: 10, tiebreaker: "draw" },
      scores: [
        { teamId: "a", score: 12 },
        { teamId: "b", score: 12 },
      ],
    });
    expect(result).toMatchObject({ complete: true, isDraw: true });
    expect(result.winnerTeamIds.sort()).toEqual(["a", "b"]);
  });

  it("requests a tiebreaker when tied and sudden-death", () => {
    const result = evaluateCompletion({
      ...base,
      turnIndex: 2,
      rules: { ...rules, targetScore: 10, tiebreaker: "sudden-death" },
      scores: [
        { teamId: "a", score: 12 },
        { teamId: "b", score: 12 },
      ],
    });
    expect(result).toMatchObject({ complete: false, needsTiebreaker: true });
  });

  it("completes on the round limit", () => {
    const result = evaluateCompletion({
      ...base,
      turnIndex: 4,
      rules: { ...rules, targetScore: 0, roundsPerTeam: 2, unlimitedRounds: false },
      scores: [
        { teamId: "a", score: 3 },
        { teamId: "b", score: 1 },
      ],
    });
    expect(result).toMatchObject({ complete: true, winnerTeamIds: ["a"] });
  });
});
