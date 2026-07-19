import { useId, type TextareaHTMLAttributes } from "react";

interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> {
  label: string;
  hint?: string;
  error?: string;
  hideLabel?: boolean;
}

export function TextArea({ label, hint, error, hideLabel, ...rest }: TextAreaProps) {
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
      <textarea
        id={id}
        className="wl-textarea"
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
