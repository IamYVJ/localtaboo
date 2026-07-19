import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../app/routes";
import { PageHeading } from "../../components/PageHeading";
import { Button } from "../../components/Button";
import { TeamsEditor } from "../../components/game/TeamsEditor";
import { RulesForm } from "../../components/game/RulesForm";
import { DeckPicker } from "../../components/game/DeckPicker";
import { createTeamSetup, randomSeed } from "../../game/engine";
import { clampRules } from "../../game/validation";
import type { GameConfig, GameRules, TeamSetup } from "../../game/types";
import { defaultTeamNames } from "../../config/defaultSettings";
import {
  loadDefaultRules,
  rememberTeamNames,
  saveDefaultRules,
} from "../../storage/settingsStorage";
import { useDecks } from "../../context/DeckContext";
import { useGame } from "../../context/GameContext";
import { useToast } from "../../context/ToastContext";

function initialTeams(): TeamSetup[] {
  return [createTeamSetup(defaultTeamNames[0]!, []), createTeamSetup(defaultTeamNames[1]!, [])];
}

/** Prepare teams for a game: trim names, supply fallbacks, drop blank players. */
function prepareTeams(teams: TeamSetup[]): TeamSetup[] {
  return teams.map((team, i) => ({
    ...team,
    name: team.name.trim() || defaultTeamNames[i] || `Team ${i + 1}`,
    players: team.players.map((p) => p.trim()).filter((p) => p.length > 0),
  }));
}

export default function PassPlaySetup() {
  const navigate = useNavigate();
  const { activeCards, activeCardCount } = useDecks();
  const { startGame } = useGame();
  const { pushToast } = useToast();

  const [teams, setTeams] = useState<TeamSetup[]>(initialTeams);
  const [rules, setRules] = useState<GameRules>(() => loadDefaultRules());

  const start = () => {
    if (activeCardCount === 0) {
      pushToast("Select at least one deck before starting.", "warning");
      return;
    }
    const prepared = prepareTeams(teams);
    const config: GameConfig = {
      mode: "pass-and-play",
      rules: clampRules(rules),
      teams: prepared,
      cards: activeCards,
      seed: randomSeed(),
    };
    saveDefaultRules(config.rules);
    rememberTeamNames(prepared.map((t) => t.name));
    startGame(config);
    navigate(ROUTES.passPlayGame);
  };

  return (
    <div className="wl-stack wl-stack--xloose">
      <PageHeading
        eyebrow="Pass & Play"
        title="Set up your game"
        lede="Add teams, pick your decks, and fine-tune the rules. Everything runs on this device."
      />

      <section aria-labelledby="teams-heading" className="wl-stack">
        <h2 id="teams-heading" className="wl-h2">
          Teams
        </h2>
        <TeamsEditor teams={teams} onChange={setTeams} />
      </section>

      <section aria-labelledby="decks-heading" className="wl-stack">
        <h2 id="decks-heading" className="wl-h2">
          Decks
        </h2>
        <DeckPicker />
      </section>

      <section aria-labelledby="rules-heading" className="wl-stack">
        <h2 id="rules-heading" className="wl-h2">
          Rules
        </h2>
        <RulesForm rules={rules} onChange={setRules} />
      </section>

      <div className="wl-cluster wl-cluster--between wl-safe-bottom">
        <Button variant="ghost" onClick={() => navigate(ROUTES.home)}>
          ← Back
        </Button>
        <Button variant="accent" size="lg" onClick={start}>
          Start game
        </Button>
      </div>
    </div>
  );
}
