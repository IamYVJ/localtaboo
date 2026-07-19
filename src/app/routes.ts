/** Central route table. Paths are used with a hash router for GitHub Pages. */
export const ROUTES = {
  home: "/",
  passPlaySetup: "/pass-and-play",
  passPlayGame: "/pass-and-play/game",
  peer: "/peer",
  peerHost: "/peer/host",
  peerJoin: "/peer/join",
  peerLobby: "/peer/lobby",
  peerGame: "/peer/game",
  decks: "/decks",
  howToPlay: "/how-to-play",
  settings: "/settings",
  privacy: "/privacy",
  about: "/about",
} as const;

export type RouteKey = keyof typeof ROUTES;
