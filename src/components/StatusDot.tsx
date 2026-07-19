type Status = "online" | "offline" | "paused" | "neutral";

interface StatusDotProps {
  status: Status;
  /** Accessible label; the dot is not the only status indicator. */
  label?: string;
}

/**
 * Small status indicator. Colour is paired with a text label elsewhere so
 * status is never conveyed by colour alone.
 */
export function StatusDot({ status, label }: StatusDotProps) {
  const cls = status === "neutral" ? "wl-dot" : `wl-dot wl-dot--${status}`;
  return <span className={cls} role="img" aria-label={label ?? status} />;
}
