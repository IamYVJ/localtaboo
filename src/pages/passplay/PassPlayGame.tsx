import { useCallback, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ROUTES } from "../../app/routes";
import { useGame } from "../../context/GameContext";
import { usePreferences } from "../../context/PreferencesContext";
import { useToast } from "../../context/ToastContext";
import { useHaptics } from "../../hooks/useHaptics";
import { useSound } from "../../hooks/useSound";
import { useWakeLock } from "../../hooks/useWakeLock";
import { useNow } from "../../hooks/useNow";
import {
  getCurrentCard,
  getCurrentClueGiver,
  getCurrentTeam,
  getLastRound,
  getRemainingMs,
  getRemainingSkips,
} from "../../game/selectors";
import type { GameState } from "../../game/types";
import { HandoffScreen } from "../../components/game/HandoffScreen";
import { CardView } from "../../components/game/CardView";
import { TimerDisplay } from "../../components/game/TimerDisplay";
import { ActionBar } from "../../components/game/ActionBar";
import { RoundSummary } from "../../components/game/RoundSummary";
import { FinalResults } from "../../components/game/FinalResults";
import { ScoreBoard } from "../../components/game/ScoreBoard";
import { Panel } from "../../components/Panel";
import { Button } from "../../components/Button";
import { Dialog } from "../../components/Dialog";

export default function PassPlayGame() {
  const { game } = useGame();
  if (!game) return <Navigate to={ROUTES.passPlaySetup} replace />;
  return <GameScreen game={game} />;
}

