import { settingBounds } from "../../config/defaultSettings";
import type { GameRules, TiebreakerMode } from "../../game/types";
import { Stepper } from "../form/Stepper";
import { Switch } from "../form/Switch";
import { SegmentedControl } from "../form/SegmentedControl";
import { Panel } from "../Panel";

interface RulesFormProps {
  rules: GameRules;
  onChange: (rules: GameRules) => void;
}

/** Editor for the configurable game rules. Shared across setup and settings. */
export function RulesForm({ rules, onChange }: RulesFormProps) {
  const set = <K extends keyof GameRules>(key: K, value: GameRules[K]) =>
    onChange({ ...rules, [key]: value });

  const b = settingBounds;

  return (
    <div className="wl-stack wl-stack--loose">
      <Panel className="wl-stack">
        <p className="wl-eyebrow">Timing &amp; length</p>
        <Stepper
          label="Round duration"
          value={rules.roundDurationSec}
          min={b.roundDurationSec.min}
          max={b.roundDurationSec.max}
          step={b.roundDurationSec.step}
          suffix="sec"
          onChange={(v) => set("roundDurationSec", v)}
        />
        <Switch
          label="Unlimited rounds"
          hint="Play until a team hits the target score instead of a fixed number of turns."
          checked={rules.unlimitedRounds}
          onChange={(v) => set("unlimitedRounds", v)}
        />
        {!rules.unlimitedRounds ? (
          <Stepper
            label="Turns per team"
            value={rules.roundsPerTeam}
            min={b.roundsPerTeam.min}
            max={b.roundsPerTeam.max}
            onChange={(v) => set("roundsPerTeam", v)}
          />
        ) : null}
        <Stepper
          label="Target score (0 to disable)"
          value={rules.targetScore}
          min={b.targetScore.min}
          max={b.targetScore.max}
          suffix="pts"
          onChange={(v) => set("targetScore", v)}
        />
      </Panel>

      <Panel className="wl-stack">
        <p className="wl-eyebrow">Scoring</p>
        <Stepper
          label="Points per correct answer"
          value={rules.correctValue}
          min={b.correctValue.min}
          max={b.correctValue.max}
          onChange={(v) => set("correctValue", v)}
        />
        <Stepper
          label="Points lost per violation"
          value={rules.penaltyValue}
          min={b.penaltyValue.min}
          max={b.penaltyValue.max}
          onChange={(v) => set("penaltyValue", v)}
        />
        <Switch
          label="Violations advance to the next card"
          checked={rules.penaltyAdvancesCard}
          onChange={(v) => set("penaltyAdvancesCard", v)}
        />
      </Panel>

      <Panel className="wl-stack">
        <p className="wl-eyebrow">Skipping</p>
        <Stepper
          label="Skip limit per turn (−1 = unlimited)"
          value={rules.skipLimit}
          min={b.skipLimit.min}
          max={b.skipLimit.max}
          onChange={(v) => set("skipLimit", v)}
        />
        <Switch
          label="Skips cost points"
          checked={rules.skipsCostPoints}
          onChange={(v) => set("skipsCostPoints", v)}
        />
        {rules.skipsCostPoints ? (
          <Stepper
            label="Points lost per skip"
            value={rules.skipPenaltyValue}
            min={b.skipPenaltyValue.min}
            max={b.skipPenaltyValue.max}
            onChange={(v) => set("skipPenaltyValue", v)}
          />
        ) : null}
        <Switch
          label="Skipped cards return to the deck"
          checked={rules.skippedCardsReturnToDeck}
          onChange={(v) => set("skippedCardsReturnToDeck", v)}
        />
      </Panel>

      <Panel className="wl-stack">
        <p className="wl-eyebrow">Play style</p>
        <Switch
          label="Allow duplicate cards"
          hint="Let the same card appear more than once when the deck is small."
          checked={rules.allowDuplicateCards}
          onChange={(v) => set("allowDuplicateCards", v)}
        />
        <Switch
          label="Gestures allowed"
          checked={rules.gesturesAllowed}
          onChange={(v) => set("gesturesAllowed", v)}
        />
        <Switch
          label="Spelling allowed"
          checked={rules.spellingAllowed}
          onChange={(v) => set("spellingAllowed", v)}
        />
        <div className="wl-field">
          <span className="wl-label">Tiebreaker</span>
          <SegmentedControl<TiebreakerMode>
            label="Tiebreaker"
            value={rules.tiebreaker}
            segments={[
              { value: "sudden-death", label: "Sudden death" },
              { value: "draw", label: "Allow draw" },
            ]}
            onChange={(v) => set("tiebreaker", v)}
          />
        </div>
      </Panel>
    </div>
  );
}
