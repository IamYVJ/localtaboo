interface ActionBarProps {
  onCorrect: () => void;
  onSkip: () => void;
  onPenalty: () => void;
  canSkip: boolean;
  remainingSkips: number;
  disabled?: boolean;
}

/** The three scoring actions. Keyboard handling lives in the game screen. */
export function ActionBar({
  onCorrect,
  onSkip,
  onPenalty,
  canSkip,
  remainingSkips,
  disabled,
}: ActionBarProps) {
  const skipLabel =
    remainingSkips < 0 ? "Skip" : remainingSkips === 0 ? "No skips" : `Skip · ${remainingSkips}`;
  return (
    <div className="wl-actions wl-safe-bottom">
      <button
        type="button"
        className="wl-action wl-action--skip"
        onClick={onSkip}
        disabled={disabled || !canSkip}
      >
        {skipLabel}
        <span className="wl-action__key" aria-hidden="true">
          ← key
        </span>
      </button>
      <button
        type="button"
        className="wl-action wl-action--correct"
        onClick={onCorrect}
        disabled={disabled}
      >
        Correct
        <span className="wl-action__key" aria-hidden="true">
          → key
        </span>
      </button>
      <button
        type="button"
        className="wl-action wl-action--penalty"
        onClick={onPenalty}
        disabled={disabled}
      >
        Penalty
        <span className="wl-action__key" aria-hidden="true">
          ↓ key
        </span>
      </button>
    </div>
  );
}
