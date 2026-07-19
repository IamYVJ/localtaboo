import { usePreferences } from "../context/PreferencesContext";
import type { ThemePreference } from "../game/types";

const ORDER: ThemePreference[] = ["light", "dark", "system"];
const LABEL: Record<ThemePreference, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};
const GLYPH: Record<ThemePreference, string> = {
  light: "○",
  dark: "●",
  system: "◐",
};

/** Compact control that cycles light → dark → system. */
export function ThemeToggle() {
  const { preferences, setTheme } = usePreferences();
  const current = preferences.theme;
  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length]!;
  return (
    <button
      type="button"
      className="wl-btn wl-btn--ghost"
      onClick={() => setTheme(next)}
      aria-label={`Theme: ${LABEL[current]}. Switch to ${LABEL[next]}.`}
      title={`Theme: ${LABEL[current]}`}
    >
      <span aria-hidden="true">{GLYPH[current]}</span>
      <span className="wl-hide-mobile">{LABEL[current]}</span>
    </button>
  );
}
