import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function EmptyState({ title, description, children }: EmptyStateProps) {
  return (
    <div className="wl-empty wl-stack wl-stack--tight">
      <p className="wl-h4">{title}</p>
      {description ? <p className="wl-small">{description}</p> : null}
      {children ? (
        <div className="wl-cluster" style={{ justifyContent: "center" }}>
          {children}
        </div>
      ) : null}
    </div>
  );
}
