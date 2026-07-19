import { remainingSkips } from "./rules";
import { rankTeams, type RankedTeam } from "./scoring";
import { remainingMs } from "./timer";
import type { GameState, RoundRecord, Team, TeamScore, WordCard } from "./types";

export function getCurrentCard(state: GameState): WordCard | null {
  return state.currentCardId ? (state.pool[state.currentCardId] ?? null) : null;
}

export function getCurrentTeam(state: GameState): Team | undefined {
  return state.teams[state.currentTeamIndex];
}

export function getCurrentClueGiver(state: GameState): string {
  const team = getCurrentTeam(state);
  if (!team || team.players.length === 0) return "";
  return team.players[team.clueGiverIndex] ?? "";
}

export function getRemainingMs(state: GameState, now: number): number {
  return remainingMs(state.timer, now);
}

export function getRemainingSkips(state: GameState): number {
  return remainingSkips(state.rules, state.skipsUsedThisRound);
}

export function getLastRound(state: GameState): RoundRecord | undefined {
  return state.history[state.history.length - 1];
}

export function teamName(state: GameState, teamId: string): string {
  return state.teams.find((t) => t.id === teamId)?.name ?? "Team";
}

export interface ScoreboardEntry extends RankedTeam {
  name: string;
}

export function getScoreboard(state: GameState): ScoreboardEntry[] {
  return rankTeams(state.scores).map((entry) => ({
    ...entry,
    name: teamName(state, entry.teamId),
  }));
}

export function getWinners(state: GameState): Team[] {
  return state.teams.filter((t) => state.winnerTeamIds.includes(t.id));
}

export interface TeamStatistics {
  teamId: string;
  name: string;
  score: number;
  correct: number;
  skips: number;
  penalties: number;
  roundsPlayed: number;
}

export interface BestRound {
  roundNumber: number;
  teamName: string;
  clueGiver: string;
  points: number;
}

export interface GameStatistics {
  totalCorrect: number;
  totalSkips: number;
  totalPenalties: number;
  bestRound: BestRound | null;
  durationSec: number;
  perTeam: TeamStatistics[];
}

export function computeStatistics(state: GameState): GameStatistics {
  const totals = state.scores.reduce(
    (acc, s: TeamScore) => {
      acc.correct += s.correct;
      acc.skips += s.skips;
      acc.penalties += s.penalties;
      return acc;
    },
    { correct: 0, skips: 0, penalties: 0 },
  );

  let bestRound: BestRound | null = null;
  for (const round of state.history) {
    if (!bestRound || round.pointsEarned > bestRound.points) {
      bestRound = {
        roundNumber: round.roundNumber,
        teamName: round.teamName,
        clueGiver: round.clueGiver,
        points: round.pointsEarned,
      };
    }
  }

  const durationSec =
    state.startedAt && state.completedAt
      ? Math.max(0, Math.round((state.completedAt - state.startedAt) / 1000))
      : state.history.reduce((sum, r) => sum + r.durationSec, 0);

  const perTeam: TeamStatistics[] = state.scores.map((s) => ({
    teamId: s.teamId,
    name: teamName(state, s.teamId),
    score: s.score,
    correct: s.correct,
    skips: s.skips,
    penalties: s.penalties,
    roundsPlayed: s.roundsPlayed,
  }));

  return {
    totalCorrect: totals.correct,
    totalSkips: totals.skips,
    totalPenalties: totals.penalties,
    bestRound,
    durationSec,
    perTeam,
  };
}
