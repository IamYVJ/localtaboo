import { useCallback, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ROUTES } from "../../app/routes";
import { usePeer } from "../../context/PeerContext";
import { usePreferences } from "../../context/PreferencesContext";
import { useHaptics } from "../../hooks/useHaptics";
import { useSound } from "../../hooks/useSound";
import { useWakeLock } from "../../hooks/useWakeLock";
import { useNow } from "../../hooks/useNow";
import {
  computeStatistics,
  getCurrentClueGiver,
  getCurrentTeam,
  getLastRound,
  getRemainingMs,
  getRemainingSkips,
  getWinners,
} from "../../game/selectors";
import type { GameState } from "../../game/types";
import type { PublicGameView } from "../../network/protocol";
import { CardView } from "../../components/game/CardView";
import { TimerDisplay } from "../../components/game/TimerDisplay";
import { ActionBar } from "../../components/game/ActionBar";
import { ScoreBoard } from "../../components/game/ScoreBoard";
import { StatusDot } from "../../components/StatusDot";
import { Panel } from "../../components/Panel";
import { Button } from "../../components/Button";
import { Badge } from "../../components/Badge";
import { formatDuration } from "../../utils/time";

/**
 * The peer game screen. The host renders the authoritative {@link GameState}
 * and moderates flow; guests render the redacted public view, and whichever
 * guest is the active clue-giver additionally receives the private card and the
 * scoring controls.
 */
export default function PeerGame() {
  const { role } = usePeer();
  if (!role) return <Navigate to={ROUTES.peer} replace />;
  return role === "host" ? <HostGame /> : <GuestGame />;
}

// ---------------------------------------------------------------------------
// Host — moderator view over the real game state
// ---------------------------------------------------------------------------

