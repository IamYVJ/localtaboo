import { PageHeading } from "../components/PageHeading";
import { Panel } from "../components/Panel";
import { peerConnectionNotes, privacyPoints } from "../config/rulesConfig";

export default function Privacy() {
  return (
    <div className="wl-stack wl-stack--xloose">
      <PageHeading
        eyebrow="Privacy"
        title="Your game stays on your devices."
        lede="This is a static site with no backend. There is nowhere for your data to be sent."
      />

      <section aria-labelledby="points-heading" className="wl-stack">
        <h2 id="points-heading" className="wl-h2">
          What that means
        </h2>
        <ul className="wl-stack wl-stack--tight">
          {privacyPoints.map((point) => (
            <li key={point} className="wl-body">
              — {point}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="peer-heading" className="wl-stack">
        <h2 id="peer-heading" className="wl-h2">
          About peer connections
        </h2>
        <Panel inset className="wl-stack wl-stack--tight">
          {peerConnectionNotes.map((note) => (
            <p key={note} className="wl-body">
              — {note}
            </p>
          ))}
        </Panel>
        <p className="wl-small">
          Peer-to-peer play uses WebRTC. Connections are established with a manual code exchange and
          public STUN servers for address discovery only — no game content passes through them.
        </p>
      </section>
    </div>
  );
}
