import { useEffect, useMemo, useState } from "react";
import type { CardOutcome, GameState, RoundRecord } from "../../game/types";
import { pointsForOutcome } from "../../game/scoring";
import { Panel } from "../Panel";
import { Button } from "../Button";
import { SegmentedControl } from "../form/SegmentedControl";

interface RoundSummaryProps {
  state: GameState;
  round: RoundRecord;
  onEdit: (
    roundId: string,
    counts: { correctCount: number; skipCount: number; penaltyCount: number; pointsEarned: number },
  ) => void;
  onContinue: () => void;
  continueLabel: string;
}

interface EditableResult {
  cardId: string;
  word: string;
  outcome: CardOutcome;
}

const OUTCOME_SEGMENTS: { value: CardOutcome; label: string }[] = [
  { value: "correct", label: "Right" },
  { value: "skipped", label: "Skip" },
  { value: "penalty", label: "Pen." },
];

/** Post-turn review. Outcomes can be corrected; the score updates live. */
export function RoundSummary({
  state,
  round,
  onEdit,
  onContinue,
  continueLabel,
}: RoundSummaryProps) {
  const [results, setResults] = useState<EditableResult[]>(() =>
    round.results.map((r) => ({ cardId: r.cardId, word: r.word, outcome: r.outcome })),
  );

  // Reset local edits when a different round is shown.
  useEffect(() => {
    setResults(round.results.map((r) => ({ cardId: r.cardId, word: r.word, outcome: r.outcome })));
  }, [round.roundId, round.results]);

  const totals = useMemo(() => {
    let correctCount = 0;
    let skipCount = 0;
    let penaltyCount = 0;
    let pointsEarned = 0;
    for (const r of results) {
      if (r.outcome === "correct") correctCount += 1;
      else if (r.outcome === "skipped") skipCount += 1;
      else penaltyCount += 1;
      pointsEarned += pointsForOutcome(r.outcome, state.rules);
    }
    return { correctCount, skipCount, penaltyCount, pointsEarned };
  }, [results, state.rules]);

  const changeOutcome = (index: number, outcome: CardOutcome) => {
    const next = results.map((r, i) => (i === index ? { ...r, outcome } : r));
    setResults(next);
    let correctCount = 0;
    let skipCount = 0;
    let penaltyCount = 0;
    let pointsEarned = 0;
    for (const r of next) {
      if (r.outcome === "correct") correctCount += 1;
      else if (r.outcome === "skipped") skipCount += 1;
      else penaltyCount += 1;
      pointsEarned += pointsForOutcome(r.outcome, state.rules);
    }
    onEdit(round.roundId, { correctCount, skipCount, penaltyCount, pointsEarned });
  };

  return (
    <div className="wl-stack wl-stack--loose">
      <header className="wl-stack wl-stack--tight">
        <p className="wl-eyebrow">Round {round.roundNumber} complete</p>
        <h1 className="wl-h1">{round.teamName}</h1>
        {round.clueGiver ? <p className="wl-lede">{round.clueGiver} gave the clues.</p> : null}
      </header>

      <Panel className="wl-cluster wl-cluster--between">
        <div className="wl-text-center wl-stack wl-stack--tight">
          <span className="wl-final-score" style={{ fontSize: "var(--text-2xl)" }}>
            {totals.pointsEarned > 0 ? `+${totals.pointsEarned}` : totals.pointsEarned}
          </span>
          <span className="wl-caption">Points this round</span>
        </div>
        <div className="wl-cluster">
          <Stat label="Right" value={totals.correctCount} />
          <Stat label="Skips" value={totals.skipCount} />
          <Stat label="Penalties" value={totals.penaltyCount} />
        </div>
      </Panel>

      {results.length > 0 ? (
        <section className="wl-stack" aria-label="Cards this round">
          <p className="wl-eyebrow">Adjust any mistakes</p>
          <div className="wl-stack wl-stack--tight">
            {results.map((r, i) => (
              <div key={`${r.cardId}-${i}`} className="wl-option" style={{ cursor: "default" }}>
                <span className="wl-body" style={{ fontWeight: "var(--weight-semibold)" }}>
                  {r.word}
                </span>
                <SegmentedControl<CardOutcome>
                  label={`Outcome for ${r.word}`}
                  value={r.outcome}
                  segments={OUTCOME_SEGMENTS}
                  onChange={(o) => changeOutcome(i, o)}
                />
              </div>
            ))}
          </div>
        </section>
      ) : (
        <p className="wl-body">No cards were resolved this round.</p>
      )}

      <div className="wl-cluster wl-cluster--end">
        <Button variant="accent" size="lg" onClick={onContinue}>
          {continueLabel}
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="wl-text-center wl-stack wl-stack--tight">
      <span className="wl-numeral wl-h3">{value}</span>
      <span className="wl-caption">{label}</span>
    </div>
  );
}
