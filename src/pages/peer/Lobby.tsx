import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ROUTES } from "../../app/routes";
import { PageHeading } from "../../components/PageHeading";
import { Panel } from "../../components/Panel";
import { Button } from "../../components/Button";
import { Badge } from "../../components/Badge";
import { StatusDot } from "../../components/StatusDot";
import { SegmentedControl } from "../../components/form/SegmentedControl";
import { usePeer } from "../../context/PeerContext";
import { useToast } from "../../context/ToastContext";
import type { RosterEntry } from "../../network/protocol";

const UNASSIGNED = "__none__";

export default function Lobby() {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const {
    role,
    lobby,
    hostGame,
    guestView,
    connection,
    selfPeerId,
    lastError,
    hostStartGame,
    hostAssignTeam,
    hostKick,
    guestChooseTeam,
    leave,
  } = usePeer();

  // Host jumps to the game once it starts; guests follow when the first view lands.
  useEffect(() => {
    if (role === "host" && hostGame) navigate(ROUTES.peerGame);
  }, [role, hostGame, navigate]);
  useEffect(() => {
    if (role === "guest" && guestView) navigate(ROUTES.peerGame);
  }, [role, guestView, navigate]);

  useEffect(() => {
    if (lastError) pushToast(lastError, "warning");
  }, [lastError, pushToast]);

  if (!role || !lobby) return <Navigate to={ROUTES.peer} replace />;

  const teamName = (teamId: string | null): string =>
    teamId ? (lobby.teams.find((t) => t.id === teamId)?.name ?? "—") : "Unassigned";

  const teamSegments = [
    ...lobby.teams.map((t) => ({ value: t.id, label: t.name })),
    { value: UNASSIGNED, label: "None" },
  ];

  const guests = lobby.roster.filter((r) => !r.isHost);
  const self = lobby.roster.find((r) => r.peerId === selfPeerId);

  const leaveLobby = () => {
    leave();
    navigate(ROUTES.peer);
  };

  const startGame = () => {
    if (!hostStartGame()) {
      pushToast("Put at least two teams together before starting.", "warning");
    }
  };

  return (
    <div className="wl-stack wl-stack--xloose">
      <PageHeading
        eyebrow={role === "host" ? "Host · lobby" : "Lobby"}
        title={`${lobby.hostName}’s room`}
        lede={
          role === "host"
            ? "Sort players into teams. Start when at least two teams have a player."
            : "Pick your team and wait for the host to start."
        }
      />

      {role === "guest" ? (
        <Panel className="wl-cluster wl-cluster--between">
          <span className="wl-cluster">
            <StatusDot
              status={connection === "connected" ? "online" : "offline"}
              label={connection === "connected" ? "Connected" : "Disconnected"}
            />
            <span className="wl-body">
              {connection === "connected" ? "Connected to host" : "Reconnecting…"}
            </span>
          </span>
        </Panel>
      ) : null}

      {/* Guest self team picker */}
      {role === "guest" && self ? (
        <section className="wl-stack" aria-labelledby="your-team">
          <h2 id="your-team" className="wl-h3">
            Your team
          </h2>
          <Panel className="wl-stack">
            <SegmentedControl
              label="Choose your team"
              value={self.teamId ?? UNASSIGNED}
              segments={teamSegments}
              onChange={(value) => guestChooseTeam(value === UNASSIGNED ? null : value)}
            />
          </Panel>
        </section>
      ) : null}

      {/* Roster */}
      <section className="wl-stack" aria-labelledby="roster">
        <h2 id="roster" className="wl-h3">
          Players ({guests.length})
        </h2>
        <div className="wl-stack wl-stack--tight">
          <Panel className="wl-cluster wl-cluster--between">
            <span className="wl-cluster">
              <StatusDot status="online" label="Connected" />
              <span className="wl-body" style={{ fontWeight: "var(--weight-semibold)" }}>
                {lobby.hostName}
              </span>
            </span>
            <Badge accent>Host</Badge>
          </Panel>

          {guests.length === 0 ? (
            <Panel>
              <p className="wl-small">No players yet. Share a connection code to invite them.</p>
            </Panel>
          ) : (
            guests.map((guest: RosterEntry) => (
              <Panel key={guest.peerId} className="wl-stack wl-stack--tight">
                <div className="wl-cluster wl-cluster--between">
                  <span className="wl-cluster">
                    <StatusDot
                      status={guest.connected ? "online" : "offline"}
                      label={guest.connected ? "Connected" : "Disconnected"}
                    />
                    <span className="wl-body" style={{ fontWeight: "var(--weight-semibold)" }}>
                      {guest.name}
                      {guest.peerId === selfPeerId ? " (you)" : ""}
                    </span>
                  </span>
                  <Badge>{teamName(guest.teamId)}</Badge>
                </div>
                {role === "host" ? (
                  <div className="wl-cluster wl-cluster--between">
                    <SegmentedControl
                      label={`Assign ${guest.name} to a team`}
                      value={guest.teamId ?? UNASSIGNED}
                      segments={teamSegments}
                      onChange={(value) =>
                        hostAssignTeam(guest.peerId, value === UNASSIGNED ? null : value)
                      }
                    />
                    <button
                      type="button"
                      className="wl-btn wl-btn--ghost wl-btn--sm"
                      onClick={() => hostKick(guest.peerId)}
                    >
                      Remove
                    </button>
                  </div>
                ) : null}
              </Panel>
            ))
          )}
        </div>
      </section>

      <div className="wl-cluster wl-cluster--between wl-safe-bottom">
        <Button variant="danger" onClick={leaveLobby}>
          Leave room
        </Button>
        {role === "host" ? (
          <div className="wl-cluster">
            <Button variant="secondary" onClick={() => navigate(ROUTES.peerHost)}>
              Invite more
            </Button>
            <Button variant="accent" size="lg" onClick={startGame} disabled={!lobby.canStart}>
              Start game
            </Button>
          </div>
        ) : (
          <span className="wl-small" aria-live="polite">
            Waiting for the host to start…
          </span>
        )}
      </div>
    </div>
  );
}
