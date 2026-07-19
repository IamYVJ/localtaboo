import type { GameState } from "../../game/types";
import { computeStatistics, getWinners } from "../../game/selectors";
import { formatDuration } from "../../utils/time";
import { Panel } from "../Panel";
import { Button } from "../Button";
import { ScoreBoard } from "./ScoreBoard";

interface FinalResultsProps {
  state: GameState;
  onRematch: () => void;
  onExit: () => void;
}

export function FinalResults({ state, onRematch, onExit }: FinalResultsProps) {
  const winners = getWinners(state);
  const stats = computeStatistics(state);

  const headline = state.isDraw
    ? "It’s a draw"
    : winners.length === 1
      ? `${winners[0]!.name} wins`
      : "Game over";

  return (
    <div className="wl-stack wl-stack--xloose">
      <header className="wl-stack wl-stack--tight wl-text-center">
        <p className="wl-eyebrow">Final result</p>
        <h1 className="wl-display" style={{ fontSize: "var(--text-3xl)" }}>
          {headline}
        </h1>
        {!state.isDraw && winners[0] ? (
          <p className="wl-final-score wl-accent">
            {state.scores.find((s) => s.teamId === winners[0]!.id)?.score ?? 0}
          </p>
        ) : null}
      </header>

      <section aria-labelledby="final-scores" className="wl-stack">
        <h2 id="final-scores" className="wl-h3">
          Scores
        </h2>
        <Panel flush>
          <ScoreBoard state={state} detailed />
        </Panel>
      </section>

      <section aria-labelledby="final-stats" className="wl-stack">
        <h2 id="final-stats" className="wl-h3">
          Highlights
        </h2>
        <div
          className="wl-grid"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(11rem, 1fr))" }}
        >
          <StatCard label="Cards guessed" value={String(stats.totalCorrect)} />
          <StatCard label="Total skips" value={String(stats.totalSkips)} />
          <StatCard label="Total penalties" value={String(stats.totalPenalties)} />
          <StatCard label="Time played" value={formatDuration(stats.durationSec)} />
        </div>
        {stats.bestRound ? (
          <Panel inset className="wl-stack wl-stack--tight">
            <p className="wl-eyebrow">Best round</p>
            <p className="wl-body">
              {stats.bestRound.teamName}
              {stats.bestRound.clueGiver ? ` (${stats.bestRound.clueGiver})` : ""} scored{" "}
              <span className="wl-accent">{stats.bestRound.points}</span> in round{" "}
              {stats.bestRound.roundNumber}.
            </p>
          </Panel>
        ) : null}
      </section>

      <div className="wl-cluster">
        <Button variant="accent" size="lg" onClick={onRematch}>
          Rematch
        </Button>
        <Button variant="secondary" size="lg" onClick={onExit}>
          New game
        </Button>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Panel inset className="wl-stack wl-stack--tight">
      <span className="wl-numeral wl-h2">{value}</span>
      <span className="wl-caption">{label}</span>
    </Panel>
  );
}
