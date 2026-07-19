import { buildQueue, drawNext, returnCardToQueue } from "./deck";
import {
  canSkip,
  clueGiverName,
  cyclesCompleted,
  evaluateCompletion,
  rotateClueGiver,
} from "./rules";
import { applyOutcome, createTeamScore, pointsForOutcome } from "./scoring";
import { createTimer, isExpired, pauseTimer, remainingMs, resumeTimer, startTimer } from "./timer";
import type {
  CardOutcome,
  CardResult,
  GameAction,
  GameState,
  RoundRecord,
  TeamScore,
} from "./types";
import { createId } from "../utils/ids";

function bumpVersion(state: GameState): GameState {
  return { ...state, version: state.version + 1 };
}

function updateTeamScore(
  scores: TeamScore[],
  teamId: string,
  outcome: CardOutcome,
  delta: number,
): TeamScore[] {
  return scores.map((s) => (s.teamId === teamId ? applyOutcome(s, outcome, delta) : s));
}

function commitResult(round: RoundRecord, result: CardResult): RoundRecord {
  const next: RoundRecord = {
    ...round,
    results: [...round.results, result],
    pointsEarned: round.pointsEarned + result.pointsDelta,
  };
  if (result.outcome === "correct") next.correctCount += 1;
  else if (result.outcome === "skipped") next.skipCount += 1;
  else if (result.outcome === "penalty") next.penaltyCount += 1;
  return next;
}

/** Draw a card and record it as current. */
function withDrawnCard(state: GameState, avoidId: string | null): GameState {
  const draw = drawNext({
    queue: state.queue,
    queueIndex: state.queueIndex,
    drawn: state.drawn,
    seed: state.seed,
    avoidId,
  });
  return {
    ...state,
    queue: draw.queue,
    queueIndex: draw.queueIndex,
    drawn: draw.drawn,
    currentCardId: draw.cardId,
  };
}

function recordOutcome(state: GameState, outcome: CardOutcome, now: number): GameState {
  if (state.phase !== "ROUND_ACTIVE" || state.currentCardId === null || !state.currentRound) {
    return state;
  }
  const card = state.pool[state.currentCardId];
  if (!card) return state;

  const team = state.teams[state.currentTeamIndex];
  if (!team) return state;

  const delta = pointsForOutcome(outcome, state.rules);
  const result: CardResult = {
    cardId: card.id,
    word: card.word,
    outcome,
    pointsDelta: delta,
    at: now,
  };

  const scores = updateTeamScore(state.scores, team.id, outcome, delta);
  const currentRound = commitResult(state.currentRound, result);

  return { ...state, scores, currentRound };
}

