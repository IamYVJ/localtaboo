import type { WordCard } from "../../game/types";
import { Badge } from "../Badge";

interface CardViewProps {
  card: WordCard;
  /** When false, the word and forbidden list are concealed (privacy). */
  revealed?: boolean;
}

/** The clue-giver's card: target word plus the forbidden words. */
export function CardView({ card, revealed = true }: CardViewProps) {
  if (!revealed) {
    return (
      <div className="wl-card">
        <p className="wl-h3">Card hidden</p>
        <p className="wl-small">Resume the round to reveal the word.</p>
      </div>
    );
  }
  return (
    <div className="wl-card">
      {(card.category || card.difficulty) && (
        <div className="wl-card__meta">
          {card.category ? <Badge>{card.category}</Badge> : null}
          {card.difficulty ? <Badge accent>{card.difficulty}</Badge> : null}
        </div>
      )}
      <p className="wl-card__word">{card.word}</p>
      <div className="wl-card__forbidden" role="list" aria-label="Forbidden words">
        {card.forbidden.map((word) => (
          <span key={word} className="wl-card__forbidden-item" role="listitem">
            {word}
          </span>
        ))}
      </div>
    </div>
  );
}
