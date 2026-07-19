import { useId, type SelectHTMLAttributes } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "id" | "children"
> {
  label: string;
  hint?: string;
  options: SelectOption[];
  hideLabel?: boolean;
}

export function SelectField({ label, hint, options, hideLabel, ...rest }: SelectFieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
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
      <select id={id} className="wl-select" aria-describedby={hintId} {...rest}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
