import type { WordCard } from "../../game/types";

/** Small deterministic deck used across engine tests. */
export const fixtureCards: WordCard[] = Array.from({ length: 8 }, (_, i) => ({
  id: `card_${i + 1}`,
  word: `WORD${i + 1}`,
  forbidden: [`a${i}`, `b${i}`, `c${i}`, `d${i}`, `e${i}`],
  category: i % 2 === 0 ? "test-even" : "test-odd",
  difficulty: (["easy", "medium", "hard"] as const)[i % 3],
}));
