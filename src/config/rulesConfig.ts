/**
 * Human-readable rule, instruction, and policy copy.
 * Centralised so the game can be rebranded and reworded without touching pages.
 */

export interface ExampleTurn {
  target: string;
  forbidden: string[];
  validClue: string;
  invalidClue: string;
}

export const exampleTurn: ExampleTurn = {
  target: "VOLCANO",
  forbidden: ["lava", "mountain", "eruption", "fire", "ash"],
  validClue:
    "“This is a natural landform that can stay quiet for years, then suddenly send hot melted rock into the sky.”",
  invalidClue:
    "“It’s a mountain that shoots lava during an eruption.” — uses three forbidden words.",
};

export const objectiveCopy =
  "The clue-giver helps their team guess the large target word without ever saying it — or any of the forbidden words listed underneath it.";

export const basicRules: string[] = [
  "Players divide into teams.",
  "Teams alternate turns.",
  "One player on the active team becomes the clue-giver.",
  "The clue-giver sees a target word and its forbidden words.",
  "The clue-giver describes the target without saying it.",
  "The clue-giver may not say any forbidden word.",
  "Teammates call out guesses.",
  "Correct answers earn points.",
  "Skips and rule violations follow the selected game settings.",
  "The turn ends when time expires.",
  "The highest score — or the first team to the target score — wins.",
];

export interface ActionDescription {
  label: string;
  description: string;
}

export const actionDescriptions: ActionDescription[] = [
  {
    label: "Correct",
    description: "The team guessed the word. Award points and reveal the next card.",
  },
  { label: "Skip", description: "Pass on a card. Skips follow the configured limit and cost." },
  {
    label: "Penalty",
    description: "Record a rule violation and apply the configured point change.",
  },
  {
    label: "Pause",
    description: "Freeze the timer and hide the card. Resuming needs a deliberate action.",
  },
];

export const passPlaySteps: string[] = [
  "Choose Pass & Play.",
  "Add teams.",
  "Configure the timer and scoring.",
  "Pass the device to the clue-giver.",
  "Hold or tap the reveal control.",
  "Play until time expires.",
  "Review the round.",
  "Pass the device to the next team.",
];

export const peerSteps: string[] = [
  "One player chooses Host Game.",
  "The host configures the game.",
  "The host generates a connection offer.",
  "Another player scans or pastes the offer.",
  "The joining player generates an answer.",
  "The host scans or pastes the answer.",
  "Both devices confirm the connection.",
  "Players enter the lobby.",
  "The host starts the game.",
];

export const ruleViolations: string[] = [
  "Says the target word.",
  "Says part of the target word.",
  "Says a forbidden word.",
  "Spells the answer.",
  "Gives an obvious first-letter clue.",
  "Uses a translation of the target.",
  "Uses gestures when gestures are disabled.",
];

export const strategyTips: string[] = [
  "Describe categories and situations.",
  "Use comparisons.",
  "Describe where something is found.",
  "Describe what it does.",
  "Avoid beginning with the most obvious clue.",
  "Watch the forbidden-word list carefully.",
];

export const customRuleAreas: string[] = [
  "Round duration",
  "Number of teams",
  "Target score",
  "Round count",
  "Skip limit",
  "Skip penalties",
  "Violation penalties",
  "Duplicate cards",
  "Gestures",
  "Sounds",
  "Vibration",
];

export const peerConnectionNotes: string[] = [
  "The static site has no signaling server, so connection details are exchanged by hand.",
  "A TURN server is not included; some restrictive networks may block a direct connection.",
  "Being on the same local network does not guarantee a successful connection.",
  "Only share connection codes with the people you intend to play with.",
  "Host migration is not supported — if the host leaves, the game ends.",
];

export const privacyPoints: string[] = [
  "No account is required to play.",
  "No analytics are collected by default.",
  "The site contains no advertising.",
  "Game content is never sent to an application server.",
  "Settings and custom decks are stored locally in your browser.",
  "Custom decks stay on your device and are never uploaded.",
  "Peer messages travel directly between connected browsers where the network allows.",
  "No signaling server is included in this static build.",
  "Standard WebRTC connection metadata may be visible to connected peers or network infrastructure.",
  "Clearing your browser storage removes local settings and custom decks.",
];

export const currentLimitations: string[] = [
  "Peer-to-peer connections use a manual offer-and-answer exchange.",
  "No TURN server is provided, so some networks will block direct connections.",
  "Host migration is not supported.",
  "Automatic room discovery is not included.",
];

export const keyboardShortcuts: { keys: string; action: string }[] = [
  { keys: "→", action: "Correct" },
  { keys: "←", action: "Skip" },
  { keys: "↓", action: "Penalty" },
  { keys: "Space", action: "Pause / Resume" },
  { keys: "Esc", action: "Open pause menu" },
];
