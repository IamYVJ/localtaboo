import type { CSSProperties } from "react";
import { PageHeading } from "../components/PageHeading";
import { Panel } from "../components/Panel";
import { Badge } from "../components/Badge";
import {
  actionDescriptions,
  basicRules,
  exampleTurn,
  keyboardShortcuts,
  objectiveCopy,
  passPlaySteps,
  peerSteps,
  ruleViolations,
  strategyTips,
} from "../config/rulesConfig";

function OrderedList({ items }: { items: string[] }) {
  return (
    <ol className="wl-stack wl-stack--tight" style={{ counterReset: "step" }}>
      {items.map((item, i) => (
        <li key={i} className="wl-cluster" style={{ alignItems: "baseline", flexWrap: "nowrap" }}>
          <span className="wl-numeral wl-accent" aria-hidden="true">
            {String(i + 1).padStart(2, "0")}
          </span>
          <span className="wl-body">{item}</span>
        </li>
      ))}
    </ol>
  );
}

export default function HowToPlay() {
  return (
    <div className="wl-stack wl-stack--xloose">
      <PageHeading
        eyebrow="How to play"
        title="Describe the word. Never say it."
        lede={objectiveCopy}
      />

      <section aria-labelledby="example-heading" className="wl-stack">
        <h2 id="example-heading" className="wl-h2">
          An example turn
        </h2>
        <Panel className="wl-stack">
          <div className="wl-cluster wl-cluster--between">
            <span className="wl-h3">{exampleTurn.target}</span>
            <Badge accent>Target</Badge>
          </div>
          <hr className="wl-divider" />
          <div className="wl-stack wl-stack--tight">
            <p className="wl-eyebrow">Forbidden</p>
            <div className="wl-cluster">
              {exampleTurn.forbidden.map((word) => (
                <Badge key={word}>{word}</Badge>
              ))}
            </div>
          </div>
          <div className="wl-stack wl-stack--tight">
            <p className="wl-eyebrow" style={{ color: "var(--status-correct)" }}>
              Allowed clue
            </p>
            <p className="wl-body">{exampleTurn.validClue}</p>
          </div>
          <div className="wl-stack wl-stack--tight">
            <p className="wl-eyebrow" style={{ color: "var(--status-penalty)" }}>
              Rule violation
            </p>
            <p className="wl-body">{exampleTurn.invalidClue}</p>
          </div>
        </Panel>
      </section>

      <section aria-labelledby="rules-heading" className="wl-stack">
        <h2 id="rules-heading" className="wl-h2">
          The basics
        </h2>
        <OrderedList items={basicRules} />
      </section>

      <section aria-labelledby="actions-heading" className="wl-stack">
        <h2 id="actions-heading" className="wl-h2">
          Turn actions
        </h2>
        <div className="wl-grid" style={{ "--grid-min": "15rem" } as CSSProperties}>
          {actionDescriptions.map((action) => (
            <Panel key={action.label} className="wl-stack wl-stack--tight">
              <p className="wl-h4">{action.label}</p>
              <p className="wl-small">{action.description}</p>
            </Panel>
          ))}
        </div>
      </section>

      <section aria-labelledby="violations-heading" className="wl-stack">
        <h2 id="violations-heading" className="wl-h2">
          What counts as a violation
        </h2>
        <ul className="wl-stack wl-stack--tight">
          {ruleViolations.map((v) => (
            <li key={v} className="wl-body">
              — {v}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="tips-heading" className="wl-stack">
        <h2 id="tips-heading" className="wl-h2">
          Clue-giving tips
        </h2>
        <ul className="wl-stack wl-stack--tight">
          {strategyTips.map((t) => (
            <li key={t} className="wl-body">
              — {t}
            </li>
          ))}
        </ul>
      </section>

      <div className="wl-grid" style={{ "--grid-min": "18rem" } as CSSProperties}>
        <section aria-labelledby="pp-heading" className="wl-stack">
          <h2 id="pp-heading" className="wl-h3">
            Pass &amp; Play
          </h2>
          <OrderedList items={passPlaySteps} />
        </section>
        <section aria-labelledby="peer-heading" className="wl-stack">
          <h2 id="peer-heading" className="wl-h3">
            Peer-to-Peer
          </h2>
          <OrderedList items={peerSteps} />
        </section>
      </div>

      <section aria-labelledby="keys-heading" className="wl-stack">
        <h2 id="keys-heading" className="wl-h2">
          Keyboard shortcuts
        </h2>
        <Panel className="wl-stack wl-stack--tight">
          {keyboardShortcuts.map((s) => (
            <div key={s.action} className="wl-cluster wl-cluster--between">
              <span className="wl-body">{s.action}</span>
              <kbd className="wl-code" style={{ padding: "0.15em 0.5em" }}>
                {s.keys}
              </kbd>
            </div>
          ))}
        </Panel>
      </section>
    </div>
  );
}
