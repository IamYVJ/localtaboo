import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { gameReducer, initGame, randomSeed } from "../game/engine";
import type { GameAction, GameConfig, GameState } from "../game/types";
import { clearUnfinishedGame, saveUnfinishedGame } from "../storage/localGameStorage";

/**
 * Local game provider for Pass & Play and for the host side of a peer game.
 * It wraps the pure {@link gameReducer} with a nullable container so a game
 * can be started, resumed, and cleared without unmounting consumers.
 */

type MetaAction =
  { type: "INIT"; state: GameState } | { type: "CLEAR" } | { type: "GAME"; action: GameAction };

function metaReducer(state: GameState | null, action: MetaAction): GameState | null {
  switch (action.type) {
    case "INIT":
      return action.state;
    case "CLEAR":
      return null;
    case "GAME":
      return state ? gameReducer(state, action.action) : state;
    default:
      return state;
  }
}

interface GameContextValue {
  game: GameState | null;
  startGame: (config: GameConfig) => GameState;
  resumeGame: (state: GameState) => void;
  clearGame: () => void;
  dispatch: (action: GameAction) => void;
  startRound: () => void;
  markCorrect: (cardId: string) => void;
  skipCard: (cardId: string) => void;
  applyPenalty: (cardId: string) => void;
  pauseRound: () => void;
  resumeRound: () => void;
  endRound: () => void;
  advanceTurn: () => void;
  editRoundResult: (
    roundId: string,
    counts: { correctCount: number; skipCount: number; penaltyCount: number; pointsEarned: number },
  ) => void;
  rematch: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [game, dispatchMeta] = useReducer(metaReducer, null);

  const startGame = useCallback((config: GameConfig): GameState => {
    const state = initGame(config);
    dispatchMeta({ type: "INIT", state });
    return state;
  }, []);

  const resumeGame = useCallback((state: GameState) => {
    dispatchMeta({ type: "INIT", state });
  }, []);

  const clearGame = useCallback(() => {
    dispatchMeta({ type: "CLEAR" });
    clearUnfinishedGame();
  }, []);

  const dispatch = useCallback((action: GameAction) => {
    dispatchMeta({ type: "GAME", action });
  }, []);

  const startRound = useCallback(
    () => dispatch({ type: "START_ROUND", now: Date.now() }),
    [dispatch],
  );
  const markCorrect = useCallback(
    (cardId: string) => dispatch({ type: "MARK_CORRECT", cardId, now: Date.now() }),
    [dispatch],
  );
  const skipCard = useCallback(
    (cardId: string) => dispatch({ type: "SKIP_CARD", cardId, now: Date.now() }),
    [dispatch],
  );
  const applyPenalty = useCallback(
    (cardId: string) => dispatch({ type: "APPLY_PENALTY", cardId, now: Date.now() }),
    [dispatch],
  );
  const pauseRound = useCallback(
    () => dispatch({ type: "PAUSE_ROUND", now: Date.now() }),
    [dispatch],
  );
  const resumeRound = useCallback(
    () => dispatch({ type: "RESUME_ROUND", now: Date.now() }),
    [dispatch],
  );
  const endRound = useCallback(() => dispatch({ type: "END_ROUND", now: Date.now() }), [dispatch]);
  const advanceTurn = useCallback(
    () => dispatch({ type: "ADVANCE_TURN", now: Date.now() }),
    [dispatch],
  );
  const editRoundResult = useCallback(
    (
      roundId: string,
      counts: {
        correctCount: number;
        skipCount: number;
        penaltyCount: number;
        pointsEarned: number;
      },
    ) => dispatch({ type: "EDIT_ROUND_RESULT", roundId, ...counts }),
    [dispatch],
  );
  const rematch = useCallback(
    () => dispatch({ type: "REMATCH", now: Date.now(), seed: randomSeed() }),
    [dispatch],
  );

  // Auto-expire the timer while a round is active. TICK is a no-op until the
  // deadline passes, so React bails out on the unchanged state reference.
  useEffect(() => {
    if (!game || game.phase !== "ROUND_ACTIVE") return;
    const interval = window.setInterval(() => {
      dispatch({ type: "TICK", now: Date.now() });
    }, 250);
    return () => window.clearInterval(interval);
  }, [game, dispatch]);

  // Persist / clear the resumable Pass & Play game as it progresses.
  useEffect(() => {
    if (!game) return;
    if (game.mode !== "pass-and-play") return;
    if (game.phase === "GAME_COMPLETE") {
      clearUnfinishedGame();
      return;
    }
    saveUnfinishedGame(game);
  }, [game]);

  const value = useMemo<GameContextValue>(
    () => ({
      game,
      startGame,
      resumeGame,
      clearGame,
      dispatch,
      startRound,
      markCorrect,
      skipCard,
      applyPenalty,
      pauseRound,
      resumeRound,
      endRound,
      advanceTurn,
      editRoundResult,
      rematch,
    }),
    [
      game,
      startGame,
      resumeGame,
      clearGame,
      dispatch,
      startRound,
      markCorrect,
      skipCard,
      applyPenalty,
      pauseRound,
      resumeRound,
      endRound,
      advanceTurn,
      editRoundResult,
      rematch,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
