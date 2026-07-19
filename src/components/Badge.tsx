import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  accent?: boolean;
  className?: string;
}

export function Badge({ children, accent, className }: BadgeProps) {
  const classes = ["wl-badge", accent ? "wl-badge--accent" : "", className ?? ""]
    .filter(Boolean)
    .join(" ");
  return <span className={classes}>{children}</span>;
}
