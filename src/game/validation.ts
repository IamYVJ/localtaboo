import { settingBounds } from "../config/defaultSettings";
import { slugId } from "../utils/ids";
import { sanitizeText, sanitizeWord } from "../utils/sanitization";
import type { Deck, Difficulty, GameRules, WordCard } from "./types";

export const DECK_LIMITS = {
  maxCards: 2000,
  minForbidden: 1,
  maxForbidden: 8,
  recommendedForbidden: 5,
  wordMaxLength: 48,
  forbiddenMaxLength: 40,
  nameMaxLength: 60,
} as const;

const DIFFICULTIES: readonly Difficulty[] = ["easy", "medium", "hard"];

export interface DeckValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  deck: Deck | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Validate and sanitise a single raw card. Returns null with reasons on failure. */
export function validateCard(
  raw: unknown,
  index: number,
): { card: WordCard | null; errors: string[] } {
  const errors: string[] = [];
  if (!isRecord(raw)) {
    return { card: null, errors: [`Card ${index + 1}: expected an object.`] };
  }

  const word = sanitizeWord(raw.word, DECK_LIMITS.wordMaxLength);
  if (!word) {
    errors.push(`Card ${index + 1}: missing a target word.`);
  }

  if (!Array.isArray(raw.forbidden)) {
    errors.push(`Card ${index + 1} ("${word || "?"}"): forbidden must be a list.`);
    return { card: null, errors };
  }

  const forbidden = raw.forbidden
    .map((entry) => sanitizeWord(entry, DECK_LIMITS.forbiddenMaxLength))
    .filter((entry) => entry.length > 0);

  if (forbidden.length < DECK_LIMITS.minForbidden) {
    errors.push(`Card ${index + 1} ("${word || "?"}"): needs at least one forbidden word.`);
  }
  if (forbidden.length > DECK_LIMITS.maxForbidden) {
    errors.push(
      `Card ${index + 1} ("${word || "?"}"): too many forbidden words (max ${DECK_LIMITS.maxForbidden}).`,
    );
  }

  const difficulty =
    typeof raw.difficulty === "string" && DIFFICULTIES.includes(raw.difficulty as Difficulty)
      ? (raw.difficulty as Difficulty)
      : undefined;

  const category =
    typeof raw.category === "string" ? sanitizeText(raw.category, 40) || undefined : undefined;

  if (errors.length > 0) {
    return { card: null, errors };
  }

  const id =
    typeof raw.id === "string" && raw.id.trim().length > 0
      ? sanitizeText(raw.id, 64)
      : slugId("card", word);

  const card: WordCard = {
    id,
    word,
    forbidden: forbidden.slice(0, DECK_LIMITS.maxForbidden),
    ...(category ? { category } : {}),
    ...(difficulty ? { difficulty } : {}),
  };
  return { card, errors: [] };
}

/**
 * Validate a raw imported deck. Accepts either `{ name, cards: [...] }` or a
 * bare array of cards. All content is sanitised; nothing is ever rendered as HTML.
 */
export function validateImportedDeck(
  raw: unknown,
  fallbackName = "Imported deck",
): DeckValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  let rawCards: unknown[];
  let name = fallbackName;
  let description: string | undefined;

  if (Array.isArray(raw)) {
    rawCards = raw;
  } else if (isRecord(raw) && Array.isArray(raw.cards)) {
    rawCards = raw.cards;
    if (typeof raw.name === "string")
      name = sanitizeText(raw.name, DECK_LIMITS.nameMaxLength) || name;
    if (typeof raw.description === "string") description = sanitizeText(raw.description, 200);
  } else {
    return {
      valid: false,
      errors: ['The file must be a JSON array of cards or an object with a "cards" list.'],
      warnings,
      deck: null,
    };
  }

  if (rawCards.length === 0) {
    return { valid: false, errors: ["The deck contains no cards."], warnings, deck: null };
  }
  if (rawCards.length > DECK_LIMITS.maxCards) {
    return {
      valid: false,
      errors: [`The deck is too large (max ${DECK_LIMITS.maxCards} cards).`],
      warnings,
      deck: null,
    };
  }

  const cards: WordCard[] = [];
  const seenWords = new Set<string>();
  const seenIds = new Set<string>();

  rawCards.forEach((rawCard, index) => {
    const { card, errors: cardErrors } = validateCard(rawCard, index);
    if (!card) {
      errors.push(...cardErrors);
      return;
    }
    const wordKey = card.word.toLowerCase();
    if (seenWords.has(wordKey)) {
      warnings.push(`Duplicate word skipped: "${card.word}".`);
      return;
    }
    let uniqueId = card.id;
    while (seenIds.has(uniqueId)) {
      uniqueId = `${card.id}-${seenIds.size}`;
    }
    seenWords.add(wordKey);
    seenIds.add(uniqueId);
    cards.push({ ...card, id: uniqueId });
    if (card.forbidden.length !== DECK_LIMITS.recommendedForbidden) {
      warnings.push(
        `"${card.word}" has ${card.forbidden.length} forbidden words (5 is recommended).`,
      );
    }
  });

  if (cards.length === 0) {
    return {
      valid: false,
      errors: errors.length > 0 ? errors : ["No valid cards were found."],
      warnings,
      deck: null,
    };
  }

  const deck: Deck = {
    id: slugId("deck", `${name}-${Date.now()}`),
    name,
    ...(description ? { description } : {}),
    cards,
    source: "imported",
    createdAt: Date.now(),
  };

  return { valid: errors.length === 0, errors, warnings, deck };
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

/** Clamp rules to safe bounds so persisted or peer-supplied rules cannot break the game. */
export function clampRules(rules: GameRules): GameRules {
  const b = settingBounds;
  return {
    ...rules,
    roundDurationSec: clampNumber(
      rules.roundDurationSec,
      b.roundDurationSec.min,
      b.roundDurationSec.max,
      60,
    ),
    targetScore: clampNumber(rules.targetScore, b.targetScore.min, b.targetScore.max, 25),
    roundsPerTeam: clampNumber(rules.roundsPerTeam, b.roundsPerTeam.min, b.roundsPerTeam.max, 4),
    skipLimit: clampNumber(rules.skipLimit, b.skipLimit.min, b.skipLimit.max, 3),
    penaltyValue: clampNumber(rules.penaltyValue, b.penaltyValue.min, b.penaltyValue.max, 1),
    skipPenaltyValue: clampNumber(
      rules.skipPenaltyValue,
      b.skipPenaltyValue.min,
      b.skipPenaltyValue.max,
      1,
    ),
    correctValue: clampNumber(rules.correctValue, b.correctValue.min, b.correctValue.max, 1),
  };
}
