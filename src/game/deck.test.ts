import { describe, expect, it } from "vitest";
import { buildQueue, createRng, drawNext, resolvePool, returnCardToQueue, shuffle } from "./deck";
import { fixtureCards } from "../tests/fixtures/deck";

describe("shuffle", () => {
  it("is deterministic for a given seed", () => {
    const a = shuffle(fixtureCards, createRng(42));
    const b = shuffle(fixtureCards, createRng(42));
    expect(a.map((c) => c.id)).toEqual(b.map((c) => c.id));
  });

  it("produces a different order for different seeds", () => {
    const a = shuffle(fixtureCards, createRng(1));
    const b = shuffle(fixtureCards, createRng(999));
    expect(a.map((c) => c.id)).not.toEqual(b.map((c) => c.id));
  });

  it("preserves the full multiset and does not mutate input", () => {
    const original = fixtureCards.map((c) => c.id);
    const shuffled = shuffle(fixtureCards, createRng(7));
    expect(shuffled).toHaveLength(fixtureCards.length);
    expect([...shuffled.map((c) => c.id)].sort()).toEqual([...original].sort());
    expect(fixtureCards.map((c) => c.id)).toEqual(original);
  });
});

describe("resolvePool", () => {
  it("de-duplicates by id and by word", () => {
    const dupById = { ...fixtureCards[0]!, word: "DIFFERENT" };
    const dupByWord = { ...fixtureCards[1]!, id: "card_new" };
    const pool = resolvePool([fixtureCards, [dupById, dupByWord]]);
    expect(pool).toHaveLength(fixtureCards.length);
  });
});

describe("drawNext / queue", () => {
  it("draws unique cards until the pool is exhausted", () => {
    const queue = buildQueue(fixtureCards, 3);
    let state = { queue, queueIndex: 0, drawn: [] as string[] };
    const seen = new Set<string>();
    for (let i = 0; i < fixtureCards.length; i += 1) {
      const result = drawNext({ ...state, seed: 3 });
      expect(result.cardId).not.toBeNull();
      expect(seen.has(result.cardId!)).toBe(false);
      seen.add(result.cardId!);
      state = { queue: result.queue, queueIndex: result.queueIndex, drawn: result.drawn };
    }
    expect(seen.size).toBe(fixtureCards.length);
  });

  it("reshuffles after exhaustion without repeating the previous card", () => {
    const queue = buildQueue(fixtureCards, 5);
    let state = { queue, queueIndex: 0, drawn: [] as string[] };
    let last: string | null = null;
    for (let i = 0; i < fixtureCards.length; i += 1) {
      const r = drawNext({ ...state, seed: 5, avoidId: last });
      state = { queue: r.queue, queueIndex: r.queueIndex, drawn: r.drawn };
      last = r.cardId;
    }
    // Next draw is past the end → reshuffle. It must not equal the last drawn card.
    const wrap = drawNext({ ...state, seed: 5, avoidId: last });
    expect(wrap.cardId).not.toBeNull();
    expect(wrap.cardId).not.toBe(last);
  });

  it("returns null when the queue is empty", () => {
    const r = drawNext({ queue: [], queueIndex: 0, drawn: [], seed: 1 });
    expect(r.cardId).toBeNull();
  });

  it("appends returned cards to the queue", () => {
    const queue = returnCardToQueue(["a", "b"], "c");
    expect(queue).toEqual(["a", "b", "c"]);
  });
});
