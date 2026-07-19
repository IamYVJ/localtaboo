import { PageHeading } from "../components/PageHeading";
import { Panel } from "../components/Panel";
import { appConfig } from "../config/appConfig";
import { currentLimitations } from "../config/rulesConfig";

const TECH = [
  "React + TypeScript",
  "WebRTC data channels",
  "Local browser storage",
  "Installable PWA",
  "No backend or database",
  "No trackers or ads",
];

export default function About() {
  return (
    <div className="wl-stack wl-stack--xloose">
      <PageHeading
        eyebrow="About"
        title={`${appConfig.name} is a word game that runs in your browser.`}
        lede={appConfig.supportingText}
      />

      <section aria-labelledby="how-heading" className="wl-stack">
        <h2 id="how-heading" className="wl-h2">
          How it is built
        </h2>
        <div
          className="wl-grid"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(12rem, 1fr))" }}
        >
          {TECH.map((item) => (
            <Panel key={item} inset className="wl-body">
              {item}
            </Panel>
          ))}
        </div>
      </section>

      <section aria-labelledby="limits-heading" className="wl-stack">
        <h2 id="limits-heading" className="wl-h2">
          Current limitations
        </h2>
        <ul className="wl-stack wl-stack--tight">
          {currentLimitations.map((limit) => (
            <li key={limit} className="wl-body">
              — {limit}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="links-heading" className="wl-stack">
        <h2 id="links-heading" className="wl-h2">
          Links
        </h2>
        <div className="wl-cluster">
          {appConfig.repositoryUrl ? (
            <a href={appConfig.repositoryUrl} target="_blank" rel="noreferrer noopener">
              Source code
            </a>
          ) : null}
          {appConfig.githubPagesUrl ? (
            <a href={appConfig.githubPagesUrl} target="_blank" rel="noreferrer noopener">
              Live site
            </a>
          ) : null}
        </div>
        <p className="wl-caption">
          {appConfig.name} v{appConfig.version}
        </p>
      </section>
    </div>
  );
}