function finalizeRound(state: GameState, now: number): GameState {
  if (!state.currentRound) return state;
  const team = state.teams[state.currentTeamIndex];
  const durationSec = Math.min(
    state.rules.roundDurationSec,
    Math.max(0, Math.round((now - state.currentRound.startedAt) / 1000)),
  );
  const finalizedRound: RoundRecord = {
    ...state.currentRound,
    endedAt: now,
    durationSec,
  };

  const scores = state.scores.map((s) =>
    team && s.teamId === team.id ? { ...s, roundsPlayed: s.roundsPlayed + 1 } : s,
  );

  const teams = state.teams.map((t, i) => (i === state.currentTeamIndex ? rotateClueGiver(t) : t));

  return bumpVersion({
    ...state,
    phase: "ROUND_COMPLETE",
    scores,
    teams,
    history: [...state.history, finalizedRound],
    currentRound: null,
    currentCardId: null,
    turnIndex: state.turnIndex + 1,
    timer: createTimer(state.rules.roundDurationSec),
    skipsUsedThisRound: 0,
  });
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_ROUND": {
      if (state.phase !== "HANDOFF" && state.phase !== "ROUND_READY") return state;
      const team = state.teams[state.currentTeamIndex];
      if (!team) return state;

      const drawn = withDrawnCard(state, null);
      const round: RoundRecord = {
        roundId: createId("round"),
        roundNumber: state.roundNumber,
        teamId: team.id,
        teamName: team.name,
        clueGiver: clueGiverName(team),
        startedAt: action.now,
        endedAt: action.now,
        durationSec: 0,
        results: [],
        correctCount: 0,
        skipCount: 0,
        penaltyCount: 0,
        pointsEarned: 0,
      };

      return bumpVersion({
        ...drawn,
        phase: "ROUND_ACTIVE",
        timer: startTimer(createTimer(state.rules.roundDurationSec), action.now),
        currentRound: round,
        skipsUsedThisRound: 0,
        startedAt: state.startedAt ?? action.now,
      });
    }

    case "MARK_CORRECT": {
      if (state.phase !== "ROUND_ACTIVE" || action.cardId !== state.currentCardId) return state;
      const scored = recordOutcome(state, "correct", action.now);
      return bumpVersion(withDrawnCard(scored, state.currentCardId));
    }

    case "SKIP_CARD": {
      if (state.phase !== "ROUND_ACTIVE" || action.cardId !== state.currentCardId) return state;
      if (!canSkip(state.rules, state.skipsUsedThisRound)) return state;
      const scored = recordOutcome(state, "skipped", action.now);
      const withReturn = state.rules.skippedCardsReturnToDeck
        ? { ...scored, queue: returnCardToQueue(scored.queue, action.cardId) }
        : scored;
      const advanced = withDrawnCard(withReturn, state.currentCardId);
      return bumpVersion({ ...advanced, skipsUsedThisRound: state.skipsUsedThisRound + 1 });
    }

    case "APPLY_PENALTY": {
      if (state.phase !== "ROUND_ACTIVE" || action.cardId !== state.currentCardId) return state;
      const scored = recordOutcome(state, "penalty", action.now);
      if (state.rules.penaltyAdvancesCard) {
        return bumpVersion(withDrawnCard(scored, state.currentCardId));
      }
      return bumpVersion(scored);
    }

    case "PAUSE_ROUND": {
      if (state.phase !== "ROUND_ACTIVE") return state;
      return bumpVersion({
        ...state,
        phase: "ROUND_PAUSED",
        timer: pauseTimer(state.timer, action.now),
      });
    }

    case "RESUME_ROUND": {
      if (state.phase !== "ROUND_PAUSED") return state;
      return bumpVersion({
        ...state,
        phase: "ROUND_ACTIVE",
        timer: resumeTimer(state.timer, action.now),
      });
    }

    case "TICK": {
      if (state.phase === "ROUND_ACTIVE" && isExpired(state.timer, action.now)) {
        return finalizeRound(state, state.timer.endsAt ?? action.now);
      }
      return state;
    }

    case "END_ROUND": {
      if (state.phase !== "ROUND_ACTIVE" && state.phase !== "ROUND_PAUSED") return state;
      const now =
        state.phase === "ROUND_PAUSED"
          ? state.currentRound
            ? state.currentRound.startedAt +
              (state.rules.roundDurationSec * 1000 - remainingMs(state.timer, action.now))
            : action.now
          : action.now;
      return finalizeRound(state, now);
    }

    case "EDIT_ROUND_RESULT": {
      if (state.phase !== "ROUND_COMPLETE") return state;
      const roundIndex = state.history.findIndex((r) => r.roundId === action.roundId);
      if (roundIndex < 0) return state;
      const round = state.history[roundIndex]!;

      const deltaPoints = action.pointsEarned - round.pointsEarned;
      const deltaCorrect = action.correctCount - round.correctCount;
      const deltaSkip = action.skipCount - round.skipCount;
      const deltaPenalty = action.penaltyCount - round.penaltyCount;

      const updatedRound: RoundRecord = {
        ...round,
        pointsEarned: action.pointsEarned,
        correctCount: action.correctCount,
        skipCount: action.skipCount,
        penaltyCount: action.penaltyCount,
      };

      const history = state.history.map((r, i) => (i === roundIndex ? updatedRound : r));
      const scores = state.scores.map((s) =>
        s.teamId === round.teamId
          ? {
              ...s,
              score: Math.max(0, s.score + deltaPoints),
              correct: Math.max(0, s.correct + deltaCorrect),
              skips: Math.max(0, s.skips + deltaSkip),
              penalties: Math.max(0, s.penalties + deltaPenalty),
            }
          : s,
      );

      return bumpVersion({ ...state, history, scores });
    }

    case "ADVANCE_TURN": {
      if (state.phase !== "ROUND_COMPLETE") return state;
      const completion = evaluateCompletion({
        turnIndex: state.turnIndex,
        teamCount: state.teams.length,
        scores: state.scores,
        rules: state.rules,
      });

      if (completion.complete) {
        return bumpVersion({
          ...state,
          phase: "GAME_COMPLETE",
          completedAt: action.now,
          winnerTeamIds: completion.winnerTeamIds,
          isDraw: completion.isDraw,
        });
      }

      const nextTeamIndex = state.turnIndex % state.teams.length;
      return bumpVersion({
        ...state,
        phase: "HANDOFF",
        currentTeamIndex: nextTeamIndex,
        roundNumber: cyclesCompleted(state.turnIndex, state.teams.length) + 1,
        tiebreakerActive: completion.needsTiebreaker || state.tiebreakerActive,
        timer: createTimer(state.rules.roundDurationSec),
        skipsUsedThisRound: 0,
      });
    }

    case "REMATCH": {
      const cards = Object.values(state.pool);
      const teams = state.teams.map((t) => ({ ...t, clueGiverIndex: 0 }));
      return {
        ...state,
        phase: "HANDOFF",
        teams,
        scores: teams.map((t) => createTeamScore(t.id)),
        queue: buildQueue(cards, action.seed),
        queueIndex: 0,
        drawn: [],
        currentCardId: null,
        currentTeamIndex: 0,
        turnIndex: 0,
        roundNumber: 1,
        timer: createTimer(state.rules.roundDurationSec),
        currentRound: null,
        history: [],
        skipsUsedThisRound: 0,
        startedAt: null,
        completedAt: null,
        winnerTeamIds: [],
        isDraw: false,
        tiebreakerActive: false,
        version: state.version + 1,
        seed: action.seed,
      };
    }

    default:
      return state;
  }
}
