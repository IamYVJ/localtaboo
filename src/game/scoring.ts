import type { CardOutcome, GameRules, TeamScore } from "./types";

/** Point change for a given outcome, per the active rules. Never below zero net is enforced elsewhere. */
export function pointsForOutcome(outcome: CardOutcome, rules: GameRules): number {
  switch (outcome) {
    case "correct":
      return rules.correctValue;
    case "skipped":
      return rules.skipsCostPoints ? -rules.skipPenaltyValue : 0;
    case "penalty":
      return -rules.penaltyValue;
  }
}

/** Return a new TeamScore with an outcome applied. Scores may not go below zero. */
export function applyOutcome(score: TeamScore, outcome: CardOutcome, delta: number): TeamScore {
  const next: TeamScore = { ...score, score: Math.max(0, score.score + delta) };
  if (outcome === "correct") next.correct += 1;
  else if (outcome === "skipped") next.skips += 1;
  else if (outcome === "penalty") next.penalties += 1;
  return next;
}

export function createTeamScore(teamId: string): TeamScore {
  return { teamId, score: 0, correct: 0, skips: 0, penalties: 0, roundsPlayed: 0 };
}

export interface RankedTeam extends TeamScore {
  rank: number;
}

/** Rank teams by score (desc). Equal scores share a rank. */
export function rankTeams(scores: readonly TeamScore[]): RankedTeam[] {
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  let lastScore = Number.POSITIVE_INFINITY;
  let lastRank = 0;
  return sorted.map((score, index) => {
    if (score.score < lastScore) {
      lastRank = index + 1;
      lastScore = score.score;
    }
    return { ...score, rank: lastRank };
  });
}