function GameScreen({ game }: { game: GameState }) {
  const navigate = useNavigate();
  const { preferences } = usePreferences();
  const {
    startRound,
    markCorrect,
    skipCard,
    applyPenalty,
    pauseRound,
    resumeRound,
    endRound,
    advanceTurn,
    editRoundResult,
    rematch,
    clearGame,
  } = useGame();
  const { pushToast } = useToast();
  const haptic = useHaptics(preferences.vibrationEnabled);
  const sound = useSound(preferences.soundEnabled);
  const wakeLock = useWakeLock();

  const [menuOpen, setMenuOpen] = useState(false);

  const phase = game.phase;
  const isActive = phase === "ROUND_ACTIVE";
  const now = useNow(isActive);

  // Keep the screen awake only while a round is running.
  useEffect(() => {
    if (isActive) void wakeLock.request();
    else void wakeLock.release();
  }, [isActive, wakeLock]);
  useEffect(() => () => void wakeLock.release(), [wakeLock]);

  const card = getCurrentCard(game);
  const team = getCurrentTeam(game);
  const clueGiver = getCurrentClueGiver(game);
  const remaining = getRemainingMs(game, now);
  const totalMs = game.rules.roundDurationSec * 1000;
  const remSkips = getRemainingSkips(game);
  const canSkip = remSkips > 0;

  const doCorrect = useCallback(() => {
    if (!card) return;
    haptic("correct");
    sound("correct");
    markCorrect(card.id);
  }, [card, haptic, sound, markCorrect]);

  const doSkip = useCallback(() => {
    if (!card || !canSkip) return;
    haptic("skip");
    sound("skip");
    skipCard(card.id);
  }, [card, canSkip, haptic, sound, skipCard]);

  const doPenalty = useCallback(() => {
    if (!card) return;
    haptic("penalty");
    sound("penalty");
    applyPenalty(card.id);
  }, [card, haptic, sound, applyPenalty]);

  // Keyboard shortcuts during an active/paused round.
  useEffect(() => {
    if (phase !== "ROUND_ACTIVE" && phase !== "ROUND_PAUSED") return;
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      switch (e.key) {
        case "ArrowRight":
          if (phase === "ROUND_ACTIVE") {
            e.preventDefault();
            doCorrect();
          }
          break;
        case "ArrowLeft":
          if (phase === "ROUND_ACTIVE") {
            e.preventDefault();
            doSkip();
          }
          break;
        case "ArrowDown":
          if (phase === "ROUND_ACTIVE") {
            e.preventDefault();
            doPenalty();
          }
          break;
        case " ":
        case "Spacebar":
          e.preventDefault();
          if (phase === "ROUND_ACTIVE") pauseRound();
          else resumeRound();
          break;
        case "Escape":
          e.preventDefault();
          if (phase === "ROUND_ACTIVE") pauseRound();
          setMenuOpen(true);
          break;
        default:
          break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, doCorrect, doSkip, doPenalty, pauseRound, resumeRound]);

  const quitToSetup = () => {
    clearGame();
    navigate(ROUTES.passPlaySetup);
  };

  // ---- Phase rendering ----
  if (phase === "HANDOFF" || phase === "ROUND_READY") {
    return (
      <div className="wl-game">
        <HandoffScreen
          teamName={team?.name ?? "Team"}
          clueGiver={clueGiver}
          roundNumber={game.roundNumber}
          tiebreaker={game.tiebreakerActive}
          onStart={startRound}
        />
        <div className="wl-cluster wl-cluster--between">
          <Button variant="ghost" onClick={quitToSetup}>
            Quit game
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "ROUND_COMPLETE") {
    const round = getLastRound(game);
    if (!round) return <Navigate to={ROUTES.passPlaySetup} replace />;
    return (
      <div className="wl-stack wl-stack--xloose">
        <RoundSummary
          state={game}
          round={round}
          onEdit={editRoundResult}
          onContinue={advanceTurn}
          continueLabel="Continue"
        />
        <section className="wl-stack">
          <h2 className="wl-h3">Standings</h2>
          <Panel flush>
            <ScoreBoard state={game} detailed />
          </Panel>
        </section>
      </div>
    );
  }

  if (phase === "GAME_COMPLETE") {
    return (
      <FinalResults
        state={game}
        onRematch={() => {
          rematch();
          pushToast("New game — same teams.", "success");
        }}
        onExit={quitToSetup}
      />
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
              {clueGiver ? ` · ${clueGiver}` : ""}
            </span>
            <span className="wl-caption">
              Round {game.roundNumber}
              {game.rules.skipLimit >= 0 ? ` · ${remSkips} skips left` : ""}
            </span>
          </div>
          <Button
            variant="ghost"
            onClick={() => {
              pauseRound();
              setMenuOpen(true);
            }}
          >
            Menu
          </Button>
        </div>
        <TimerDisplay remainingMs={remaining} totalMs={totalMs} paused={paused} />
      </header>

      {card ? (
        <CardView card={card} revealed={!paused} />
      ) : (
        <div className="wl-card">
          <p className="wl-h3">No cards left</p>
          <Button variant="accent" onClick={endRound}>
            End round
          </Button>
        </div>
      )}

      {paused ? (
        <div className="wl-cluster" style={{ justifyContent: "center" }}>
          <Button variant="accent" size="lg" onClick={resumeRound}>
            Resume
          </Button>
          <Button variant="secondary" size="lg" onClick={endRound}>
            End round
          </Button>
        </div>
      ) : (
        <ActionBar
          onCorrect={doCorrect}
          onSkip={doSkip}
          onPenalty={doPenalty}
          canSkip={canSkip}
          remainingSkips={Number.isFinite(remSkips) ? remSkips : -1}
        />
      )}

      <Dialog
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="Paused"
        description="The timer is frozen and the card is hidden."
        footer={
          <>
            <Button variant="danger" onClick={quitToSetup}>
              Quit game
            </Button>
            <Button
              variant="accent"
              onClick={() => {
                setMenuOpen(false);
                resumeRound();
              }}
            >
              Resume
            </Button>
          </>
        }
      >
        <Button
          variant="secondary"
          block
          onClick={() => {
            setMenuOpen(false);
            endRound();
          }}
        >
          End this round now
        </Button>
      </Dialog>
    </div>
  );
}
