import type { CompletionResult, GameRules, Team } from "./types";

/** Whether the clue-giver may skip again this turn. */
export function canSkip(rules: GameRules, skipsUsedThisRound: number): boolean {
  if (rules.skipLimit < 0) return true;
  return skipsUsedThisRound < rules.skipLimit;
}

export function remainingSkips(rules: GameRules, skipsUsedThisRound: number): number {
  if (rules.skipLimit < 0) return Infinity;
  return Math.max(0, rules.skipLimit - skipsUsedThisRound);
}

export function isCycleBoundary(turnIndex: number, teamCount: number): boolean {
  return teamCount > 0 && turnIndex > 0 && turnIndex % teamCount === 0;
}

export function cyclesCompleted(turnIndex: number, teamCount: number): number {
  return teamCount > 0 ? Math.floor(turnIndex / teamCount) : 0;
}

/** Advance the clue-giver for a team to the next player in rotation. */
export function rotateClueGiver(team: Team): Team {
  if (team.players.length === 0) {
    return team;
  }
  return {
    ...team,
    clueGiverIndex: (team.clueGiverIndex + 1) % team.players.length,
  };
}

export function clueGiverName(team: Team | undefined): string {
  if (!team || team.players.length === 0) return "";
  return team.players[team.clueGiverIndex] ?? "";
}

/**
 * Evaluate whether the game should end. Ending is only considered at a complete
 * cycle boundary so every team has played an equal number of turns.
 */
export function evaluateCompletion(params: {
  turnIndex: number;
  teamCount: number;
  scores: { teamId: string; score: number }[];
  rules: GameRules;
}): CompletionResult {
  const { turnIndex, teamCount, scores, rules } = params;
  const notComplete: CompletionResult = {
    complete: false,
    winnerTeamIds: [],
    isDraw: false,
    needsTiebreaker: false,
  };

  if (!isCycleBoundary(turnIndex, teamCount)) {
    return notComplete;
  }

  const reachedTarget = rules.targetScore > 0 && scores.some((s) => s.score >= rules.targetScore);
  const reachedRoundLimit =
    !rules.unlimitedRounds && cyclesCompleted(turnIndex, teamCount) >= rules.roundsPerTeam;

  if (!reachedTarget && !reachedRoundLimit) {
    return notComplete;
  }

  const topScore = scores.reduce((max, s) => Math.max(max, s.score), -Infinity);
  const leaders = scores.filter((s) => s.score === topScore).map((s) => s.teamId);

  if (leaders.length === 1) {
    return { complete: true, winnerTeamIds: leaders, isDraw: false, needsTiebreaker: false };
  }

  // Tie among leaders.
  if (rules.tiebreaker === "draw") {
    return { complete: true, winnerTeamIds: leaders, isDraw: true, needsTiebreaker: false };
  }
  return { complete: false, winnerTeamIds: leaders, isDraw: false, needsTiebreaker: true };
}
