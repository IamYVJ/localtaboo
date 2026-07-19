import { useState } from "react";
import { PageHeading } from "../components/PageHeading";
import { Panel } from "../components/Panel";
import { Button } from "../components/Button";
import { Dialog } from "../components/Dialog";
import { Switch } from "../components/form/Switch";
import { SegmentedControl } from "../components/form/SegmentedControl";
import { RulesForm } from "../components/game/RulesForm";
import { usePreferences } from "../context/PreferencesContext";
import { useToast } from "../context/ToastContext";
import { useSound } from "../hooks/useSound";
import { useHaptics } from "../hooks/useHaptics";
import { useWakeLock } from "../hooks/useWakeLock";
import { appConfig } from "../config/appConfig";
import { defaultRules } from "../config/defaultSettings";
import { loadDefaultRules, saveDefaultRules } from "../storage/settingsStorage";
import { isStorageAvailable, removeKey, STORAGE_KEYS } from "../storage/safeStorage";
import type { GameRules, ThemePreference } from "../game/types";

export default function Settings() {
  const { preferences, setTheme, setSoundEnabled, setVibrationEnabled } = usePreferences();
  const { pushToast } = useToast();
  const previewSound = useSound(true);
  const previewHaptic = useHaptics(true);
  const wakeLock = useWakeLock();

  const [rules, setRules] = useState<GameRules>(() => loadDefaultRules());
  const [resetOpen, setResetOpen] = useState(false);

  const storageOk = isStorageAvailable();
  const vibrationSupported =
    typeof navigator !== "undefined" && typeof navigator.vibrate === "function";

  const saveRules = () => {
    saveDefaultRules(rules);
    pushToast("Saved as your default rules.", "success");
  };

  const restoreRules = () => {
    setRules(defaultRules);
    saveDefaultRules(defaultRules);
    pushToast("Rules restored to defaults.", "success");
  };

  const resetEverything = () => {
    for (const key of Object.values(STORAGE_KEYS)) removeKey(key);
    setResetOpen(false);
    pushToast("All local data cleared. Reloading…", "success");
    window.setTimeout(() => window.location.reload(), 600);
  };

  const themeSegments: { value: ThemePreference; label: string }[] = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "System" },
  ];

  return (
    <div className="wl-stack wl-stack--xloose">
      <PageHeading
        eyebrow="Settings"
        title="Settings"
        lede="Preferences live only on this device. Nothing is uploaded anywhere."
      />

      <section className="wl-stack" aria-labelledby="set-appearance">
        <h2 id="set-appearance" className="wl-h3">
          Appearance
        </h2>
        <Panel className="wl-field">
          <span className="wl-label">Theme</span>
          <SegmentedControl<ThemePreference>
            label="Theme"
            value={preferences.theme}
            segments={themeSegments}
            onChange={setTheme}
          />
          <span className="wl-hint">System follows your device’s light or dark setting.</span>
        </Panel>
      </section>

      <section className="wl-stack" aria-labelledby="set-feedback">
        <h2 id="set-feedback" className="wl-h3">
          Feedback
        </h2>
        <Panel className="wl-stack">
          <div className="wl-cluster wl-cluster--between">
            <div style={{ flex: 1 }}>
              <Switch
                label="Sound effects"
                hint="Short tones for correct, skip and penalty. Off by default."
                checked={preferences.soundEnabled}
                onChange={setSoundEnabled}
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => previewSound("correct")}
              aria-label="Play a sample sound"
            >
              Test
            </Button>
          </div>
          <div className="wl-cluster wl-cluster--between">
            <div style={{ flex: 1 }}>
              <Switch
                label="Vibration"
                hint={
                  vibrationSupported
                    ? "Haptic buzz on scoring actions."
                    : "This device does not support vibration."
                }
                checked={preferences.vibrationEnabled}
                onChange={setVibrationEnabled}
                disabled={!vibrationSupported}
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => previewHaptic("penalty")}
              disabled={!vibrationSupported}
              aria-label="Play a sample vibration"
            >
              Test
            </Button>
          </div>
          <p className="wl-caption">
            {wakeLock.supported
              ? "The screen is kept awake automatically during a live round."
              : "Screen wake lock is unavailable on this device; your screen may dim during a round."}
          </p>
        </Panel>
      </section>

      <section className="wl-stack" aria-labelledby="set-rules">
        <h2 id="set-rules" className="wl-h3">
          Default game rules
        </h2>
        <p className="wl-body">
          These become the starting point whenever you set up a new game. You can still tweak them
          per game.
        </p>
        <RulesForm rules={rules} onChange={setRules} />
        <div className="wl-cluster wl-cluster--between">
          <Button variant="ghost" onClick={restoreRules}>
            Restore defaults
          </Button>
          <Button variant="accent" onClick={saveRules}>
            Save as default
          </Button>
        </div>
      </section>

      <section className="wl-stack" aria-labelledby="set-data">
        <h2 id="set-data" className="wl-h3">
          Data &amp; storage
        </h2>
        <Panel className="wl-stack">
          <p className="wl-body">
            {storageOk
              ? "Your preferences, rules, custom decks and any unfinished game are stored in this browser only."
              : "Browser storage is unavailable, so settings will reset when you close the tab."}
          </p>
          <div className="wl-cluster">
            <Button variant="danger" onClick={() => setResetOpen(true)} disabled={!storageOk}>
              Clear all local data
            </Button>
          </div>
        </Panel>
        <p className="wl-caption">
          {appConfig.name} v{appConfig.version}
        </p>
      </section>

      <Dialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Clear all local data?"
        description="This removes your preferences, saved rules, imported decks and any unfinished game from this browser. It cannot be undone."
        footer={
          <>
            <Button variant="ghost" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={resetEverything}>
              Clear everything
            </Button>
          </>
        }
      >
        <p className="wl-body">Custom decks you have not exported will be lost.</p>
      </Dialog>
    </div>
  );
}
