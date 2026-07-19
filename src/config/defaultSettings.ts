import type { GameRules, Preferences } from "../game/types";

/** Default rule set. Two teams, 60-second rounds, +1 correct, -1 violation. */
export const defaultRules: GameRules = {
  roundDurationSec: 60,
  targetScore: 25,
  roundsPerTeam: 4,
  unlimitedRounds: false,
  skipLimit: 3,
  skipsCostPoints: false,
  skipPenaltyValue: 1,
  penaltyValue: 1,
  penaltyAdvancesCard: true,
  skippedCardsReturnToDeck: true,
  allowDuplicateCards: false,
  gesturesAllowed: false,
  spellingAllowed: false,
  correctValue: 1,
  tiebreaker: "sudden-death",
};

export const defaultPreferences: Preferences = {
  theme: "system",
  soundEnabled: false,
  vibrationEnabled: true,
  onboardingComplete: false,
};

export const defaultTeamNames = ["Team One", "Team Two", "Team Three", "Team Four"];

/** Validation bounds shared by setup forms and runtime validation. */
export const settingBounds = {
  teamCount: { min: 2, max: 4 },
  roundDurationSec: { min: 15, max: 300, step: 5 },
  targetScore: { min: 0, max: 100 },
  roundsPerTeam: { min: 1, max: 20 },
  skipLimit: { min: -1, max: 20 },
  penaltyValue: { min: 0, max: 5 },
  skipPenaltyValue: { min: 0, max: 5 },
  correctValue: { min: 1, max: 5 },
  playersPerTeam: { min: 0, max: 8 },
  teamNameMaxLength: 24,
  playerNameMaxLength: 20,
} as const;
