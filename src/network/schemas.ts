/**
 * Runtime validation for every inbound frame. Nothing from the data channel is
 * trusted: frames are size-capped, JSON-parsed defensively, and structurally
 * validated before a single field is read by the rest of the app. Malformed,
 * oversized, or unknown messages are dropped (the parsers return null).
 */

import type { WordCard } from "../game/types";
import { sanitizeText } from "../utils/sanitization";
import {
  MAX_MESSAGE_BYTES,
  type ClientMessage,
  type HostMessage,
  type LobbyView,
  type NetworkIntent,
  type PublicGameView,
} from "./protocol";

const NAME_MAX = 24;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Byte length of a UTF-8 string without allocating a Buffer. */
function byteLength(text: string): number {
  if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(text).length;
  return unescape(encodeURIComponent(text)).length;
}

function safeParse(raw: string): unknown {
  if (byteLength(raw) > MAX_MESSAGE_BYTES) return undefined;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return undefined;
  }
}

function parseIntent(raw: unknown): NetworkIntent | null {
  if (!isRecord(raw) || typeof raw.kind !== "string") return null;
  switch (raw.kind) {
    case "startRound":
    case "pauseRound":
    case "resumeRound":
    case "endRound":
    case "advanceTurn":
      return { kind: raw.kind };
    case "markCorrect":
    case "skipCard":
    case "applyPenalty":
      return typeof raw.cardId === "string" && raw.cardId.length > 0 && raw.cardId.length <= 128
        ? { kind: raw.kind, cardId: raw.cardId }
        : null;
    default:
      return null;
  }
}

/** Validate a Guest → Host frame. Returns null for anything unexpected. */
export function parseClientMessage(raw: string): ClientMessage | null {
  const data = safeParse(raw);
  if (!isRecord(data) || typeof data.t !== "string") return null;

  switch (data.t) {
    case "hello": {
      if (!isFiniteNumber(data.protocol)) return null;
      const name = sanitizeText(data.name, NAME_MAX);
      return { t: "hello", protocol: data.protocol, name: name || "Player" };
    }
    case "chooseTeam": {
      const teamId =
        data.teamId === null
          ? null
          : typeof data.teamId === "string" && data.teamId.length <= 128
            ? data.teamId
            : undefined;
      return teamId === undefined ? null : { t: "chooseTeam", teamId };
    }
    case "intent": {
      if (!isFiniteNumber(data.stateVersion)) return null;
      const intent = parseIntent(data.intent);
      return intent ? { t: "intent", stateVersion: data.stateVersion, intent } : null;
    }
    case "ping":
      return isFiniteNumber(data.ts) ? { t: "ping", ts: data.ts } : null;
    case "pong":
      return isFiniteNumber(data.ts) ? { t: "pong", ts: data.ts } : null;
    default:
      return null;
  }
}

/** Light structural check of a broadcast game view. */
function looksLikeView(raw: unknown): raw is PublicGameView {
  return (
    isRecord(raw) &&
    typeof raw.phase === "string" &&
    isFiniteNumber(raw.version) &&
    Array.isArray(raw.teams) &&
    Array.isArray(raw.scores)
  );
}

function looksLikeLobby(raw: unknown): raw is LobbyView {
  return (
    isRecord(raw) &&
    typeof raw.hostName === "string" &&
    Array.isArray(raw.teams) &&
    Array.isArray(raw.roster) &&
    isRecord(raw.rules) &&
    typeof raw.canStart === "boolean"
  );
}

/** A private card frame is either an explicit null or a minimal card shape. */
function parseCard(raw: unknown): WordCard | null {
  if (raw === null || raw === undefined) return null;
  if (isRecord(raw) && typeof raw.word === "string" && Array.isArray(raw.forbidden)) {
    return {
      id: typeof raw.id === "string" ? raw.id : "",
      word: sanitizeText(raw.word, 48),
      forbidden: raw.forbidden.map((f) => sanitizeText(f, 40)).filter((f) => f.length > 0),
      ...(typeof raw.category === "string" ? { category: sanitizeText(raw.category, 40) } : {}),
    };
  }
  return null;
}

/** Validate a Host → Guest frame. Returns null for anything unexpected. */
export function parseHostMessage(raw: string): HostMessage | null {
  const data = safeParse(raw);
  if (!isRecord(data) || typeof data.t !== "string") return null;

  switch (data.t) {
    case "welcome":
      return isFiniteNumber(data.protocol) && typeof data.peerId === "string"
        ? {
            t: "welcome",
            protocol: data.protocol,
            peerId: data.peerId,
            hostName: sanitizeText(data.hostName, NAME_MAX) || "Host",
          }
        : null;
    case "lobby":
      return looksLikeLobby(data.lobby) ? { t: "lobby", lobby: data.lobby } : null;
    case "state":
      return looksLikeView(data.view) ? { t: "state", view: data.view } : null;
    case "card":
      return { t: "card", card: parseCard(data.card) };
    case "error":
      return typeof data.code === "string" && typeof data.message === "string"
        ? { t: "error", code: data.code, message: sanitizeText(data.message, 200) }
        : null;
    case "kicked":
      return { t: "kicked", reason: sanitizeText(data.reason, 200) };
    case "ping":
      return isFiniteNumber(data.ts) ? { t: "ping", ts: data.ts } : null;
    case "pong":
      return isFiniteNumber(data.ts) ? { t: "pong", ts: data.ts } : null;
    default:
      return null;
  }
}
