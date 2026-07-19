import type { Difficulty, WordCard } from "../game/types";

/** Suggested categories for the starter deck and custom decks. */
export const CATEGORIES = [
  "everyday objects",
  "food",
  "animals",
  "travel",
  "jobs",
  "sports",
  "entertainment",
  "science",
  "technology",
  "places",
  "nature",
  "actions",
  "emotions",
  "school",
  "culture",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const DIFFICULTIES: readonly Difficulty[] = ["easy", "medium", "hard"];

export function countByCategory(cards: readonly WordCard[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const card of cards) {
    const key = card.category ?? "uncategorised";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export function countByDifficulty(
  cards: readonly WordCard[],
): Record<Difficulty | "unrated", number> {
  const counts: Record<Difficulty | "unrated", number> = {
    easy: 0,
    medium: 0,
    hard: 0,
    unrated: 0,
  };
  for (const card of cards) {
    const key = card.difficulty ?? "unrated";
    counts[key] += 1;
  }
  return counts;
}

/** Words that appear on more than one card (case-insensitive). */
export function findDuplicateWords(cards: readonly WordCard[]): string[] {
  const seen = new Map<string, number>();
  for (const card of cards) {
    const key = card.word.trim().toLowerCase();
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  return [...seen.entries()].filter(([, n]) => n > 1).map(([word]) => word);
}
