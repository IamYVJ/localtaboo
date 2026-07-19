import type { ReactNode } from "react";
import { HashRouter } from "react-router-dom";
import { PreferencesProvider } from "../context/PreferencesContext";
import { ToastProvider } from "../context/ToastContext";
import { DeckProvider } from "../context/DeckContext";
import { GameProvider } from "../context/GameContext";
import { PeerProvider } from "../context/PeerContext";

/**
 * Composes every application-wide context and the router.
 *
 * A hash router is used so deep links work on GitHub Pages without any
 * server-side rewrite configuration.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <PreferencesProvider>
      <ToastProvider>
        <DeckProvider>
          <GameProvider>
            <PeerProvider>
              <HashRouter>{children}</HashRouter>
            </PeerProvider>
          </GameProvider>
        </DeckProvider>
      </ToastProvider>
    </PreferencesProvider>
  );
}
