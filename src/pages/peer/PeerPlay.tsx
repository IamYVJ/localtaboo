import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../app/routes";
import { PageHeading } from "../../components/PageHeading";
import { Panel } from "../../components/Panel";
import { Button } from "../../components/Button";
import { peerConnectionNotes } from "../../config/rulesConfig";

export default function PeerPlay() {
  const navigate = useNavigate();

  return (
    <div className="wl-stack wl-stack--xloose">
      <PageHeading
        eyebrow="Peer-to-Peer"
        title="Play on separate devices"
        lede="Connect two or more phones and laptops directly, browser to browser. There is no server in the middle — you exchange a short connection code by hand."
      />

      <div
        className="wl-grid"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))" }}
      >
        <Panel className="wl-stack">
          <h2 className="wl-h3">Host a room</h2>
          <p className="wl-body">
            Set up the teams, rules, and decks, then invite players by sharing a connection code.
            Your device runs the game and keeps score.
          </p>
          <Button variant="accent" size="lg" onClick={() => navigate(ROUTES.peerHost)}>
            Host game
          </Button>
        </Panel>

        <Panel className="wl-stack">
          <h2 className="wl-h3">Join a room</h2>
          <p className="wl-body">
            Enter your name, then scan or paste the host’s code to connect. You’ll see your card
            privately when it’s your turn to give clues.
          </p>
          <Button variant="secondary" size="lg" onClick={() => navigate(ROUTES.peerJoin)}>
            Join game
          </Button>
        </Panel>
      </div>

      <section className="wl-stack" aria-labelledby="peer-notes">
        <h2 id="peer-notes" className="wl-h3">
          How connecting works
        </h2>
        <Panel>
          <ul className="wl-stack wl-stack--tight">
            {peerConnectionNotes.map((note) => (
              <li key={note} className="wl-body">
                {note}
              </li>
            ))}
          </ul>
        </Panel>
      </section>

      <div className="wl-cluster wl-cluster--between wl-safe-bottom">
        <Button variant="ghost" onClick={() => navigate(ROUTES.home)}>
          ← Back
        </Button>
      </div>
    </div>
  );
}
