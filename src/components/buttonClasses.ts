export type ButtonVariant = "primary" | "accent" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

/** Compose the button class list — shared with links styled as buttons. */
export function buttonClasses(
  variant: ButtonVariant = "secondary",
  size: ButtonSize = "md",
  block = false,
  extra?: string,
): string {
  return [
    "wl-btn",
    `wl-btn--${variant}`,
    size !== "md" ? `wl-btn--${size}` : "",
    block ? "wl-btn--block" : "",
    extra ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}
