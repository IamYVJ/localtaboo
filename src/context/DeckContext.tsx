import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { resolvePool } from "../game/deck";
import { validateImportedDeck, type DeckValidationResult } from "../game/validation";
import type { Deck, WordCard } from "../game/types";
import { STARTER_DECK_ID, starterDeck } from "../data/starterDeck";
import {
  loadActiveDeckIds,
  loadImportedDecks,
  saveActiveDeckIds,
  saveImportedDecks,
} from "../storage/deckStorage";

interface DeckContextValue {
  decks: Deck[];
  importedDecks: Deck[];
  activeDeckIds: string[];
  activeCards: WordCard[];
  activeCardCount: number;
  getDeckById: (id: string) => Deck | undefined;
  importDeck: (raw: unknown, fallbackName?: string) => DeckValidationResult;
  removeDeck: (id: string) => void;
  toggleDeckActive: (id: string) => void;
  resetToStarter: () => void;
}

const DeckContext = createContext<DeckContextValue | null>(null);

export function DeckProvider({ children }: { children: ReactNode }) {
  const [importedDecks, setImportedDecks] = useState<Deck[]>(() => loadImportedDecks());
  const [activeDeckIds, setActiveDeckIds] = useState<string[]>(() =>
    loadActiveDeckIds([STARTER_DECK_ID]),
  );

  const decks = useMemo<Deck[]>(() => [starterDeck, ...importedDecks], [importedDecks]);

  const persistImported = useCallback((next: Deck[]) => {
    setImportedDecks(next);
    saveImportedDecks(next);
  }, []);

  const persistActive = useCallback((next: string[]) => {
    const safe = next.length > 0 ? next : [STARTER_DECK_ID];
    setActiveDeckIds(safe);
    saveActiveDeckIds(safe);
  }, []);

  const importDeck = useCallback(
    (raw: unknown, fallbackName = "Imported deck"): DeckValidationResult => {
      const result = validateImportedDeck(raw, fallbackName);
      if (result.valid && result.deck) {
        const deck = result.deck;
        persistImported([...importedDecks.filter((d) => d.id !== deck.id), deck]);
        persistActive([...new Set([...activeDeckIds, deck.id])]);
      }
      return result;
    },
    [importedDecks, activeDeckIds, persistImported, persistActive],
  );

  const removeDeck = useCallback(
    (id: string) => {
      if (id === STARTER_DECK_ID) return;
      persistImported(importedDecks.filter((d) => d.id !== id));
      persistActive(activeDeckIds.filter((activeId) => activeId !== id));
    },
    [importedDecks, activeDeckIds, persistImported, persistActive],
  );

  const toggleDeckActive = useCallback(
    (id: string) => {
      persistActive(
        activeDeckIds.includes(id)
          ? activeDeckIds.filter((activeId) => activeId !== id)
          : [...activeDeckIds, id],
      );
    },
    [activeDeckIds, persistActive],
  );

  const resetToStarter = useCallback(() => {
    persistImported([]);
    persistActive([STARTER_DECK_ID]);
  }, [persistImported, persistActive]);

  const activeCards = useMemo<WordCard[]>(() => {
    const active = decks.filter((d) => activeDeckIds.includes(d.id));
    const lists = (active.length > 0 ? active : [starterDeck]).map((d) => d.cards);
    return resolvePool(lists);
  }, [decks, activeDeckIds]);

  const value = useMemo<DeckContextValue>(
    () => ({
      decks,
      importedDecks,
      activeDeckIds,
      activeCards,
      activeCardCount: activeCards.length,
      getDeckById: (id) => decks.find((d) => d.id === id),
      importDeck,
      removeDeck,
      toggleDeckActive,
      resetToStarter,
    }),
    [
      decks,
      importedDecks,
      activeDeckIds,
      activeCards,
      importDeck,
      removeDeck,
      toggleDeckActive,
      resetToStarter,
    ],
  );

  return <DeckContext.Provider value={value}>{children}</DeckContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDecks(): DeckContextValue {
  const ctx = useContext(DeckContext);
  if (!ctx) throw new Error("useDecks must be used within DeckProvider");
  return ctx;
}
