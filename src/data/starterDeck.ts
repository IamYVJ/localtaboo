import type { Deck } from "../game/types";
import { validateImportedDeck } from "../game/validation";
import starterDeckRaw from "./starterDeck.json";

export const STARTER_DECK_ID = "starter";

/**
 * Load and validate the bundled starter deck at module init. If the JSON is
 * somehow malformed the app fails fast in development rather than shipping a
 * broken deck.
 */
function loadStarterDeck(): Deck {
  const result = validateImportedDeck(starterDeckRaw, "WORDLOCK Starter Deck");
  if (!result.valid || !result.deck) {
    throw new Error(`Starter deck failed validation: ${result.errors.join("; ")}`);
  }
  return {
    ...result.deck,
    id: STARTER_DECK_ID,
    source: "starter",
  };
}

export const starterDeck: Deck = loadStarterDeck();
