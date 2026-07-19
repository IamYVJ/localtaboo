import { describe, expect, it } from "vitest";
import { MAX_MESSAGE_BYTES, PROTOCOL_VERSION, clientMsg, hostMsg, toPublicView } from "./protocol";
import { makeConfig } from "../tests/helpers/gameHelpers";

describe("toPublicView", () => {
  it("strips everything that could reveal card identities", () => {
    const state = makeConfig();
    const view = toPublicView(state);
    expect("pool" in view).toBe(false);
    expect("queue" in view).toBe(false);
    expect("drawn" in view).toBe(false);
    expect("seed" in view).toBe(false);
  });

  it("keeps the fields guests need to render", () => {
    const state = makeConfig();
    const view = toPublicView(state);
    expect(view.phase).toBe(state.phase);
    expect(view.version).toBe(state.version);
    expect(view.teams).toHaveLength(state.teams.length);
    expect(view.scores).toHaveLength(state.scores.length);
  });

  it("does not mutate the source state", () => {
    const state = makeConfig();
    toPublicView(state);
    expect(Object.keys(state.pool).length).toBeGreaterThan(0);
    expect(state.seed).toBeDefined();
  });
});

describe("message constructors", () => {
  it("stamps the protocol version on hello and welcome", () => {
    expect(clientMsg.hello("Sam")).toMatchObject({ t: "hello", protocol: PROTOCOL_VERSION });
    expect(hostMsg.welcome("peer_1", "Host")).toMatchObject({
      t: "welcome",
      protocol: PROTOCOL_VERSION,
    });
  });

  it("wraps an intent with the acting state version", () => {
    const msg = clientMsg.intent(7, { kind: "markCorrect", cardId: "c1" });
    expect(msg).toEqual({
      t: "intent",
      stateVersion: 7,
      intent: { kind: "markCorrect", cardId: "c1" },
    });
  });

  it("keeps encoded frames well under the size cap", () => {
    const state = makeConfig();
    const frame = JSON.stringify(hostMsg.state(toPublicView(state)));
    expect(new TextEncoder().encode(frame).length).toBeLessThan(MAX_MESSAGE_BYTES);
  });
});
