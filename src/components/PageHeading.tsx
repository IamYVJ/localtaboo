import type { ReactNode } from "react";

interface PageHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  lede?: ReactNode;
  /** Visual size of the title. */
  size?: "display" | "h1" | "h2";
  id?: string;
}

/** Editorial page header: small eyebrow, oversized heading, optional lede. */
export function PageHeading({ eyebrow, title, lede, size = "h1", id }: PageHeadingProps) {
  return (
    <header className="wl-stack wl-stack--tight">
      {eyebrow ? <p className="wl-eyebrow">{eyebrow}</p> : null}
      <h1 id={id} className={`wl-${size}`}>
        {title}
      </h1>
      {lede ? <p className="wl-lede">{lede}</p> : null}
    </header>
  );
}
