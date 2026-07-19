/**
 * Core domain types for the WORDLOCK game engine.
 * These types are framework-agnostic — the engine must run without React.
 */

export type Difficulty = "easy" | "medium" | "hard";

export interface WordCard {
  id: string;
  word: string;
  /** Exactly five forbidden words in the starter deck; validated at boundaries. */
  forbidden: string[];
  category?: string;
  difficulty?: Difficulty;
}

export interface Deck {
  id: string;
  name: string;
  description?: string;
  cards: WordCard[];
  source: "starter" | "imported";
  createdAt?: number;
}

export type ThemePreference = "light" | "dark" | "system";

export type GameMode = "pass-and-play" | "peer";

export type TiebreakerMode = "sudden-death" | "draw";

/** Configurable rules that affect gameplay. Persisted as user defaults. */
export interface GameRules {
  roundDurationSec: number;
  /** First team to reach this score can win. Set to 0 to disable score-based ending. */
  targetScore: number;
  /** Number of turns each team plays. Ignored when unlimitedRounds is true. */
  roundsPerTeam: number;
  unlimitedRounds: boolean;
  /** Maximum skips allowed per turn. -1 means unlimited. */
  skipLimit: number;
  skipsCostPoints: boolean;
  /** Points removed for a skip when skipsCostPoints is true. */
  skipPenaltyValue: number;
  /** Points removed for a rule violation. */
  penaltyValue: number;
  penaltyAdvancesCard: boolean;
  skippedCardsReturnToDeck: boolean;
  allowDuplicateCards: boolean;
  gesturesAllowed: boolean;
  spellingAllowed: boolean;
  correctValue: number;
  tiebreaker: TiebreakerMode;
}

/** Device-level preferences, persisted separately from per-game rules. */
export interface Preferences {
  theme: ThemePreference;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  onboardingComplete: boolean;
}

export interface TeamSetup {
  id: string;
  name: string;
  players: string[];
}

/** Everything needed to initialise a game. */
export interface GameConfig {
  mode: GameMode;
  rules: GameRules;
  teams: TeamSetup[];
  /** Resolved, combined card pool for this game (from active decks). */
  cards: WordCard[];
  /** Seed for the deterministic shuffle. Enables reproducible games and tests. */
  seed: number;
}

export type GamePhase =
  | "SETUP"
  | "LOBBY"
  | "HANDOFF"
  | "ROUND_READY"
  | "ROUND_ACTIVE"
  | "ROUND_PAUSED"
  | "ROUND_COMPLETE"
  | "CONNECTION_LOST"
  | "GAME_COMPLETE";

export interface Team {
  id: string;
  name: string;
  players: string[];
  /** Index into players for the current clue-giver; rotates each turn. */
  clueGiverIndex: number;
}

export interface TeamScore {
  teamId: string;
  score: number;
  correct: number;
  skips: number;
  penalties: number;
  roundsPlayed: number;
}

export type CardOutcome = "correct" | "skipped" | "penalty";

export interface CardResult {
  cardId: string;
  word: string;
  outcome: CardOutcome;
  pointsDelta: number;
  at: number;
}

export interface RoundRecord {
  roundId: string;
  /** 1-based cycle number (all teams playing once = one cycle). */
  roundNumber: number;
  teamId: string;
  teamName: string;
  clueGiver: string;
  startedAt: number;
  endedAt: number;
  durationSec: number;
  results: CardResult[];
  correctCount: number;
  skipCount: number;
  penaltyCount: number;
  pointsEarned: number;
}

/**
 * Timestamp-based timer. Remaining time is always derived from `endsAt`
 * so it stays accurate across backgrounded tabs and clock drift.
 */
export interface TimerState {
  durationMs: number;
  /** Epoch ms when the current running segment ends. null when not running. */
  endsAt: number | null;
  /** Remaining ms captured at pause. null when running or not started. */
  pausedRemainingMs: number | null;
}

export interface GameState {
  phase: GamePhase;
  mode: GameMode;
  rules: GameRules;
  teams: Team[];
  scores: TeamScore[];
  /** All cards keyed by id — the resolved pool for this game. */
  pool: Record<string, WordCard>;
  /** Shuffled queue of card ids to draw from. */
  queue: string[];
  queueIndex: number;
  /** Card ids already drawn this game (for duplicate prevention). */
  drawn: string[];
  currentCardId: string | null;
  currentTeamIndex: number;
  /** Increments once per completed turn. */
  turnIndex: number;
  roundNumber: number;
  timer: TimerState;
  currentRound: RoundRecord | null;
  history: RoundRecord[];
  skipsUsedThisRound: number;
  startedAt: number | null;
  completedAt: number | null;
  winnerTeamIds: string[];
  isDraw: boolean;
  tiebreakerActive: boolean;
  /** Monotonic state version for network synchronisation and stale rejection. */
  version: number;
  seed: number;
}

export type GameAction =
  | { type: "START_ROUND"; now: number }
  | { type: "MARK_CORRECT"; cardId: string; now: number }
  | { type: "SKIP_CARD"; cardId: string; now: number }
  | { type: "APPLY_PENALTY"; cardId: string; now: number }
  | { type: "PAUSE_ROUND"; now: number }
  | { type: "RESUME_ROUND"; now: number }
  | { type: "END_ROUND"; now: number }
  | { type: "TICK"; now: number }
  | {
      type: "EDIT_ROUND_RESULT";
      roundId: string;
      correctCount: number;
      skipCount: number;
      penaltyCount: number;
      pointsEarned: number;
    }
  | { type: "ADVANCE_TURN"; now: number }
  | { type: "REMATCH"; now: number; seed: number };

/** Result of evaluating whether the game is complete. */
export interface CompletionResult {
  complete: boolean;
  winnerTeamIds: string[];
  isDraw: boolean;
  needsTiebreaker: boolean;
}
