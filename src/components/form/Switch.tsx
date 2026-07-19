import { useId } from "react";

interface SwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
  disabled?: boolean;
}

/** Accessible toggle built on a native checkbox for keyboard and SR support. */
export function Switch({ label, checked, onChange, hint, disabled }: SwitchProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className="wl-cluster wl-cluster--between wl-full">
      <label htmlFor={id} className="wl-stack wl-stack--tight" style={{ cursor: "pointer" }}>
        <span className="wl-label">{label}</span>
        {hint ? (
          <span id={hintId} className="wl-hint">
            {hint}
          </span>
        ) : null}
      </label>
      <span className="wl-switch">
        <input
          id={id}
          type="checkbox"
          role="switch"
          className="wl-switch__input wl-sr-only"
          checked={checked}
          disabled={disabled}
          aria-describedby={hintId}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="wl-switch__track" aria-hidden="true">
          <span className="wl-switch__thumb" />
        </span>
      </span>
    </div>
  );
}
