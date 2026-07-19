import type { WordCard } from "./types";

/** Deterministic PRNG (mulberry32) so shuffles are reproducible from a seed. */
export function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return function next(): number {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pure Fisher-Yates shuffle. Returns a new array; does not mutate the input. */
export function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const a = result[i]!;
    const b = result[j]!;
    result[i] = b;
    result[j] = a;
  }
  return result;
}

/** Resolve a combined, de-duplicated card pool from one or more decks. */
export function resolvePool(cardLists: readonly WordCard[][]): WordCard[] {
  const byId = new Map<string, WordCard>();
  const byWord = new Set<string>();
  for (const list of cardLists) {
    for (const card of list) {
      const wordKey = card.word.trim().toLowerCase();
      if (byId.has(card.id) || byWord.has(wordKey)) continue;
      byId.set(card.id, card);
      byWord.add(wordKey);
    }
  }
  return [...byId.values()];
}

/** Build the initial shuffled draw queue of card ids for a game. */
export function buildQueue(cards: readonly WordCard[], seed: number): string[] {
  const rng = createRng(seed);
  return shuffle(
    cards.map((card) => card.id),
    rng,
  );
}

export interface DrawResult {
  cardId: string | null;
  queue: string[];
  queueIndex: number;
  drawn: string[];
}

/**
 * Draw the next card id. When the queue is exhausted it is reshuffled so play
 * can continue; the immediately preceding card is avoided on the reshuffle so
 * the same word never appears twice in a row.
 */
export function drawNext(params: {
  queue: string[];
  queueIndex: number;
  drawn: string[];
  seed: number;
  avoidId?: string | null;
}): DrawResult {
  const { queue, queueIndex, drawn, seed, avoidId = null } = params;

  if (queue.length === 0) {
    return { cardId: null, queue, queueIndex, drawn };
  }

  if (queueIndex < queue.length) {
    const cardId = queue[queueIndex]!;
    return {
      cardId,
      queue,
      queueIndex: queueIndex + 1,
      drawn: [...drawn, cardId],
    };
  }

  // Exhausted every card once — reshuffle for another pass.
  const rng = createRng((seed + drawn.length) >>> 0);
  const reshuffled = shuffle(queue, rng);
  if (reshuffled.length > 1 && reshuffled[0] === avoidId) {
    const swap = reshuffled[1]!;
    reshuffled[1] = reshuffled[0]!;
    reshuffled[0] = swap;
  }
  const cardId = reshuffled[0]!;
  return {
    cardId,
    queue: reshuffled,
    queueIndex: 1,
    drawn: [...drawn, cardId],
  };
}

/** Append a skipped card id back into the queue so it can reappear later. */
export function returnCardToQueue(queue: string[], cardId: string): string[] {
  return [...queue, cardId];
}
