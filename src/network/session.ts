/**
 * Host-authoritative session layer built on top of {@link PeerLink}.
 *
 * The host owns the one real {@link GameState}: it runs the engine, redacts the
 * card pool, broadcasts a public view to every guest, and privately delivers the
 * current card only to the clue-giver's device. Guests never mutate state — they
 * send validated *intents* which the host authorises (correct team, fresh
 * version) before applying. Heartbeats detect silent drops on both sides.
 */

import { initGame, randomSeed } from "../game/engine";
import { gameReducer } from "../game/reducer";
import type {
  GameAction,
  GameConfig,
  GameRules,
  GameState,
  TeamSetup,
  WordCard,
} from "../game/types";
import { createId } from "../utils/ids";
import type { PeerLink, PeerStatus } from "./peer";
import {
  HEARTBEAT_INTERVAL_MS,
  HEARTBEAT_TIMEOUT_MS,
  PROTOCOL_VERSION,
  clientMsg,
  hostMsg,
  toPublicView,
  type LobbyView,
  type NetworkIntent,
  type PrivateCard,
  type PublicGameView,
  type RosterEntry,
} from "./protocol";
import { parseClientMessage, parseHostMessage } from "./schemas";

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

/** Map a guest intent onto a concrete engine action stamped with the host clock. */
function intentToAction(intent: NetworkIntent, now: number): GameAction {
  switch (intent.kind) {
    case "startRound":
      return { type: "START_ROUND", now };
    case "markCorrect":
      return { type: "MARK_CORRECT", cardId: intent.cardId, now };
    case "skipCard":
      return { type: "SKIP_CARD", cardId: intent.cardId, now };
    case "applyPenalty":
      return { type: "APPLY_PENALTY", cardId: intent.cardId, now };
    case "pauseRound":
      return { type: "PAUSE_ROUND", now };
    case "resumeRound":
      return { type: "RESUME_ROUND", now };
    case "endRound":
      return { type: "END_ROUND", now };
    case "advanceTurn":
      return { type: "ADVANCE_TURN", now };
  }
}

const CARD_INTENTS: ReadonlySet<NetworkIntent["kind"]> = new Set([
  "markCorrect",
  "skipCard",
  "applyPenalty",
]);

// ---------------------------------------------------------------------------
// Host
// ---------------------------------------------------------------------------

export interface HostSessionOptions {
  hostName: string;
  rules: GameRules;
  cards: WordCard[];
  teams: { id: string; name: string }[];
  onLobby?: (lobby: LobbyView) => void;
  onState?: (state: GameState | null) => void;
}

interface Guest {
  link: PeerLink;
  entry: RosterEntry;
  lastSeen: number;
  helloReceived: boolean;
}

export class HostSession {
  private readonly opts: HostSessionOptions;
  private state: GameState | null = null;
  private readonly guests = new Map<string, Guest>();
  private clueGiverPeerId: string | null = null;
  private lastTeamIndex = -1;
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  constructor(options: HostSessionOptions) {
    this.opts = options;
    this.heartbeatTimer = setInterval(() => this.heartbeat(), HEARTBEAT_INTERVAL_MS);
  }

  // ---- Public API ----

  /** Attach a connected link. Returns the assigned peer id. */
  registerGuest(link: PeerLink): string {
    const peerId = createId("peer");
    const entry: RosterEntry = {
      peerId,
      name: "Player",
      teamId: null,
      connected: link.getStatus() === "connected",
      isHost: false,
    };
    this.guests.set(peerId, { link, entry, lastSeen: Date.now(), helloReceived: false });
    link.setHandlers({
      onData: (raw) => this.handleFrame(peerId, raw),
      onStatus: (status) => this.handleGuestStatus(peerId, status),
    });
    return peerId;
  }

  /** Moderator action from the host device itself — bypasses turn authority. */
  control(intent: NetworkIntent): void {
    this.apply(intentToAction(intent, Date.now()));
  }

