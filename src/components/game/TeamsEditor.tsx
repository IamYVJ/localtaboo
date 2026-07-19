import { settingBounds } from "../../config/defaultSettings";
import { defaultTeamNames } from "../../config/defaultSettings";
import { createTeamSetup } from "../../game/engine";
import type { TeamSetup } from "../../game/types";
import { Panel } from "../Panel";
import { Button } from "../Button";
import { TextField } from "../form/TextField";

interface TeamsEditorProps {
  teams: TeamSetup[];
  onChange: (teams: TeamSetup[]) => void;
}

const { teamCount, playersPerTeam, teamNameMaxLength, playerNameMaxLength } = settingBounds;

export function TeamsEditor({ teams, onChange }: TeamsEditorProps) {
  const update = (index: number, next: Partial<TeamSetup>) =>
    onChange(teams.map((t, i) => (i === index ? { ...t, ...next } : t)));

  const addTeam = () => {
    if (teams.length >= teamCount.max) return;
    const name = defaultTeamNames[teams.length] ?? `Team ${teams.length + 1}`;
    onChange([...teams, createTeamSetup(name, [])]);
  };

  const removeTeam = (index: number) => {
    if (teams.length <= teamCount.min) return;
    onChange(teams.filter((_, i) => i !== index));
  };

  const setPlayer = (teamIndex: number, playerIndex: number, value: string) => {
    const team = teams[teamIndex]!;
    const players = team.players.map((p, i) => (i === playerIndex ? value : p));
    update(teamIndex, { players });
  };

  const addPlayer = (teamIndex: number) => {
    const team = teams[teamIndex]!;
    if (team.players.length >= playersPerTeam.max) return;
    update(teamIndex, { players: [...team.players, ""] });
  };

  const removePlayer = (teamIndex: number, playerIndex: number) => {
    const team = teams[teamIndex]!;
    update(teamIndex, { players: team.players.filter((_, i) => i !== playerIndex) });
  };

  return (
    <div className="wl-stack wl-stack--loose">
      <div
        className="wl-grid"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))" }}
      >
        {teams.map((team, ti) => (
          <Panel key={team.id} className="wl-stack">
            <div className="wl-cluster wl-cluster--between">
              <p className="wl-eyebrow">Team {ti + 1}</p>
              {teams.length > teamCount.min ? (
                <button
                  type="button"
                  className="wl-btn wl-btn--ghost wl-btn--sm"
                  onClick={() => removeTeam(ti)}
                  aria-label={`Remove ${team.name || `team ${ti + 1}`}`}
                >
                  Remove
                </button>
              ) : null}
            </div>

            <TextField
              label="Team name"
              value={team.name}
              maxLength={teamNameMaxLength}
              placeholder={`Team ${ti + 1}`}
              onChange={(e) => update(ti, { name: e.target.value })}
            />

            <div className="wl-stack wl-stack--tight">
              <p className="wl-label">Players (optional)</p>
              {team.players.map((player, pi) => (
                <div key={pi} className="wl-cluster" style={{ flexWrap: "nowrap" }}>
                  <div style={{ flex: 1 }}>
                    <TextField
                      label={`Player ${pi + 1}`}
                      hideLabel
                      value={player}
                      maxLength={playerNameMaxLength}
                      placeholder={`Player ${pi + 1}`}
                      onChange={(e) => setPlayer(ti, pi, e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    className="wl-btn wl-btn--ghost wl-btn--sm"
                    onClick={() => removePlayer(ti, pi)}
                    aria-label={`Remove player ${pi + 1}`}
                  >
                    <span aria-hidden="true">✕</span>
                  </button>
                </div>
              ))}
              {team.players.length < playersPerTeam.max ? (
                <button
                  type="button"
                  className="wl-btn wl-btn--secondary wl-btn--sm"
                  onClick={() => addPlayer(ti)}
                >
                  Add player
                </button>
              ) : null}
            </div>
          </Panel>
        ))}
      </div>

      {teams.length < teamCount.max ? (
        <Button variant="secondary" onClick={addTeam}>
          Add team
        </Button>
      ) : null}
    </div>
  );
}
