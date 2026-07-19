import { Link } from "react-router-dom";
import { ROUTES } from "../../app/routes";
import { useDecks } from "../../context/DeckContext";
import { Switch } from "../form/Switch";
import { Badge } from "../Badge";
import { Panel } from "../Panel";

/** Choose which decks feed the card pool. Toggling persists globally. */
export function DeckPicker() {
  const { decks, activeDeckIds, toggleDeckActive, activeCardCount } = useDecks();

  return (
    <div className="wl-stack">
      <div className="wl-stack wl-stack--tight">
        {decks.map((deck) => (
          <Panel key={deck.id} className="wl-cluster wl-cluster--between">
            <div className="wl-stack wl-stack--tight">
              <div className="wl-cluster">
                <span className="wl-body" style={{ fontWeight: "var(--weight-semibold)" }}>
                  {deck.name}
                </span>
                <Badge>{deck.source === "starter" ? "Built-in" : "Custom"}</Badge>
              </div>
              <span className="wl-caption">{deck.cards.length} cards</span>
            </div>
            <Switch
              label={`Use ${deck.name}`}
              checked={activeDeckIds.includes(deck.id)}
              onChange={() => toggleDeckActive(deck.id)}
            />
          </Panel>
        ))}
      </div>
      <div className="wl-cluster wl-cluster--between">
        <span className="wl-small" aria-live="polite">
          {activeCardCount} cards in play
        </span>
        <Link to={ROUTES.decks} className="wl-nav__link">
          Manage decks →
        </Link>
      </div>
    </div>
  );
}