  /** Begin the game from the current lobby. Returns false if not startable. */
  start(): boolean {
    if (this.state) return false;
    const setups: TeamSetup[] = this.opts.teams
      .filter((t) => this.connectedOnTeam(t.id).length > 0)
      .map((t) => ({
        id: t.id,
        name: t.name,
        players: this.connectedOnTeam(t.id).map((g) => g.entry.name),
      }));
    if (setups.length < 2) return false;

    const config: GameConfig = {
      mode: "peer",
      rules: this.opts.rules,
      teams: setups,
      cards: this.opts.cards,
      seed: randomSeed(),
    };
    this.state = initGame(config);
    this.lastTeamIndex = this.state.currentTeamIndex;
    this.assignClueGiver();
    this.broadcastState();
    this.opts.onState?.(this.state);
    return true;
  }

  kick(peerId: string, reason = "Removed by host."): void {
    const guest = this.guests.get(peerId);
    if (!guest) return;
    guest.link.send(JSON.stringify(hostMsg.kicked(reason)));
    guest.link.close();
    this.guests.delete(peerId);
    if (this.clueGiverPeerId === peerId) this.assignClueGiver();
    this.broadcastLobby();
  }

  setClueGiver(peerId: string | null): void {
    this.clueGiverPeerId = peerId;
    this.broadcastState();
  }

  /** Moderator override of a guest's team while still in the lobby. */
  assignTeam(peerId: string, teamId: string | null): void {
    if (this.state) return; // teams are locked once the game starts
    const guest = this.guests.get(peerId);
    if (!guest) return;
    if (teamId !== null && !this.opts.teams.some((t) => t.id === teamId)) return;
    guest.entry.teamId = teamId;
    this.broadcastLobby();
  }

  getState(): GameState | null {
    return this.state;
  }

  getLobby(): LobbyView {
    return this.buildLobby();
  }

  getClueGiverPeerId(): string | null {
    return this.clueGiverPeerId;
  }

  close(): void {
    if (this.tickTimer) clearInterval(this.tickTimer);
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.tickTimer = null;
    this.heartbeatTimer = null;
    for (const guest of this.guests.values()) guest.link.close();
    this.guests.clear();
  }

  // ---- Internals ----

  private connectedOnTeam(teamId: string): Guest[] {
    return [...this.guests.values()].filter((g) => g.entry.connected && g.entry.teamId === teamId);
  }

  private assignClueGiver(): void {
    if (!this.state) {
      this.clueGiverPeerId = null;
      return;
    }
    const team = this.state.teams[this.state.currentTeamIndex];
    if (!team) {
      this.clueGiverPeerId = null;
      return;
    }
    // Rotate with the engine's clue-giver index so the private card follows the
    // same player the public view names, wrapping over the connected members.
    const connected = this.connectedOnTeam(team.id);
    if (connected.length === 0) {
      this.clueGiverPeerId = null;
      return;
    }
    const idx = ((team.clueGiverIndex % connected.length) + connected.length) % connected.length;
    this.clueGiverPeerId = connected[idx]?.entry.peerId ?? null;
  }

  private currentCard(): PrivateCard {
    if (!this.state || this.state.phase !== "ROUND_ACTIVE" || !this.state.currentCardId) {
      return null;
    }
    return this.state.pool[this.state.currentCardId] ?? null;
  }

  private apply(action: GameAction): void {
    if (!this.state) return;
    const next = gameReducer(this.state, action);
    if (next === this.state) return; // rejected/no-op — nothing to broadcast
    this.state = next;
    if (this.state.currentTeamIndex !== this.lastTeamIndex) {
      this.lastTeamIndex = this.state.currentTeamIndex;
      this.assignClueGiver();
    }
    this.manageTicker();
    this.broadcastState();
    this.opts.onState?.(this.state);
  }

