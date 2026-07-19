import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { appConfig } from "../config/appConfig";
import { loadPreferences, savePreferences } from "../storage/settingsStorage";
import type { Preferences, ThemePreference } from "../game/types";

interface PreferencesContextValue {
  preferences: Preferences;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: ThemePreference) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setVibrationEnabled: (enabled: boolean) => void;
  completeOnboarding: () => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
    : false;
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(() => loadPreferences());
  const [systemDark, setSystemDark] = useState<boolean>(systemPrefersDark);

  const resolvedTheme: "light" | "dark" =
    preferences.theme === "system" ? (systemDark ? "dark" : "light") : preferences.theme;

  // Track system theme changes while the preference is "system".
  useEffect(() => {
    if (!window.matchMedia) return;
    const list = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemDark(list.matches);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, []);

  // Apply resolved theme + accent to the document.
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", resolvedTheme);
    root.style.setProperty("--accent", appConfig.accentColor);
    root.style.setProperty("--accent-contrast", appConfig.accentContrast);
  }, [resolvedTheme]);

  const persist = useCallback((next: Preferences) => {
    setPreferences(next);
    savePreferences(next);
  }, []);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      preferences,
      resolvedTheme,
      setTheme: (theme) => persist({ ...preferences, theme }),
      setSoundEnabled: (soundEnabled) => persist({ ...preferences, soundEnabled }),
      setVibrationEnabled: (vibrationEnabled) => persist({ ...preferences, vibrationEnabled }),
      completeOnboarding: () => persist({ ...preferences, onboardingComplete: true }),
    }),
    [preferences, resolvedTheme, persist],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used within PreferencesProvider");
  return ctx;
}
