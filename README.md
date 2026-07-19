# WORDLOCK

**Say everything except the obvious.**

WORDLOCK is a forbidden-word party game for one screen or many. Get your team to
guess the word at the top of the card — but the five words most likely to help you
are locked. Talk around them, race the clock, and don't get caught saying a
forbidden word.

It runs entirely in the browser. There is no account to create, no server to talk
to, and nothing to install. Open it and play.

🔗 **Play:** https://IamYVJ.github.io/localtaboo/

---

## Two ways to play

- **Pass & Play** — One device, passed around the room. A privacy handoff screen
  keeps the target word hidden until the right person is holding the phone.
- **Peer-to-Peer** — Separate devices connected directly to each other. One player
  hosts; everyone else joins by exchanging a short connection code (or scanning a
  QR code). The clue-giver's card is delivered privately to their screen while
  everyone else sees only the shared scoreboard and timer.

Both modes share the same rules engine, decks, timer, and scoring.

## What's inside

- **A 225-card original deck** — family-friendly words, each with five forbidden
  words, spanning everyday categories and difficulty levels.
- **Custom decks** — build, edit, import, and export your own decks. Custom decks
  live only on your device.
- **Configurable rules** — round length, points, skip allowance, penalties for
  forbidden words, and win conditions are all adjustable.
- **Big, legible game screen** — oversized timer and score built for reading across
  a room.
- **Opt-in feedback** — sound cues, haptic buzzes, and screen wake-lock, all off
  until you turn them on.
- **Light, dark, and system themes** with a single configurable accent colour.
- **Installable & offline** — as a Progressive Web App it can be added to a home
  screen and played without a connection once loaded.

## Privacy by design

WORDLOCK is local-first. Your decks, settings, and game state stay in your browser's
local storage.

- No backend, database, accounts, or analytics.
- Peer-to-Peer games connect devices **directly** using browser-native WebRTC data
  channels. Connection setup uses public STUN servers only for address discovery —
  there is no relay server in the middle, and game data never passes through a
  third party.
- Connection codes are exchanged by you, out of band, and are only useful to the
  players you share them with.
- Custom decks are never uploaded anywhere.

## How the peer-to-peer game stays fair

The host device is authoritative: it owns the single source of truth for the game
state and broadcasts it to every player. Guests send *intents* ("mark correct",
"skip", "penalty") which the host validates before applying. The clue-giver's card
is sent only to the clue-giver; everyone else receives a redacted view with the
target and forbidden words stripped out. Inbound network messages are size-capped,
strictly validated, and rejected if malformed or stale.

## Design

The interface is deliberately quiet: a Swiss/editorial, typography-led layout with
generous whitespace, a strict grid, thin rules, and monochrome tones lifted by one
accent. The redaction-bar motif — the "lock" over the forbidden words — carries
through the wordmark and app icon.

## Built with

React, TypeScript (strict), and Vite, with hash-based routing, a pure reducer-driven
game engine, WebRTC data channels for peer play, and a service worker for offline
use. It has no runtime dependency on any paid service.

## Licence

Released under the MIT Licence. See [LICENSE](./LICENSE).
