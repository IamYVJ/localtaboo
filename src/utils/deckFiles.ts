import type { Deck } from "../game/types";

/** Serialise a deck to the portable import/export JSON shape. */
export function deckToJsonString(deck: Deck): string {
  return JSON.stringify(
    {
      name: deck.name,
      ...(deck.description ? { description: deck.description } : {}),
      cards: deck.cards.map((c) => ({
        word: c.word,
        forbidden: c.forbidden,
        ...(c.category ? { category: c.category } : {}),
        ...(c.difficulty ? { difficulty: c.difficulty } : {}),
      })),
    },
    null,
    2,
  );
}

/** Trigger a client-side download of text content. Nothing leaves the device. */
export function downloadTextFile(filename: string, text: string, type = "application/json"): void {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export interface ParsedDeckText {
  name?: string;
  cards: { word: string; forbidden: string[] }[];
}

/**
 * Parse the simple line-based deck format:
 *   #name: My Deck            (optional, sets the deck name)
 *   WORD = clue1, clue2, clue3 (or `|` / `:` as the separator)
 * Blank lines and lines starting with `#` (except `#name:`) are ignored.
 */
export function parseDeckText(text: string): ParsedDeckText {
  const cards: { word: string; forbidden: string[] }[] = [];
  let name: string | undefined;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const nameMatch = /^#\s*name\s*:\s*(.+)$/i.exec(line);
    if (nameMatch) {
      name = nameMatch[1]!.trim();
      continue;
    }
    if (line.startsWith("#")) continue;

    const sepIndex = [line.indexOf("="), line.indexOf("|"), line.indexOf(":")]
      .filter((i) => i >= 0)
      .sort((a, b) => a - b)[0];
    if (sepIndex === undefined) continue;

    const word = line.slice(0, sepIndex).trim();
    const forbidden = line
      .slice(sepIndex + 1)
      .split(",")
      .map((w) => w.trim())
      .filter((w) => w.length > 0);
    if (word) cards.push({ word, forbidden });
  }

  return name ? { name, cards } : { cards };
}
