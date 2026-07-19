/**
 * Defensive localStorage wrapper. Never throws — degrades gracefully when
 * storage is unavailable (private mode, disabled cookies, quota exceeded).
 */

const NAMESPACE = "wordlock:";

let available: boolean | null = null;

export function isStorageAvailable(): boolean {
  if (available !== null) return available;
  try {
    const probe = `${NAMESPACE}__probe__`;
    localStorage.setItem(probe, "1");
    localStorage.removeItem(probe);
    available = true;
  } catch {
    available = false;
  }
  return available;
}

export function storageKey(key: string): string {
  return `${NAMESPACE}${key}`;
}

export function readJSON<T>(key: string, fallback: T): T {
  if (!isStorageAvailable()) return fallback;
  try {
    const raw = localStorage.getItem(storageKey(key));
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): boolean {
  if (!isStorageAvailable()) return false;
  try {
    localStorage.setItem(storageKey(key), JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key: string): void {
  if (!isStorageAvailable()) return;
  try {
    localStorage.removeItem(storageKey(key));
  } catch {
    // ignore
  }
}

export const STORAGE_KEYS = {
  theme: "theme",
  preferences: "preferences",
  defaultRules: "defaultRules",
  importedDecks: "importedDecks",
  activeDeckIds: "activeDeckIds",
  unfinishedGame: "unfinishedGame",
  recentTeamNames: "recentTeamNames",
} as const;
