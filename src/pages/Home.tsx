import { useMemo, type CSSProperties } from "react";
import { Link, useNavigate } from "react-router-dom";
import { appConfig, modeCopy } from "../config/appConfig";
import { ROUTES } from "../app/routes";
import { Wordmark } from "../components/Wordmark";
import { Panel } from "../components/Panel";
import { Button } from "../components/Button";
import { buttonClasses } from "../components/buttonClasses";
import { useGame } from "../context/GameContext";
import { loadUnfinishedGame } from "../storage/localGameStorage";
import { teamName } from "../game/selectors";

export default function Home() {
  const navigate = useNavigate();
  const { resumeGame } = useGame();
  const saved = useMemo(() => loadUnfinishedGame(), []);

  const resume = () => {
    if (!saved) return;
    resumeGame(saved.state);
    navigate(ROUTES.passPlayGame);
  };

  return (
    <div className="wl-stack wl-stack--xloose">
      <section className="wl-stack wl-stack--loose">
        <div className="wl-stack wl-stack--tight">
          <p className="wl-eyebrow">Word game · No account · Offline-ready</p>
          <h1 className="wl-display">
            <Wordmark />
          </h1>
          <p className="wl-lede">{appConfig.tagline}</p>
          <p className="wl-body">{appConfig.supportingText}</p>
        </div>

        {saved ? (
          <Panel inset className="wl-cluster wl-cluster--between">
            <div className="wl-stack wl-stack--tight">
              <p className="wl-eyebrow">Resume</p>
              <p className="wl-body">
                You have an unfinished Pass &amp; Play game
                {saved.state.teams.length
                  ? ` — ${saved.state.teams.map((t) => teamName(saved.state, t.id)).join(" vs ")}`
                  : ""}
                .
              </p>
            </div>
            <Button variant="accent" onClick={resume}>
              Resume game
            </Button>
          </Panel>
        ) : null}
      </section>

      <section aria-labelledby="modes-heading" className="wl-stack wl-stack--loose">
        <h2 id="modes-heading" className="wl-eyebrow">
          Choose how to play
        </h2>
        <div className="wl-grid" style={{ "--grid-min": "18rem" } as CSSProperties}>
          <Panel className="wl-stack">
            <p className="wl-eyebrow">Mode 01</p>
            <h3 className="wl-h2">{modeCopy.passPlay.title}</h3>
            <p className="wl-body">{modeCopy.passPlay.blurb}</p>
            <Link to={ROUTES.passPlaySetup} className={buttonClasses("primary", "lg", true)}>
              Start Pass &amp; Play
            </Link>
          </Panel>

          <Panel className="wl-stack">
            <p className="wl-eyebrow">Mode 02</p>
            <h3 className="wl-h2">{modeCopy.peer.title}</h3>
            <p className="wl-body">{modeCopy.peer.blurb}</p>
            <Link to={ROUTES.peer} className={buttonClasses("secondary", "lg", true)}>
              Connect devices
            </Link>
          </Panel>
        </div>
      </section>

      <section className="wl-cluster">
        <Link to={ROUTES.howToPlay} className={buttonClasses("ghost")}>
          How to play →
        </Link>
        <Link to={ROUTES.decks} className={buttonClasses("ghost")}>
          Manage decks →
        </Link>
        <Link to={ROUTES.settings} className={buttonClasses("ghost")}>
          Settings →
        </Link>
      </section>
    </div>
  );
}