  private manageTicker(): void {
    const active = this.state?.phase === "ROUND_ACTIVE";
    if (active && !this.tickTimer) {
      this.tickTimer = setInterval(() => this.apply({ type: "TICK", now: Date.now() }), 250);
    } else if (!active && this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
  }

  private buildLobby(): LobbyView {
    const roster: RosterEntry[] = [
      { peerId: "host", name: this.opts.hostName, teamId: null, connected: true, isHost: true },
      ...[...this.guests.values()].map((g) => ({ ...g.entry })),
    ];
    const activeTeams = this.opts.teams.filter((t) => this.connectedOnTeam(t.id).length > 0);
    return {
      hostName: this.opts.hostName,
      teams: this.opts.teams.map((t) => ({ id: t.id, name: t.name })),
      roster,
      rules: this.opts.rules,
      canStart: this.state === null && activeTeams.length >= 2,
    };
  }

  private broadcastLobby(): void {
    const lobby = this.buildLobby();
    const frame = JSON.stringify(hostMsg.lobby(lobby));
    for (const guest of this.guests.values()) {
      if (guest.helloReceived) guest.link.send(frame);
    }
    this.opts.onLobby?.(lobby);
  }

  private broadcastState(): void {
    if (!this.state) return;
    const view: PublicGameView = toPublicView(this.state);
    const stateFrame = JSON.stringify(hostMsg.state(view));
    const card = this.currentCard();
    const nullCardFrame = JSON.stringify(hostMsg.card(null));
    const clueCardFrame = JSON.stringify(hostMsg.card(card));
    for (const guest of this.guests.values()) {
      if (!guest.helloReceived) continue;
      guest.link.send(stateFrame);
      guest.link.send(guest.entry.peerId === this.clueGiverPeerId ? clueCardFrame : nullCardFrame);
    }
  }

  private handleGuestStatus(peerId: string, status: PeerStatus): void {
    const guest = this.guests.get(peerId);
    if (!guest) return;
    if (status === "disconnected" || status === "failed" || status === "closed") {
      if (!guest.entry.connected) return;
      guest.entry.connected = false;
      if (this.clueGiverPeerId === peerId) this.assignClueGiver();
      this.broadcastLobby();
    } else if (status === "connected") {
      guest.entry.connected = true;
    }
  }

  private handleFrame(peerId: string, raw: string): void {
    const guest = this.guests.get(peerId);
    if (!guest) return;
    const msg = parseClientMessage(raw);
    if (!msg) return; // malformed / oversized → dropped

    guest.lastSeen = Date.now();
    if (!guest.entry.connected) {
      guest.entry.connected = true;
      this.broadcastLobby();
    }

    switch (msg.t) {
      case "hello": {
        if (msg.protocol !== PROTOCOL_VERSION) {
          guest.link.send(
            JSON.stringify(hostMsg.error("protocol", "This player is on a different version.")),
          );
          guest.link.close();
          this.guests.delete(peerId);
          this.broadcastLobby();
          return;
        }
        guest.entry.name = msg.name;
        guest.helloReceived = true;
        guest.link.send(JSON.stringify(hostMsg.welcome(peerId, this.opts.hostName)));
        if (this.state) {
          guest.link.send(JSON.stringify(hostMsg.state(toPublicView(this.state))));
          guest.link.send(
            JSON.stringify(
              hostMsg.card(peerId === this.clueGiverPeerId ? this.currentCard() : null),
            ),
          );
        }
        this.broadcastLobby();
        return;
      }
      case "chooseTeam": {
        if (this.state) return; // team selection is lobby-only
        if (msg.teamId !== null && !this.opts.teams.some((t) => t.id === msg.teamId)) return;
        guest.entry.teamId = msg.teamId;
        this.broadcastLobby();
        return;
      }
      case "intent":
        this.handleIntent(guest, msg.stateVersion, msg.intent);
        return;
      case "ping":
        guest.link.send(JSON.stringify(hostMsg.pong(msg.ts)));
        return;
      case "pong":
        return;
    }
  }

  private handleIntent(guest: Guest, version: number, intent: NetworkIntent): void {
    if (!this.state) return;
    const team = this.state.teams[this.state.currentTeamIndex];
    const controlling = !!team && guest.entry.teamId === team.id;
    if (!controlling) {
      guest.link.send(JSON.stringify(hostMsg.error("turn", "It's not your team's turn.")));
      return;
    }
    if (CARD_INTENTS.has(intent.kind) && version !== this.state.version) {
      // Guest acted on a stale card; refuse and resend the current truth.
      guest.link.send(JSON.stringify(hostMsg.error("stale", "That card already moved on.")));
      guest.link.send(JSON.stringify(hostMsg.state(toPublicView(this.state))));
      return;
    }
    this.apply(intentToAction(intent, Date.now()));
  }

  private heartbeat(): void {
    const now = Date.now();
    const ping = JSON.stringify(hostMsg.ping());
    let rosterChanged = false;
    for (const guest of this.guests.values()) {
      guest.link.send(ping);
      if (guest.entry.connected && now - guest.lastSeen > HEARTBEAT_TIMEOUT_MS) {
        guest.entry.connected = false;
        if (this.clueGiverPeerId === guest.entry.peerId) this.assignClueGiver();
        rosterChanged = true;
      }
    }
    if (rosterChanged) this.broadcastLobby();
  }
}

// ---------------------------------------------------------------------------
// Guest
// ---------------------------------------------------------------------------

export interface GuestSessionOptions {
  name: string;
  onLobby?: (lobby: LobbyView) => void;
  onState?: (view: PublicGameView) => void;
  onCard?: (card: PrivateCard) => void;
  onConnection?: (status: ConnectionStatus) => void;
  onError?: (code: string, message: string) => void;
  onKicked?: (reason: string) => void;
  onWelcome?: (peerId: string, hostName: string) => void;
}

export class GuestSession {
  private readonly link: PeerLink;
  private readonly opts: GuestSessionOptions;
  private view: PublicGameView | null = null;
  private helloSent = false;
  private connection: ConnectionStatus = "connecting";
  private lastServerSeen = Date.now();
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  constructor(link: PeerLink, options: GuestSessionOptions) {
    this.link = link;
    this.opts = options;
    link.setHandlers({
      onData: (raw) => this.handleFrame(raw),
      onStatus: (status) => this.handleStatus(status),
    });
    this.heartbeatTimer = setInterval(() => this.heartbeat(), HEARTBEAT_INTERVAL_MS);
    if (link.getStatus() === "connected") {
      this.setConnection("connected");
      this.sendHello();
    }
  }

