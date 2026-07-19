import type { Deck } from "../game/types";
import { validateImportedDeck } from "../game/validation";
import { readJSON, STORAGE_KEYS, writeJSON } from "./safeStorage";

/**
 * Imported decks are re-validated on load so corrupted or tampered storage can
 * never inject unexpected content into the game.
 */
export function loadImportedDecks(): Deck[] {
  const raw = readJSON<unknown[]>(STORAGE_KEYS.importedDecks, []);
  if (!Array.isArray(raw)) return [];
  const decks: Deck[] = [];
  for (const entry of raw) {
    const result = validateImportedDeck(entry);
    if (result.valid && result.deck) {
      // Preserve the stored id/name where possible.
      const stored = entry as Partial<Deck>;
      decks.push({
        ...result.deck,
        id: typeof stored.id === "string" ? stored.id : result.deck.id,
        name: typeof stored.name === "string" ? stored.name : result.deck.name,
        createdAt: typeof stored.createdAt === "number" ? stored.createdAt : result.deck.createdAt,
      });
    }
  }
  return decks;
}

export function saveImportedDecks(decks: Deck[]): void {
  writeJSON(STORAGE_KEYS.importedDecks, decks);
}

export function loadActiveDeckIds(fallback: string[]): string[] {
  const stored = readJSON<string[]>(STORAGE_KEYS.activeDeckIds, fallback);
  return Array.isArray(stored) && stored.length > 0 ? stored : fallback;
}

export function saveActiveDeckIds(ids: string[]): void {
  writeJSON(STORAGE_KEYS.activeDeckIds, ids);
}
