import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CardView } from "./CardView";
import type { WordCard } from "../../game/types";

const card: WordCard = {
  id: "c1",
  word: "OCEAN",
  forbidden: ["sea", "water", "wave", "blue", "fish"],
  category: "Nature",
  difficulty: "easy",
};

describe("CardView", () => {
  it("shows the target word and every forbidden word when revealed", () => {
    render(<CardView card={card} revealed />);
    expect(screen.getByText("OCEAN")).toBeInTheDocument();
    for (const word of card.forbidden) {
      expect(screen.getByText(word)).toBeInTheDocument();
    }
  });

  it("exposes the forbidden words as an accessible list", () => {
    render(<CardView card={card} revealed />);
    const list = screen.getByRole("list", { name: /forbidden words/i });
    expect(list).toBeInTheDocument();
  });

  it("conceals the word when not revealed", () => {
    render(<CardView card={card} revealed={false} />);
    expect(screen.queryByText("OCEAN")).not.toBeInTheDocument();
    expect(screen.getByText(/card hidden/i)).toBeInTheDocument();
  });
});
