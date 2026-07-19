import { describe, expect, it } from "vitest";
import { gameReducer } from "./reducer";
import { initGame } from "./engine";
import { getCurrentClueGiver, getCurrentTeam } from "./selectors";
import { defaultRules } from "../config/defaultSettings";
import { fixtureCards } from "../tests/fixtures/deck";
import { makeConfig, makeTeams, playTurn, playTurnAndAdvance } from "../tests/helpers/gameHelpers";
import type { GameState } from "./types";

function start(state: GameState, now = 1_000): GameState {
  return gameReducer(state, { type: "START_ROUND", now });
}

describe("START_ROUND", () => {
  it("reveals a card, starts the timer and records the round", () => {
    const state = start(makeConfig());
    expect(state.phase).toBe("ROUND_ACTIVE");
    expect(state.currentCardId).not.toBeNull();
    expect(state.timer.endsAt).not.toBeNull();
    expect(state.currentRound?.teamId).toBe("t1");
    expect(state.currentRound?.clueGiver).toBe("Ana");
  });
});

describe("MARK_CORRECT", () => {
  it("awards points and advances to a new card", () => {
    const state = start(makeConfig());
    const firstCard = state.currentCardId!;
    const next = gameReducer(state, { type: "MARK_CORRECT", cardId: firstCard, now: 2_000 });
    expect(next.scores[0]!.score).toBe(1);
    expect(next.currentCardId).not.toBe(firstCard);
    expect(next.currentRound?.results).toHaveLength(1);
  });

  it("ignores a repeated press for an already-scored card", () => {
    const state = start(makeConfig());
    const firstCard = state.currentCardId!;
    const once = gameReducer(state, { type: "MARK_CORRECT", cardId: firstCard, now: 2_000 });
    const twice = gameReducer(once, { type: "MARK_CORRECT", cardId: firstCard, now: 2_100 });
    expect(twice).toBe(once);
    expect(twice.scores[0]!.score).toBe(1);
  });
});

describe("SKIP_CARD", () => {
  it("enforces the skip limit", () => {
    const state = start(makeConfig({ skipLimit: 1 }));
    const s1 = gameReducer(state, { type: "SKIP_CARD", cardId: state.currentCardId!, now: 2_000 });
    expect(s1.skipsUsedThisRound).toBe(1);
    const s2 = gameReducer(s1, { type: "SKIP_CARD", cardId: s1.currentCardId!, now: 2_100 });
    expect(s2.skipsUsedThisRound).toBe(1);
    expect(s2.currentCardId).toBe(s1.currentCardId);
  });

  it("optionally costs points", () => {
    const state = start(makeConfig({ skipsCostPoints: true, skipPenaltyValue: 1 }));
    // Give the team a point first so the skip has something to subtract.
    const scored = gameReducer(state, {
      type: "MARK_CORRECT",
      cardId: state.currentCardId!,
      now: 2_000,
    });
    const skipped = gameReducer(scored, {
      type: "SKIP_CARD",
      cardId: scored.currentCardId!,
      now: 2_100,
    });
    expect(skipped.scores[0]!.score).toBe(0);
  });
});

describe("APPLY_PENALTY", () => {
  it("subtracts points and advances the card when configured", () => {
    const state = start(makeConfig({ penaltyAdvancesCard: true, penaltyValue: 1 }));
    const scored = gameReducer(state, {
      type: "MARK_CORRECT",
      cardId: state.currentCardId!,
      now: 2_000,
    });
    const before = scored.currentCardId!;
    const penalised = gameReducer(scored, { type: "APPLY_PENALTY", cardId: before, now: 2_100 });
    expect(penalised.scores[0]!.score).toBe(0);
    expect(penalised.currentCardId).not.toBe(before);
  });

  it("keeps the same card when penalty does not advance", () => {
    const state = start(makeConfig({ penaltyAdvancesCard: false }));
    const before = state.currentCardId!;
    const penalised = gameReducer(state, { type: "APPLY_PENALTY", cardId: before, now: 2_100 });
    expect(penalised.currentCardId).toBe(before);
  });
});

describe("pause / resume", () => {
  it("freezes and restores the round", () => {
    const state = start(makeConfig());
    const paused = gameReducer(state, { type: "PAUSE_ROUND", now: 5_000 });
    expect(paused.phase).toBe("ROUND_PAUSED");
    expect(paused.timer.pausedRemainingMs).not.toBeNull();
    const resumed = gameReducer(paused, { type: "RESUME_ROUND", now: 8_000 });
    expect(resumed.phase).toBe("ROUND_ACTIVE");
    expect(resumed.timer.pausedRemainingMs).toBeNull();
  });
});

describe("TICK expiry", () => {
  it("finalizes the round when time runs out", () => {
    const state = start(makeConfig({ roundDurationSec: 30 }), 0);
    const scored = gameReducer(state, {
      type: "MARK_CORRECT",
      cardId: state.currentCardId!,
      now: 1_000,
    });
    const expired = gameReducer(scored, { type: "TICK", now: 30_001 });
    expect(expired.phase).toBe("ROUND_COMPLETE");
    expect(expired.history).toHaveLength(1);
    expect(expired.history[0]!.correctCount).toBe(1);
  });
});

