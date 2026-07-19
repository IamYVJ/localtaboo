import type { HTMLAttributes, ReactNode } from "react";

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  inset?: boolean;
  flush?: boolean;
  children: ReactNode;
}

/** A flat, hairline-bordered surface. No shadows or gradients by design. */
export function Panel({ inset, flush, className, children, ...rest }: PanelProps) {
  const classes = [
    "wl-panel",
    inset ? "wl-panel--inset" : "",
    flush ? "wl-panel--flush" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}
