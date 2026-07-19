/**
 * Central branding and deployment configuration.
 * Rename or rebrand the application by editing this file only.
 */

export interface AppConfig {
  /** Wordmark shown throughout the interface. */
  name: string;
  tagline: string;
  supportingText: string;
  /** A single accent colour applied to the otherwise monochrome UI. */
  accentColor: string;
  /** Contrast colour used for text/icons placed on the accent. */
  accentContrast: string;
  version: string;
  /** Public repository URL. Leave empty to hide repository links. */
  repositoryUrl: string;
  /** Live GitHub Pages URL. Leave empty to hide the live-site link. */
  githubPagesUrl: string;
  /** STUN servers used for WebRTC ICE gathering. No TURN server is included. */
  stunServers: string[];
}

export const appConfig: AppConfig = {
  name: "WORDLOCK",
  tagline: "Say everything except the obvious.",
  supportingText: "A fast word game for one screen or many.",
  accentColor: "#ff4a1c",
  accentContrast: "#ffffff",
  version: "1.0.0",
  // Repository-specific values — update if the project is forked or renamed.
  repositoryUrl: "https://github.com/IamYVJ/localtaboo",
  githubPagesUrl: "https://IamYVJ.github.io/localtaboo/",
  stunServers: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"],
};

export const modeCopy = {
  passPlay: {
    title: "Pass & Play",
    blurb: "Share one screen and pass the device between turns.",
  },
  peer: {
    title: "Peer-to-Peer",
    blurb: "Connect separate devices and keep the game synchronized.",
  },
} as const;
