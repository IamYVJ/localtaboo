import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActionBar } from "./ActionBar";

function setup(overrides: Partial<Parameters<typeof ActionBar>[0]> = {}) {
  const props = {
    onCorrect: vi.fn(),
    onSkip: vi.fn(),
    onPenalty: vi.fn(),
    canSkip: true,
    remainingSkips: 3,
    ...overrides,
  };
  render(<ActionBar {...props} />);
  return props;
}

describe("ActionBar", () => {
  it("fires the matching handler for each action", async () => {
    const props = setup();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /correct/i }));
    await user.click(screen.getByRole("button", { name: /skip/i }));
    await user.click(screen.getByRole("button", { name: /penalty/i }));
    expect(props.onCorrect).toHaveBeenCalledOnce();
    expect(props.onSkip).toHaveBeenCalledOnce();
    expect(props.onPenalty).toHaveBeenCalledOnce();
  });

  it("shows the remaining skip count", () => {
    setup({ remainingSkips: 2 });
    expect(screen.getByRole("button", { name: /skip · 2/i })).toBeInTheDocument();
  });

  it("disables skipping when no skips remain", async () => {
    const props = setup({ canSkip: false, remainingSkips: 0 });
    const skip = screen.getByRole("button", { name: /no skips/i });
    expect(skip).toBeDisabled();
    await userEvent.setup().click(skip);
    expect(props.onSkip).not.toHaveBeenCalled();
  });

  it("disables every action when disabled", () => {
    setup({ disabled: true });
    expect(screen.getByRole("button", { name: /correct/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /penalty/i })).toBeDisabled();
  });
});
