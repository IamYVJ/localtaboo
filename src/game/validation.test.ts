import { describe, expect, it } from "vitest";
import { clampRules, validateCard, validateImportedDeck } from "./validation";
import { defaultRules } from "../config/defaultSettings";

describe("validateCard", () => {
  it("accepts a well-formed card", () => {
    const { card, errors } = validateCard(
      { word: "Volcano", forbidden: ["lava", "mountain", "fire"], difficulty: "medium" },
      0,
    );
    expect(errors).toHaveLength(0);
    expect(card).toMatchObject({ word: "Volcano", difficulty: "medium" });
    expect(card?.id).toContain("card_");
  });

  it("rejects a card without forbidden words", () => {
    const { card, errors } = validateCard({ word: "X", forbidden: [] }, 0);
    expect(card).toBeNull();
    expect(errors.join(" ")).toMatch(/at least one forbidden/);
  });

  it("drops an invalid difficulty", () => {
    const { card } = validateCard({ word: "X", forbidden: ["a"], difficulty: "impossible" }, 0);
    expect(card?.difficulty).toBeUndefined();
  });
});

describe("validateImportedDeck", () => {
  it("accepts a bare array of cards", () => {
    const result = validateImportedDeck([
      { word: "Cat", forbidden: ["pet", "meow", "kitten", "whiskers", "feline"] },
      { word: "Dog", forbidden: ["pet", "bark", "puppy", "leash", "canine"] },
    ]);
    expect(result.valid).toBe(true);
    expect(result.deck?.cards).toHaveLength(2);
    expect(result.deck?.source).toBe("imported");
  });

  it("accepts an object with name and cards", () => {
    const result = validateImportedDeck({
      name: "My Deck",
      cards: [{ word: "Cat", forbidden: ["pet", "meow", "kitten", "whiskers", "feline"] }],
    });
    expect(result.deck?.name).toBe("My Deck");
  });

  it("rejects non-deck input", () => {
    expect(validateImportedDeck(42).valid).toBe(false);
    expect(validateImportedDeck({ nope: true }).valid).toBe(false);
    expect(validateImportedDeck([]).valid).toBe(false);
  });

  it("de-duplicates repeated words with a warning", () => {
    const result = validateImportedDeck([
      { word: "Cat", forbidden: ["pet", "meow", "kitten", "whiskers", "feline"] },
      { word: "cat", forbidden: ["a", "b", "c", "d", "e"] },
    ]);
    expect(result.deck?.cards).toHaveLength(1);
    expect(result.warnings.join(" ")).toMatch(/Duplicate word/);
  });

  it("warns when a card does not have five forbidden words", () => {
    const result = validateImportedDeck([{ word: "Cat", forbidden: ["pet", "meow"] }]);
    expect(result.warnings.join(" ")).toMatch(/recommended/);
  });
});

describe("clampRules", () => {
  it("clamps values into safe bounds", () => {
    const clamped = clampRules({
      ...defaultRules,
      roundDurationSec: 5,
      targetScore: 9999,
      skipLimit: 999,
    });
    expect(clamped.roundDurationSec).toBe(15);
    expect(clamped.targetScore).toBe(100);
    expect(clamped.skipLimit).toBe(20);
  });
});
