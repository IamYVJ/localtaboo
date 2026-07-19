import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { ScoreBoard } from "./ScoreBoard";
import { makeConfig, playTurnAndAdvance } from "../../tests/helpers/gameHelpers";

describe("ScoreBoard", () => {
  it("lists every team", () => {
    render(<ScoreBoard state={makeConfig()} />);
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Bravo")).toBeInTheDocument();
  });

  it("ranks the leading team first after a scoring turn", () => {
    // Alpha (t1) plays first and banks three correct answers.
    const state = playTurnAndAdvance(makeConfig(), { correct: 3 });
    render(<ScoreBoard state={state} />);
    const rows = screen.getAllByRole("row").slice(1); // drop the header row
    const leader = within(rows[0]!);
    expect(leader.getByText("Alpha")).toBeInTheDocument();
    expect(leader.getByText("1")).toBeInTheDocument(); // rank cell
  });

  it("adds the detailed columns only when requested", () => {
    const { rerender } = render(<ScoreBoard state={makeConfig()} />);
    expect(screen.queryByRole("columnheader", { name: /right/i })).not.toBeInTheDocument();
    rerender(<ScoreBoard state={makeConfig()} detailed />);
    expect(screen.getByRole("columnheader", { name: /right/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /pen\./i })).toBeInTheDocument();
  });
});
