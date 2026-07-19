import { useId } from "react";

interface StepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  hint?: string;
  /** Rendered after the value, e.g. "sec" or "pts". */
  suffix?: string;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Numeric stepper with a live-updating value announced to assistive tech. */
export function Stepper({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  hint,
  suffix,
}: StepperProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const set = (next: number) => onChange(clamp(next, min, max));
  return (
    <div className="wl-field">
      <span id={id} className="wl-label">
        {label}
      </span>
      {hint ? (
        <span id={hintId} className="wl-hint">
          {hint}
        </span>
      ) : null}
      <div className="wl-stepper" role="group" aria-labelledby={id} aria-describedby={hintId}>
        <button
          type="button"
          className="wl-stepper__btn"
          onClick={() => set(value - step)}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <span className="wl-stepper__value" aria-live="polite">
          {value}
          {suffix ? <span className="wl-caption">&nbsp;{suffix}</span> : null}
        </span>
        <button
          type="button"
          className="wl-stepper__btn"
          onClick={() => set(value + step)}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}
