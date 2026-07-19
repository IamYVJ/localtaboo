/**
 * Typed, host-authoritative wire protocol for peer-to-peer play.
 *
 * The host runs the single source-of-truth game engine. Guests never mutate
 * game state directly — they send *intents* which the host validates and applies,
 * then broadcasts the resulting view. Card content is redacted from the public
 * view and delivered privately only to the active clue-giver's device.
 */

import type { GameRules, GameState, WordCard } from "../game/types";

/** Bumped when the message shape changes. Mismatched peers are refused. */
export const PROTOCOL_VERSION = 1;

/** Hard cap on any single decoded message. Larger frames are rejected outright. */
export const MAX_MESSAGE_BYTES = 128 * 1024;

/** Heartbeat cadence and the silence window after which a peer is considered gone. */
export const HEARTBEAT_INTERVAL_MS = 3000;
export const HEARTBEAT_TIMEOUT_MS = 9000;

/**
 * The game state minus everything that could reveal card identities or answers.
 * `pool`, `queue`, `drawn`, and `seed` never leave the host.
 */
export type PublicGameView = Omit<GameState, "pool" | "queue" | "drawn" | "seed">;

/** Build the redacted view that is safe to broadcast to every guest. */
export function toPublicView(state: GameState): PublicGameView {
  const clone: Partial<GameState> = { ...state };
  delete clone.pool;
  delete clone.queue;
  delete clone.drawn;
  delete clone.seed;
  return clone as PublicGameView;
}

/** A single card delivered privately to the clue-giver. */
export type PrivateCard = WordCard | null;

export interface RosterEntry {
  peerId: string;
  name: string;
  teamId: string | null;
  connected: boolean;
  isHost: boolean;
}

export interface LobbyView {
  hostName: string;
  teams: { id: string; name: string }[];
  roster: RosterEntry[];
  rules: GameRules;
  canStart: boolean;
}

/** Gameplay actions a guest may request. The host maps these onto engine actions. */
export type NetworkIntent =
  | { kind: "startRound" }
  | { kind: "markCorrect"; cardId: string }
  | { kind: "skipCard"; cardId: string }
  | { kind: "applyPenalty"; cardId: string }
  | { kind: "pauseRound" }
  | { kind: "resumeRound" }
  | { kind: "endRound" }
  | { kind: "advanceTurn" };

// ---- Guest → Host ----
export type ClientMessage =
  | { t: "hello"; protocol: number; name: string }
  | { t: "chooseTeam"; teamId: string | null }
  | { t: "intent"; stateVersion: number; intent: NetworkIntent }
  | { t: "ping"; ts: number }
  | { t: "pong"; ts: number };

// ---- Host → Guest ----
export type HostMessage =
  | { t: "welcome"; protocol: number; peerId: string; hostName: string }
  | { t: "lobby"; lobby: LobbyView }
  | { t: "state"; view: PublicGameView }
  | { t: "card"; card: PrivateCard }
  | { t: "error"; code: string; message: string }
  | { t: "kicked"; reason: string }
  | { t: "ping"; ts: number }
  | { t: "pong"; ts: number };

// ---- Constructors (kept tiny so call sites stay declarative) ----

export const hostMsg = {
  welcome: (peerId: string, hostName: string): HostMessage => ({
    t: "welcome",
    protocol: PROTOCOL_VERSION,
    peerId,
    hostName,
  }),
  lobby: (lobby: LobbyView): HostMessage => ({ t: "lobby", lobby }),
  state: (view: PublicGameView): HostMessage => ({ t: "state", view }),
  card: (card: PrivateCard): HostMessage => ({ t: "card", card }),
  error: (code: string, message: string): HostMessage => ({ t: "error", code, message }),
  kicked: (reason: string): HostMessage => ({ t: "kicked", reason }),
  ping: (): HostMessage => ({ t: "ping", ts: Date.now() }),
  pong: (ts: number): HostMessage => ({ t: "pong", ts }),
};

export const clientMsg = {
  hello: (name: string): ClientMessage => ({ t: "hello", protocol: PROTOCOL_VERSION, name }),
  chooseTeam: (teamId: string | null): ClientMessage => ({ t: "chooseTeam", teamId }),
  intent: (stateVersion: number, intent: NetworkIntent): ClientMessage => ({
    t: "intent",
    stateVersion,
    intent,
  }),
  ping: (): ClientMessage => ({ t: "ping", ts: Date.now() }),
  pong: (ts: number): ClientMessage => ({ t: "pong", ts }),
};
