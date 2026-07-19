import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../app/routes";
import { PageHeading } from "../../components/PageHeading";
import { Panel } from "../../components/Panel";
import { Button } from "../../components/Button";
import { TextField } from "../../components/form/TextField";
import { RulesForm } from "../../components/game/RulesForm";
import { DeckPicker } from "../../components/game/DeckPicker";
import { ShareCode, EnterCode } from "../../components/peer/CodeExchange";
import { usePeer } from "../../context/PeerContext";
import { useDecks } from "../../context/DeckContext";
import { useToast } from "../../context/ToastContext";
import { settingBounds, defaultTeamNames } from "../../config/defaultSettings";
import { loadDefaultRules, saveDefaultRules } from "../../storage/settingsStorage";
import { clampRules } from "../../game/validation";
import { createId } from "../../utils/ids";
import type { GameRules } from "../../game/types";

interface TeamShell {
  id: string;
  name: string;
}

function initialTeams(): TeamShell[] {
  return [
    { id: createId("team"), name: defaultTeamNames[0] ?? "Team 1" },
    { id: createId("team"), name: defaultTeamNames[1] ?? "Team 2" },
  ];
}

export default function Host() {
  const navigate = useNavigate();
  const { activeCards, activeCardCount } = useDecks();
  const { pushToast } = useToast();
  const { role, lobby, createHostRoom, hostCreateOffer, hostAcceptAnswer, leave } = usePeer();

  const roomOpen = role === "host";
  const [hostName, setHostName] = useState("Host");
  const [teams, setTeams] = useState<TeamShell[]>(initialTeams);
  const [rules, setRules] = useState<GameRules>(() => loadDefaultRules());

  const [offerCode, setOfferCode] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const guestCount = lobby ? lobby.roster.filter((r) => !r.isHost).length : 0;

  const updateTeam = (id: string, name: string) =>
    setTeams((prev) => prev.map((t) => (t.id === id ? { ...t, name } : t)));

  const addTeam = () => {
    if (teams.length >= settingBounds.teamCount.max) return;
    setTeams((prev) => [
      ...prev,
      { id: createId("team"), name: defaultTeamNames[prev.length] ?? `Team ${prev.length + 1}` },
    ]);
  };

  const removeTeam = (id: string) => {
    if (teams.length <= settingBounds.teamCount.min) return;
    setTeams((prev) => prev.filter((t) => t.id !== id));
  };

  const openRoom = () => {
    if (activeCardCount === 0) {
      pushToast("Select at least one deck before hosting.", "warning");
      return;
    }
    const preparedRules = clampRules(rules);
    const preparedTeams = teams.map((t, i) => ({
      id: t.id,
      name: t.name.trim() || defaultTeamNames[i] || `Team ${i + 1}`,
    }));
    saveDefaultRules(preparedRules);
    createHostRoom({
      hostName: hostName.trim() || "Host",
      rules: preparedRules,
      cards: activeCards,
      teams: preparedTeams,
    });
    pushToast("Room created. Invite your players.", "success");
  };

  const generateOffer = async () => {
    setGenerating(true);
    try {
      const code = await hostCreateOffer();
      setOfferCode(code);
    } catch {
      pushToast("Could not create a connection offer.", "error");
    } finally {
      setGenerating(false);
    }
  };

  const acceptAnswer = async (code: string) => {
    setConnecting(true);
    try {
      const ok = await hostAcceptAnswer(code);
      if (ok) {
        pushToast("Player connecting…", "success");
        setOfferCode(null);
      } else {
        pushToast("That answer code was not valid.", "error");
      }
    } finally {
      setConnecting(false);
    }
  };

  const cancel = () => {
    leave();
    navigate(ROUTES.peer);
  };

  if (!roomOpen) {
    return (
      <div className="wl-stack wl-stack--xloose">
        <PageHeading
          eyebrow="Host"
          title="Set up the room"
          lede="Name the teams, choose the rules and decks, then open the room to start inviting players."
        />

        <section className="wl-stack" aria-labelledby="host-name">
          <h2 id="host-name" className="wl-h3">
            Your name
          </h2>
          <TextField
            label="Host name"
            hideLabel
            value={hostName}
            maxLength={settingBounds.teamNameMaxLength}
            onChange={(e) => setHostName(e.target.value)}
          />
        </section>

        <section className="wl-stack" aria-labelledby="host-teams">
          <h2 id="host-teams" className="wl-h3">
            Teams
          </h2>
          <div className="wl-stack wl-stack--tight">
            {teams.map((team, i) => (
              <Panel key={team.id} className="wl-cluster wl-cluster--between">
                <div style={{ flex: 1 }}>
                  <TextField
                    label={`Team ${i + 1} name`}
                    hideLabel
                    value={team.name}
                    maxLength={settingBounds.teamNameMaxLength}
                    placeholder={`Team ${i + 1}`}
                    onChange={(e) => updateTeam(team.id, e.target.value)}
                  />
                </div>
                {teams.length > settingBounds.teamCount.min ? (
                  <button
                    type="button"
                    className="wl-btn wl-btn--ghost wl-btn--sm"
                    onClick={() => removeTeam(team.id)}
                    aria-label={`Remove ${team.name || `team ${i + 1}`}`}
                  >
                    Remove
                  </button>
                ) : null}
              </Panel>
            ))}
            {teams.length < settingBounds.teamCount.max ? (
              <Button variant="secondary" onClick={addTeam}>
                Add team
              </Button>
            ) : null}
          </div>
        </section>

        <section className="wl-stack" aria-labelledby="host-decks">
          <h2 id="host-decks" className="wl-h3">
            Decks
          </h2>
          <DeckPicker />
        </section>

        <section className="wl-stack" aria-labelledby="host-rules">
          <h2 id="host-rules" className="wl-h3">
            Rules
          </h2>
          <RulesForm rules={rules} onChange={setRules} />
        </section>

        <div className="wl-cluster wl-cluster--between wl-safe-bottom">
          <Button variant="ghost" onClick={() => navigate(ROUTES.peer)}>
            ← Back
          </Button>
          <Button variant="accent" size="lg" onClick={openRoom}>
            Open room
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="wl-stack wl-stack--xloose">
      <PageHeading
        eyebrow="Host · inviting"
        title="Invite your players"
        lede="Connect each player one at a time. Share your offer code, then paste the answer code they send back."
      />

      <Panel className="wl-cluster wl-cluster--between">
        <span className="wl-body">
          {guestCount} player{guestCount === 1 ? "" : "s"} connected
        </span>
        <Button
          variant="accent"
          onClick={() => navigate(ROUTES.peerLobby)}
          disabled={guestCount === 0}
        >
          Continue to lobby →
        </Button>
      </Panel>

      <section className="wl-stack" aria-labelledby="invite-step">
        <h2 id="invite-step" className="wl-h3">
          Add a player
        </h2>
        {offerCode ? (
          <Panel className="wl-stack">
            <ShareCode
              code={offerCode}
              label="1 · Your offer code"
              hint="Show this QR to the player, or send them the code. They’ll send an answer code back."
            />
            <EnterCode
              label="2 · Their answer code"
              submitLabel="Connect player"
              busy={connecting}
              onSubmit={(code) => void acceptAnswer(code)}
            />
            <Button variant="ghost" onClick={() => setOfferCode(null)}>
              Cancel this invite
            </Button>
          </Panel>
        ) : (
          <Panel className="wl-stack">
            <p className="wl-body">
              Generate a fresh offer code for the next player. Each player needs their own code.
            </p>
            <Button variant="accent" onClick={() => void generateOffer()} disabled={generating}>
              {generating ? "Generating…" : "Invite a player"}
            </Button>
          </Panel>
        )}
      </section>

      <div className="wl-cluster wl-cluster--between wl-safe-bottom">
        <Button variant="danger" onClick={cancel}>
          Close room
        </Button>
      </div>
    </div>
  );
}