  sendIntent(intent: NetworkIntent): void {
    const version = this.view?.version ?? 0;
    this.link.send(JSON.stringify(clientMsg.intent(version, intent)));
  }

  chooseTeam(teamId: string | null): void {
    this.link.send(JSON.stringify(clientMsg.chooseTeam(teamId)));
  }

  getView(): PublicGameView | null {
    return this.view;
  }

  getConnection(): ConnectionStatus {
    return this.connection;
  }

  close(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;
    this.link.close();
  }

  private sendHello(): void {
    if (this.helloSent) return;
    this.helloSent = true;
    this.link.send(JSON.stringify(clientMsg.hello(this.opts.name)));
  }

  private setConnection(status: ConnectionStatus): void {
    if (this.connection === status) return;
    this.connection = status;
    this.opts.onConnection?.(status);
  }

  private handleStatus(status: PeerStatus): void {
    if (status === "connected") {
      this.setConnection("connected");
      this.sendHello();
    } else if (status === "disconnected" || status === "failed" || status === "closed") {
      this.setConnection("disconnected");
    }
  }

  private handleFrame(raw: string): void {
    const msg = parseHostMessage(raw);
    if (!msg) return; // malformed / oversized → dropped

    this.lastServerSeen = Date.now();
    this.setConnection("connected");

    switch (msg.t) {
      case "welcome":
        if (msg.protocol !== PROTOCOL_VERSION) {
          this.opts.onError?.("protocol", "The host is on a different version.");
          this.close();
          return;
        }
        this.opts.onWelcome?.(msg.peerId, msg.hostName);
        return;
      case "lobby":
        this.opts.onLobby?.(msg.lobby);
        return;
      case "state":
        if (this.view && msg.view.version < this.view.version) return; // stale — drop
        this.view = msg.view;
        this.opts.onState?.(msg.view);
        return;
      case "card":
        this.opts.onCard?.(msg.card);
        return;
      case "error":
        this.opts.onError?.(msg.code, msg.message);
        return;
      case "kicked":
        this.opts.onKicked?.(msg.reason);
        this.close();
        return;
      case "ping":
        this.link.send(JSON.stringify(clientMsg.pong(msg.ts)));
        return;
      case "pong":
        return;
    }
  }

  private heartbeat(): void {
    this.link.send(JSON.stringify(clientMsg.ping()));
    if (
      this.connection === "connected" &&
      Date.now() - this.lastServerSeen > HEARTBEAT_TIMEOUT_MS
    ) {
      this.setConnection("disconnected");
    }
  }
}