describe("END_ROUND / rotation", () => {
  it("commits history, rotates the clue-giver and advances the turn", () => {
    const afterRound = playTurn(makeConfig(), { correct: 2 });
    expect(afterRound.phase).toBe("ROUND_COMPLETE");
    expect(afterRound.turnIndex).toBe(1);
    expect(afterRound.scores[0]!.roundsPlayed).toBe(1);
    expect(afterRound.teams[0]!.clueGiverIndex).toBe(1);

    const advanced = gameReducer(afterRound, { type: "ADVANCE_TURN", now: 70_000 });
    expect(advanced.phase).toBe("HANDOFF");
    expect(advanced.currentTeamIndex).toBe(1);
    expect(getCurrentTeam(advanced)?.id).toBe("t2");
  });

  it("rotates teams and clue-givers across a full cycle", () => {
    let state = makeConfig();
    state = playTurnAndAdvance(state, { correct: 1 }); // t1 → t2
    state = playTurnAndAdvance(state, { correct: 1 }); // t2 → t1, next cycle
    expect(state.currentTeamIndex).toBe(0);
    expect(state.roundNumber).toBe(2);
    // Alpha's second clue-giver is Ben.
    expect(getCurrentClueGiver(state)).toBe("Ben");
  });
});

describe("game completion", () => {
  it("ends with a winner once the target score is met at a cycle boundary", () => {
    let state = makeConfig({ targetScore: 2, roundsPerTeam: 20 });
    state = playTurnAndAdvance(state, { correct: 3 }); // t1 → 3
    const afterT2 = playTurn(state, { correct: 0 });
    const done = gameReducer(afterT2, { type: "ADVANCE_TURN", now: 200_000 });
    expect(done.phase).toBe("GAME_COMPLETE");
    expect(done.winnerTeamIds).toEqual(["t1"]);
    expect(done.isDraw).toBe(false);
  });

  it("ends on the round limit", () => {
    let state = makeConfig({ targetScore: 0, roundsPerTeam: 1, unlimitedRounds: false });
    state = playTurnAndAdvance(state, { correct: 2 }); // t1
    const afterT2 = playTurn(state, { correct: 1 }); // t2
    const done = gameReducer(afterT2, { type: "ADVANCE_TURN", now: 200_000 });
    expect(done.phase).toBe("GAME_COMPLETE");
    expect(done.winnerTeamIds).toEqual(["t1"]);
  });

  it("declares a draw when tied under the draw tiebreaker", () => {
    let state = makeConfig({ targetScore: 0, roundsPerTeam: 1, tiebreaker: "draw" });
    state = playTurnAndAdvance(state, { correct: 2 });
    const afterT2 = playTurn(state, { correct: 2 });
    const done = gameReducer(afterT2, { type: "ADVANCE_TURN", now: 200_000 });
    expect(done.phase).toBe("GAME_COMPLETE");
    expect(done.isDraw).toBe(true);
  });

  it("continues to a tiebreaker when tied under sudden-death", () => {
    let state = makeConfig({ targetScore: 0, roundsPerTeam: 1, tiebreaker: "sudden-death" });
    state = playTurnAndAdvance(state, { correct: 2 });
    const afterT2 = playTurn(state, { correct: 2 });
    const done = gameReducer(afterT2, { type: "ADVANCE_TURN", now: 200_000 });
    expect(done.phase).toBe("HANDOFF");
    expect(done.tiebreakerActive).toBe(true);
  });
});

describe("EDIT_ROUND_RESULT", () => {
  it("corrects a round and adjusts the team score by the difference", () => {
    const afterRound = playTurn(makeConfig(), { correct: 3 });
    const roundId = afterRound.history[0]!.roundId;
    expect(afterRound.scores[0]!.score).toBe(3);

    const edited = gameReducer(afterRound, {
      type: "EDIT_ROUND_RESULT",
      roundId,
      correctCount: 1,
      skipCount: 0,
      penaltyCount: 0,
      pointsEarned: 1,
    });
    expect(edited.scores[0]!.score).toBe(1);
    expect(edited.history[0]!.correctCount).toBe(1);
  });
});

describe("REMATCH", () => {
  it("resets scores, history and phase while keeping teams and rules", () => {
    let state = playTurnAndAdvance(makeConfig(), { correct: 2 });
    state = playTurn(state, { correct: 1 });
    const rematch = gameReducer(state, { type: "REMATCH", now: 500_000, seed: 99 });
    expect(rematch.phase).toBe("HANDOFF");
    expect(rematch.history).toHaveLength(0);
    expect(rematch.turnIndex).toBe(0);
    expect(rematch.scores.every((s) => s.score === 0)).toBe(true);
    expect(rematch.teams).toHaveLength(2);
    expect(rematch.seed).toBe(99);
  });
});

describe("duplicate prevention", () => {
  it("does not repeat a card within a turn until the pool is exhausted", () => {
    let state = start(
      initGame({
        mode: "pass-and-play",
        rules: { ...defaultRules, allowDuplicateCards: false },
        teams: makeTeams(),
        cards: fixtureCards,
        seed: 11,
      }),
    );
    const seen = new Set<string>();
    seen.add(state.currentCardId!);
    for (let i = 0; i < fixtureCards.length - 1; i += 1) {
      state = gameReducer(state, {
        type: "MARK_CORRECT",
        cardId: state.currentCardId!,
        now: 3_000 + i,
      });
      expect(seen.has(state.currentCardId!)).toBe(false);
      seen.add(state.currentCardId!);
    }
    expect(seen.size).toBe(fixtureCards.length);
  });
});
