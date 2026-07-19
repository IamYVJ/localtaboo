import { initGame } from "../../game/engine";
import { gameReducer } from "../../game/reducer";
import { defaultRules } from "../../config/defaultSettings";
import type { GameConfig, GameRules, GameState, TeamSetup } from "../../game/types";
import { fixtureCards } from "../fixtures/deck";

export function makeTeams(): TeamSetup[] {
  return [
    { id: "t1", name: "Alpha", players: ["Ana", "Ben"] },
    { id: "t2", name: "Bravo", players: ["Cara", "Dan"] },
  ];
}

export function makeConfig(overrides: Partial<GameRules> = {}, seed = 1): GameState {
  const config: GameConfig = {
    mode: "pass-and-play",
    rules: { ...defaultRules, ...overrides },
    teams: makeTeams(),
    cards: fixtureCards,
    seed,
  };
  return initGame(config);
}

/** Play a full turn scoring `correct` correct answers, then end the round. */
export function playTurn(
  state: GameState,
  options: { correct?: number; skips?: number; penalties?: number; startAt?: number } = {},
): GameState {
  const { correct = 0, skips = 0, penalties = 0, startAt = 1_000 } = options;
  let next = gameReducer(state, { type: "START_ROUND", now: startAt });

  for (let i = 0; i < correct; i += 1) {
    next = gameReducer(next, {
      type: "MARK_CORRECT",
      cardId: next.currentCardId!,
      now: startAt + i,
    });
  }
  for (let i = 0; i < skips; i += 1) {
    next = gameReducer(next, { type: "SKIP_CARD", cardId: next.currentCardId!, now: startAt + i });
  }
  for (let i = 0; i < penalties; i += 1) {
    next = gameReducer(next, {
      type: "APPLY_PENALTY",
      cardId: next.currentCardId!,
      now: startAt + i,
    });
  }

  next = gameReducer(next, { type: "END_ROUND", now: startAt + 60_000 });
  return next;
}

/** Complete one turn and advance to the next. */
export function playTurnAndAdvance(
  state: GameState,
  options: { correct?: number; skips?: number; penalties?: number; startAt?: number } = {},
): GameState {
  const afterRound = playTurn(state, options);
  return gameReducer(afterRound, {
    type: "ADVANCE_TURN",
    now: (options.startAt ?? 1_000) + 61_000,
  });
}