function HostGame() {
  const navigate = useNavigate();
  const { hostGame, lobby, clueGiverPeerId, hostControl, hostSetClueGiver, leave } = usePeer();
  const { preferences } = usePreferences();
  const haptic = useHaptics(preferences.vibrationEnabled);
  const sound = useSound(preferences.soundEnabled);
  const wakeLock = useWakeLock();

  const isActive = hostGame?.phase === "ROUND_ACTIVE";
  const now = useNow(isActive);

  useEffect(() => {
    if (isActive) void wakeLock.request();
    else void wakeLock.release();
  }, [isActive, wakeLock]);
  useEffect(() => () => void wakeLock.release(), [wakeLock]);

  const doCorrect = useCallback(() => {
    const cardId = hostGame?.currentCardId;
    if (!cardId) return;
    haptic("correct");
    sound("correct");
    hostControl({ kind: "markCorrect", cardId });
  }, [hostGame?.currentCardId, haptic, sound, hostControl]);

  const doSkip = useCallback(() => {
    const cardId = hostGame?.currentCardId;
    if (!cardId) return;
    haptic("skip");
    sound("skip");
    hostControl({ kind: "skipCard", cardId });
  }, [hostGame?.currentCardId, haptic, sound, hostControl]);

  const doPenalty = useCallback(() => {
    const cardId = hostGame?.currentCardId;
    if (!cardId) return;
    haptic("penalty");
    sound("penalty");
    hostControl({ kind: "applyPenalty", cardId });
  }, [hostGame?.currentCardId, haptic, sound, hostControl]);

  if (!hostGame) return <Navigate to={ROUTES.peerLobby} replace />;

  const quit = () => {
    leave();
    navigate(ROUTES.peer);
  };

  const phase = hostGame.phase;
  const team = getCurrentTeam(hostGame);
  const clueGiverName =
    lobby?.roster.find((r) => r.peerId === clueGiverPeerId)?.name ?? getCurrentClueGiver(hostGame);
  const card = hostGame.currentCardId ? hostGame.pool[hostGame.currentCardId] : undefined;
  const remaining = getRemainingMs(hostGame, now);
  const totalMs = hostGame.rules.roundDurationSec * 1000;
  const remSkips = getRemainingSkips(hostGame);

  // Connected players on the team that is currently up, for clue-giver control.
  const teamMembers =
    lobby?.roster.filter((r) => !r.isHost && r.connected && team && r.teamId === team.id) ?? [];

  if (phase === "GAME_COMPLETE") return <FinalView state={hostGame} onLeave={quit} />;

  if (phase === "ROUND_COMPLETE") {
    return (
      <div className="wl-stack wl-stack--xloose">
        <RoundRecap state={hostGame} />
        <div className="wl-cluster wl-cluster--between wl-safe-bottom">
          <Button variant="danger" onClick={quit}>
            End game
          </Button>
          <Button variant="accent" size="lg" onClick={() => hostControl({ kind: "advanceTurn" })}>
            Next turn →
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "HANDOFF" || phase === "ROUND_READY") {
    return (
      <div className="wl-stack wl-stack--xloose">
        <header className="wl-stack wl-stack--tight wl-text-center">
          <p className="wl-eyebrow">
            {hostGame.tiebreakerActive ? "Tiebreaker" : `Round ${hostGame.roundNumber}`} · Up next
          </p>
          <h1 className="wl-h1">{team?.name ?? "Team"}</h1>
          <p className="wl-lede" style={{ marginInline: "auto" }}>
            <span className="wl-accent">{clueGiverName || "A player"}</span> gives the clues on
            their own device. Start when everyone is ready.
          </p>
        </header>

        <section className="wl-stack" aria-labelledby="peer-cluegiver">
          <h2 id="peer-cluegiver" className="wl-h3">
            Clue-giver
          </h2>
          {teamMembers.length === 0 ? (
            <Panel>
              <p className="wl-small">
                No connected players on this team. They may have dropped — check the lobby.
              </p>
            </Panel>
          ) : (
            <div className="wl-stack wl-stack--tight">
              {teamMembers.map((member) => {
                const isClueGiver = member.peerId === clueGiverPeerId;
                return (
                  <Panel key={member.peerId} className="wl-cluster wl-cluster--between">
                    <span className="wl-cluster">
                      <StatusDot status="online" label="Connected" />
                      <span className="wl-body">{member.name}</span>
                    </span>
                    {isClueGiver ? (
                      <Badge accent>Giving clues</Badge>
                    ) : (
                      <button
                        type="button"
                        className="wl-btn wl-btn--ghost wl-btn--sm"
                        onClick={() => hostSetClueGiver(member.peerId)}
                      >
                        Make clue-giver
                      </button>
                    )}
                  </Panel>
                );
              })}
            </div>
          )}
        </section>

        <div className="wl-cluster wl-cluster--between wl-safe-bottom">
          <Button variant="danger" onClick={quit}>
            End game
          </Button>
          <Button
            variant="accent"
            size="lg"
            onClick={() => hostControl({ kind: "startRound" })}
            disabled={!clueGiverPeerId}
          >
            Start round
          </Button>
        </div>
      </div>
    );
  }

  // ROUND_ACTIVE or ROUND_PAUSED
  const paused = phase === "ROUND_PAUSED";
  return (
    <div className="wl-game">
      <header className="wl-stack wl-stack--tight">
        <div className="wl-cluster wl-cluster--between">
          <div className="wl-stack wl-stack--tight">
            <span className="wl-eyebrow">
              {team?.name ?? "Team"}
              {clueGiverName ? ` · ${clueGiverName}` : ""}
            </span>
            <span className="wl-caption">
              Round {hostGame.roundNumber}
              {hostGame.rules.skipLimit >= 0 ? ` · ${remSkips} skips left` : ""}
            </span>
          </div>
          <span className="wl-caption">Moderator</span>
        </div>
        <TimerDisplay remainingMs={remaining} totalMs={totalMs} paused={paused} />
      </header>

      {card ? (
        <CardView card={card} revealed />
      ) : (
        <div className="wl-card">
          <p className="wl-h3">No cards left</p>
          <Button variant="accent" onClick={() => hostControl({ kind: "endRound" })}>
            End round
          </Button>
        </div>
      )}

      <div className="wl-cluster" style={{ justifyContent: "center" }}>
        {paused ? (
          <Button variant="accent" size="lg" onClick={() => hostControl({ kind: "resumeRound" })}>
            Resume
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => hostControl({ kind: "pauseRound" })}>
            Pause
          </Button>
        )}
        <Button variant="secondary" onClick={() => hostControl({ kind: "endRound" })}>
          End round
        </Button>
      </div>

      {!paused && card ? (
        <ActionBar
          onCorrect={doCorrect}
          onSkip={doSkip}
          onPenalty={doPenalty}
          canSkip={remSkips > 0}
          remainingSkips={Number.isFinite(remSkips) ? remSkips : -1}
        />
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Guest — redacted view; clue-giver additionally scores
// ---------------------------------------------------------------------------

/** Rebuild a usable GameState from the redacted view so the shared selectors work. */
function hydrate(view: PublicGameView): GameState {
  return { ...view, pool: {}, queue: [], drawn: [], seed: 0 };
}

function GuestGame() {
  const navigate = useNavigate();
  const { guestView, card, connection, selfPeerId, lobby, guestSendIntent, leave } = usePeer();
  const { preferences } = usePreferences();
  const haptic = useHaptics(preferences.vibrationEnabled);
  const sound = useSound(preferences.soundEnabled);
  const wakeLock = useWakeLock();

  const isActive = guestView?.phase === "ROUND_ACTIVE";
  const now = useNow(isActive);

  // Keep the clue-giver's screen awake while they hold a live card.
  const holdingCard = isActive && card != null;
  useEffect(() => {
    if (holdingCard) void wakeLock.request();
    else void wakeLock.release();
  }, [holdingCard, wakeLock]);
  useEffect(() => () => void wakeLock.release(), [wakeLock]);

  const doCorrect = useCallback(() => {
    if (!card) return;
    haptic("correct");
    sound("correct");
    guestSendIntent({ kind: "markCorrect", cardId: card.id });
  }, [card, haptic, sound, guestSendIntent]);

  const doSkip = useCallback(() => {
    if (!card) return;
    haptic("skip");
    sound("skip");
    guestSendIntent({ kind: "skipCard", cardId: card.id });
  }, [card, haptic, sound, guestSendIntent]);

  const doPenalty = useCallback(() => {
    if (!card) return;
    haptic("penalty");
    sound("penalty");
    guestSendIntent({ kind: "applyPenalty", cardId: card.id });
  }, [card, haptic, sound, guestSendIntent]);

  if (!guestView) return <Navigate to={ROUTES.peerLobby} replace />;

  const quit = () => {
    leave();
    navigate(ROUTES.peer);
  };

  const state = hydrate(guestView);
  const phase = guestView.phase;
  const team = getCurrentTeam(state);
  const clueGiverName = getCurrentClueGiver(state);
  const myTeamId = lobby?.roster.find((r) => r.peerId === selfPeerId)?.teamId ?? null;
  const onMyTeamTurn = !!team && myTeamId === team.id;
  const remaining = getRemainingMs(state, now);
  const totalMs = state.rules.roundDurationSec * 1000;
  const remSkips = getRemainingSkips(state);
  const disconnected = connection === "disconnected";

  const banner = disconnected ? (
    <Panel className="wl-cluster">
      <StatusDot status="offline" label="Disconnected" />
      <span className="wl-body">
        Reconnecting to the host… the game will catch up automatically.
      </span>
    </Panel>
  ) : null;

  if (phase === "GAME_COMPLETE") {
    return (
      <div className="wl-stack wl-stack--xloose">
        {banner}
        <FinalView state={state} onLeave={quit} />
      </div>
    );
  }

  if (phase === "ROUND_COMPLETE") {
    return (
      <div className="wl-stack wl-stack--xloose">
        {banner}
        <RoundRecap state={state} />
        <p className="wl-small" aria-live="polite" style={{ textAlign: "center" }}>
          Waiting for the host to start the next turn…
        </p>
        <div className="wl-cluster wl-safe-bottom">
          <Button variant="ghost" onClick={quit}>
            Leave game
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "HANDOFF" || phase === "ROUND_READY") {
    return (
      <div className="wl-stack wl-stack--xloose">
        {banner}
        <header className="wl-stack wl-stack--tight wl-text-center">
          <p className="wl-eyebrow">
            {guestView.tiebreakerActive ? "Tiebreaker" : `Round ${guestView.roundNumber}`}
          </p>
          <h1 className="wl-h1">{team?.name ?? "Team"}</h1>
          <p className="wl-lede" style={{ marginInline: "auto" }}>
            {onMyTeamTurn
              ? "Your team is up. Listen for your clue-giver and shout out your guesses."
              : `${clueGiverName || "A player"} is giving clues. Sit tight — your turn is coming.`}
          </p>
        </header>
        <p className="wl-small" aria-live="polite" style={{ textAlign: "center" }}>
          Waiting for the host to start the round…
        </p>
        <div className="wl-cluster wl-safe-bottom">
          <Button variant="ghost" onClick={quit}>
            Leave game
          </Button>
        </div>
      </div>
    );
  }

  // ROUND_ACTIVE or ROUND_PAUSED
  const paused = phase === "ROUND_PAUSED";
  const iAmClueGiver = card != null;

  return (
    <div className="wl-game">
      {banner}
      <header className="wl-stack wl-stack--tight">
        <div className="wl-stack wl-stack--tight">
          <span className="wl-eyebrow">
            {team?.name ?? "Team"}
            {clueGiverName ? ` · ${clueGiverName}` : ""}
          </span>
          <span className="wl-caption">
            {iAmClueGiver
              ? "You are giving clues"
              : onMyTeamTurn
                ? "Your team is guessing"
                : "Watching"}
          </span>
        </div>
        <TimerDisplay remainingMs={remaining} totalMs={totalMs} paused={paused} />
      </header>

      {paused ? (
        <div className="wl-card">
          <p className="wl-h3">Round paused</p>
          <p className="wl-small">Waiting for the host to resume.</p>
        </div>
      ) : iAmClueGiver && card ? (
        <>
          <CardView card={card} revealed />
          <ActionBar
            onCorrect={doCorrect}
            onSkip={doSkip}
            onPenalty={doPenalty}
            canSkip={remSkips > 0}
            remainingSkips={Number.isFinite(remSkips) ? remSkips : -1}
          />
        </>
      ) : (
        <div className="wl-card">
          <p className="wl-h3">{clueGiverName || "Your clue-giver"} is giving clues</p>
          <p className="wl-small">
            {onMyTeamTurn
              ? "Shout your guesses out loud — the clue-giver taps the score."
              : "Listen in. Your team plays next."}
          </p>
        </div>
      )}

      <div className="wl-cluster wl-safe-bottom">
        <Button variant="ghost" onClick={quit}>
          Leave game
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared sub-views
// ---------------------------------------------------------------------------

/** Read-only recap of the round that just finished plus the running standings. */
function RoundRecap({ state }: { state: GameState }) {
  const round = getLastRound(state);
  return (
    <div className="wl-stack wl-stack--loose">
      <header className="wl-stack wl-stack--tight">
        <p className="wl-eyebrow">Round {round?.roundNumber ?? state.roundNumber} complete</p>
        <h1 className="wl-h1">{round?.teamName ?? "Team"}</h1>
        {round?.clueGiver ? <p className="wl-lede">{round.clueGiver} gave the clues.</p> : null}
      </header>

      {round ? (
        <Panel className="wl-cluster wl-cluster--between">
          <div className="wl-text-center wl-stack wl-stack--tight">
            <span className="wl-final-score" style={{ fontSize: "var(--text-2xl)" }}>
              {round.pointsEarned > 0 ? `+${round.pointsEarned}` : round.pointsEarned}
            </span>
            <span className="wl-caption">Points this round</span>
          </div>
          <div className="wl-cluster">
            <Stat label="Right" value={round.correctCount} />
            <Stat label="Skips" value={round.skipCount} />
            <Stat label="Penalties" value={round.penaltyCount} />
          </div>
        </Panel>
      ) : null}

      <section className="wl-stack">
        <h2 className="wl-h3">Standings</h2>
        <Panel flush>
          <ScoreBoard state={state} detailed />
        </Panel>
      </section>
    </div>
  );
}

function FinalView({ state, onLeave }: { state: GameState; onLeave: () => void }) {
  const winners = getWinners(state);
  const stats = computeStatistics(state);
  const headline = state.isDraw
    ? "It’s a draw"
    : winners.length === 1 && winners[0]
      ? `${winners[0].name} wins`
      : "Game over";

  return (
    <div className="wl-stack wl-stack--xloose">
      <header className="wl-stack wl-stack--tight wl-text-center">
        <p className="wl-eyebrow">Final result</p>
        <h1 className="wl-display" style={{ fontSize: "var(--text-3xl)" }}>
          {headline}
        </h1>
        {!state.isDraw && winners[0] ? (
          <p className="wl-final-score wl-accent">
            {state.scores.find((s) => s.teamId === winners[0]!.id)?.score ?? 0}
          </p>
        ) : null}
      </header>

      <section aria-labelledby="peer-final-scores" className="wl-stack">
        <h2 id="peer-final-scores" className="wl-h3">
          Scores
        </h2>
        <Panel flush>
          <ScoreBoard state={state} detailed />
        </Panel>
      </section>

      <div
        className="wl-grid"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(11rem, 1fr))" }}
      >
        <StatCard label="Cards guessed" value={String(stats.totalCorrect)} />
        <StatCard label="Total skips" value={String(stats.totalSkips)} />
        <StatCard label="Total penalties" value={String(stats.totalPenalties)} />
        <StatCard label="Time played" value={formatDuration(stats.durationSec)} />
      </div>

      <div className="wl-cluster wl-safe-bottom">
        <Button variant="accent" size="lg" onClick={onLeave}>
          Leave game
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="wl-text-center wl-stack wl-stack--tight">
      <span className="wl-numeral wl-h3">{value}</span>
      <span className="wl-caption">{label}</span>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Panel inset className="wl-stack wl-stack--tight">
      <span className="wl-numeral wl-h2">{value}</span>
      <span className="wl-caption">{label}</span>
    </Panel>
  );
}
