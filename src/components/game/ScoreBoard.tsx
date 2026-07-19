import type { GameState } from "../../game/types";
import { getScoreboard } from "../../game/selectors";

interface ScoreBoardProps {
  state: GameState;
  /** Show the detailed correct/skip/penalty columns. */
  detailed?: boolean;
}

export function ScoreBoard({ state, detailed }: ScoreBoardProps) {
  const rows = getScoreboard(state);
  return (
    <table className="wl-scoreboard">
      <thead>
        <tr>
          <th scope="col">#</th>
          <th scope="col">Team</th>
          {detailed ? (
            <>
              <th scope="col" className="wl-num">
                Right
              </th>
              <th scope="col" className="wl-num">
                Skips
              </th>
              <th scope="col" className="wl-num">
                Pen.
              </th>
            </>
          ) : null}
          <th scope="col" className="wl-num">
            Score
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.teamId} data-leader={row.rank === 1}>
            <td className="wl-scoreboard__rank">{row.rank}</td>
            <td>{row.name}</td>
            {detailed ? (
              <>
                <td className="wl-num">{row.correct}</td>
                <td className="wl-num">{row.skips}</td>
                <td className="wl-num">{row.penalties}</td>
              </>
            ) : null}
            <td className="wl-num">{row.score}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
