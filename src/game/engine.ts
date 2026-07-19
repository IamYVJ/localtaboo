import { buildQueue } from "./deck";
import { createTeamScore } from "./scoring";
import { createTimer } from "./timer";
import type { GameConfig, GameState, TeamSetup, WordCard } from "./types";
import { createId } from "../utils/ids";

export { gameReducer } from "./reducer";

/** Build an initial, ready-to-play game state from a validated configuration. */
export function initGame(config: GameConfig): GameState {
  const pool: Record<string, WordCard> = {};
  for (const card of config.cards) {
    pool[card.id] = card;
  }

  const teams = config.teams.map((team) => ({
    id: team.id,
    name: team.name,
    players: [...team.players],
    clueGiverIndex: 0,
  }));

  return {
    phase: "HANDOFF",
    mode: config.mode,
    rules: { ...config.rules },
    teams,
    scores: teams.map((team) => createTeamScore(team.id)),
    pool,
    queue: buildQueue(config.cards, config.seed),
    queueIndex: 0,
    drawn: [],
    currentCardId: null,
    currentTeamIndex: 0,
    turnIndex: 0,
    roundNumber: 1,
    timer: createTimer(config.rules.roundDurationSec),
    currentRound: null,
    history: [],
    skipsUsedThisRound: 0,
    startedAt: null,
    completedAt: null,
    winnerTeamIds: [],
    isDraw: false,
    tiebreakerActive: false,
    version: 1,
    seed: config.seed,
  };
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}

export function createTeamSetup(name: string, players: string[] = []): TeamSetup {
  return { id: createId("team"), name, players };
}
