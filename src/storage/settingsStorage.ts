import { defaultPreferences, defaultRules } from "../config/defaultSettings";
import { clampRules } from "../game/validation";
import type { GameRules, Preferences, ThemePreference } from "../game/types";
import { readJSON, removeKey, STORAGE_KEYS, writeJSON } from "./safeStorage";

export function loadPreferences(): Preferences {
  const stored = readJSON<Partial<Preferences>>(STORAGE_KEYS.preferences, {});
  return { ...defaultPreferences, ...stored };
}

export function savePreferences(prefs: Preferences): void {
  writeJSON(STORAGE_KEYS.preferences, prefs);
  // Mirror the theme to a standalone key so index.html can apply it pre-paint.
  writeJSON(STORAGE_KEYS.theme, prefs.theme);
}

export function loadTheme(): ThemePreference {
  return readJSON<ThemePreference>(STORAGE_KEYS.theme, defaultPreferences.theme);
}

export function loadDefaultRules(): GameRules {
  const stored = readJSON<Partial<GameRules>>(STORAGE_KEYS.defaultRules, {});
  return clampRules({ ...defaultRules, ...stored });
}

export function saveDefaultRules(rules: GameRules): void {
  writeJSON(STORAGE_KEYS.defaultRules, rules);
}

export function loadRecentTeamNames(): string[] {
  return readJSON<string[]>(STORAGE_KEYS.recentTeamNames, []);
}

export function rememberTeamNames(names: string[]): void {
  const existing = loadRecentTeamNames();
  const merged = [...names, ...existing].map((n) => n.trim()).filter((n) => n.length > 0);
  const unique = [...new Set(merged)].slice(0, 12);
  writeJSON(STORAGE_KEYS.recentTeamNames, unique);
}

export function clearRecentTeamNames(): void {
  removeKey(STORAGE_KEYS.recentTeamNames);
}
