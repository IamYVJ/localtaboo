import { appConfig } from "../config/appConfig";

interface WordmarkProps {
  /** Font size; defaults to the current text size. */
  size?: string;
  className?: string;
}

/**
 * The WORDLOCK wordmark. Splits the configured name so the final glyph carries
 * the accent — a small typographic signature rather than a logo image.
 */
export function Wordmark({ size, className }: WordmarkProps) {
  const name = appConfig.name;
  const head = name.slice(0, -1);
  const tail = name.slice(-1);
  return (
    <span
      className={["wl-wordmark", className].filter(Boolean).join(" ")}
      style={size ? { fontSize: size } : undefined}
      aria-label={name}
    >
      <span aria-hidden="true">{head}</span>
      <span aria-hidden="true" className="wl-wordmark__dot">
        {tail}
      </span>
    </span>
  );
}
