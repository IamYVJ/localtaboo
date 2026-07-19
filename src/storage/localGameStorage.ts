import type { GameState } from "../game/types";
import { readJSON, removeKey, STORAGE_KEYS, writeJSON } from "./safeStorage";

export interface SavedGame {
  savedAt: number;
  state: GameState;
}

/** Persist an in-progress Pass & Play game so it can be resumed later. */
export function saveUnfinishedGame(state: GameState): void {
  if (state.mode !== "pass-and-play") return;
  if (state.phase === "GAME_COMPLETE" || state.phase === "SETUP") return;
  writeJSON(STORAGE_KEYS.unfinishedGame, { savedAt: Date.now(), state });
}

export function loadUnfinishedGame(): SavedGame | null {
  const saved = readJSON<SavedGame | null>(STORAGE_KEYS.unfinishedGame, null);
  if (!saved || typeof saved !== "object" || !saved.state) return null;
  // Basic shape check — anything malformed is treated as absent.
  if (typeof saved.state.phase !== "string" || !Array.isArray(saved.state.teams)) {
    return null;
  }
  return saved;
}

export function hasUnfinishedGame(): boolean {
  return loadUnfinishedGame() !== null;
}

export function clearUnfinishedGame(): void {
  removeKey(STORAGE_KEYS.unfinishedGame);
}
