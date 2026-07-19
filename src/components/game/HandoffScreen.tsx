import { Button } from "../Button";

interface HandoffScreenProps {
  teamName: string;
  clueGiver: string;
  roundNumber: number;
  tiebreaker?: boolean;
  onStart: () => void;
}

/**
 * Privacy hand-off between turns: names the next clue-giver and requires a
 * deliberate action to reveal the first card, so nobody sees it early.
 */
export function HandoffScreen({
  teamName,
  clueGiver,
  roundNumber,
  tiebreaker,
  onStart,
}: HandoffScreenProps) {
  return (
    <div className="wl-handoff">
      <div className="wl-stack wl-stack--tight">
        <p className="wl-eyebrow">
          {tiebreaker ? "Tiebreaker" : `Round ${roundNumber}`} · Pass the device
        </p>
        <p className="wl-h1">{teamName}</p>
        {clueGiver ? (
          <p className="wl-lede" style={{ marginInline: "auto" }}>
            <span className="wl-accent">{clueGiver}</span> gives the clues. Everyone else guesses.
          </p>
        ) : (
          <p className="wl-lede" style={{ marginInline: "auto" }}>
            Choose a clue-giver, then start when ready.
          </p>
        )}
      </div>
      <p className="wl-small" style={{ maxWidth: "26rem" }}>
        Only the clue-giver should look at the screen. Tap start when the device is in the right
        hands and the timer will begin.
      </p>
      <Button variant="accent" size="lg" onClick={onStart}>
        Start round
      </Button>
    </div>
  );
}
