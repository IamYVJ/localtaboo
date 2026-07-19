import { useId, type InputHTMLAttributes } from "react";

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string;
  hint?: string;
  error?: string;
  /** Hide the label visually but keep it for screen readers. */
  hideLabel?: boolean;
}

export function TextField({ label, hint, error, hideLabel, ...rest }: TextFieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className="wl-field">
      <label htmlFor={id} className={hideLabel ? "wl-sr-only" : "wl-label"}>
        {label}
      </label>
      {hint ? (
        <span id={hintId} className="wl-hint">
          {hint}
        </span>
      ) : null}
      <input
        id={id}
        className="wl-input"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
      {error ? (
        <span id={errorId} className="wl-error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
