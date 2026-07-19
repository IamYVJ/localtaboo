import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { GameRules, GameState, WordCard } from "../game/types";
import { createId } from "../utils/ids";
import { PeerLink } from "../network/peer";
import { GuestSession, HostSession, type ConnectionStatus } from "../network/session";
import type { LobbyView, NetworkIntent, PrivateCard, PublicGameView } from "../network/protocol";

export type PeerRole = "host" | "guest";

export interface HostRoomOptions {
  hostName: string;
  rules: GameRules;
  cards: WordCard[];
  teams: { id: string; name: string }[];
}

interface PeerContextValue {
  role: PeerRole | null;
  lobby: LobbyView | null;
  /** Host-only: the authoritative game state. */
  hostGame: GameState | null;
  /** Guest-only: the redacted view broadcast by the host. */
  guestView: PublicGameView | null;
  /** Guest-only: the private card, non-null only for the active clue-giver. */
  card: PrivateCard;
  connection: ConnectionStatus;
  selfPeerId: string | null;
  hostName: string | null;
  lastError: string | null;
  clueGiverPeerId: string | null;

  // Host
  createHostRoom: (opts: HostRoomOptions) => void;
  hostCreateOffer: () => Promise<string>;
  hostAcceptAnswer: (code: string) => Promise<boolean>;
  hostStartGame: () => boolean;
  hostControl: (intent: NetworkIntent) => void;
  hostSetClueGiver: (peerId: string | null) => void;
  hostAssignTeam: (peerId: string, teamId: string | null) => void;
  hostKick: (peerId: string) => void;

  // Guest
  startGuest: (name: string) => void;
  guestAcceptOffer: (offerCode: string) => Promise<string>;
  guestSendIntent: (intent: NetworkIntent) => void;
  guestChooseTeam: (teamId: string | null) => void;

  leave: () => void;
}

const PeerContext = createContext<PeerContextValue | null>(null);

export function PeerProvider({ children }: { children: ReactNode }) {
  const hostSessionRef = useRef<HostSession | null>(null);
  const guestSessionRef = useRef<GuestSession | null>(null);
  const pendingLinkRef = useRef<PeerLink | null>(null);
  const guestNameRef = useRef<string>("Player");

  const [role, setRole] = useState<PeerRole | null>(null);
  const [lobby, setLobby] = useState<LobbyView | null>(null);
  const [hostGame, setHostGame] = useState<GameState | null>(null);
  const [guestView, setGuestView] = useState<PublicGameView | null>(null);
  const [card, setCard] = useState<PrivateCard>(null);
  const [connection, setConnection] = useState<ConnectionStatus>("connecting");
  const [selfPeerId, setSelfPeerId] = useState<string | null>(null);
  const [hostName, setHostName] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [clueGiverPeerId, setClueGiverPeerId] = useState<string | null>(null);

  const leave = useCallback(() => {
    hostSessionRef.current?.close();
    guestSessionRef.current?.close();
    pendingLinkRef.current?.close();
    hostSessionRef.current = null;
    guestSessionRef.current = null;
    pendingLinkRef.current = null;
    setRole(null);
    setLobby(null);
    setHostGame(null);
    setGuestView(null);
    setCard(null);
    setConnection("connecting");
    setSelfPeerId(null);
    setHostName(null);
    setLastError(null);
    setClueGiverPeerId(null);
  }, []);

  // ---- Host ----

  const createHostRoom = useCallback((opts: HostRoomOptions) => {
    const session = new HostSession({
      hostName: opts.hostName,
      rules: opts.rules,
      cards: opts.cards,
      teams: opts.teams,
      onLobby: (next) => {
        setLobby(next);
        setClueGiverPeerId(session.getClueGiverPeerId());
      },
      onState: (next) => {
        setHostGame(next);
        setClueGiverPeerId(session.getClueGiverPeerId());
      },
    });
    hostSessionRef.current = session;
    setRole("host");
    setHostName(opts.hostName);
    setLobby(session.getLobby());
    setConnection("connected");
  }, []);

  const hostCreateOffer = useCallback(async () => {
    const session = hostSessionRef.current;
    if (!session) throw new Error("No room is open.");
    const link = new PeerLink(createId("link"));
    session.registerGuest(link);
    pendingLinkRef.current = link;
    return link.createOffer();
  }, []);

  const hostAcceptAnswer = useCallback(async (code: string) => {
    const link = pendingLinkRef.current;
    if (!link) return false;
    try {
      await link.acceptAnswer(code);
      pendingLinkRef.current = null;
      return true;
    } catch {
      return false;
    }
  }, []);

  const hostStartGame = useCallback(() => hostSessionRef.current?.start() ?? false, []);
  const hostControl = useCallback((intent: NetworkIntent) => {
    hostSessionRef.current?.control(intent);
  }, []);
  const hostSetClueGiver = useCallback((peerId: string | null) => {
    hostSessionRef.current?.setClueGiver(peerId);
    setClueGiverPeerId(peerId);
  }, []);
  const hostAssignTeam = useCallback((peerId: string, teamId: string | null) => {
    hostSessionRef.current?.assignTeam(peerId, teamId);
  }, []);
  const hostKick = useCallback((peerId: string) => {
    hostSessionRef.current?.kick(peerId);
  }, []);

  // ---- Guest ----

  const startGuest = useCallback((name: string) => {
    guestNameRef.current = name.trim() || "Player";
    setRole("guest");
    setConnection("connecting");
  }, []);

  const guestAcceptOffer = useCallback(
    async (offerCode: string) => {
      const link = new PeerLink(createId("link"));
      const answer = await link.acceptOffer(offerCode);
      const session = new GuestSession(link, {
        name: guestNameRef.current,
        onLobby: setLobby,
        onState: setGuestView,
        onCard: setCard,
        onConnection: setConnection,
        onError: (_code, message) => setLastError(message),
        onKicked: (reason) => {
          setLastError(reason);
          leave();
        },
        onWelcome: (peerId, host) => {
          setSelfPeerId(peerId);
          setHostName(host);
        },
      });
      guestSessionRef.current = session;
      pendingLinkRef.current = link;
      return answer;
    },
    [leave],
  );

  const guestSendIntent = useCallback((intent: NetworkIntent) => {
    guestSessionRef.current?.sendIntent(intent);
  }, []);
  const guestChooseTeam = useCallback((teamId: string | null) => {
    guestSessionRef.current?.chooseTeam(teamId);
  }, []);

  const value = useMemo<PeerContextValue>(
    () => ({
      role,
      lobby,
      hostGame,
      guestView,
      card,
      connection,
      selfPeerId,
      hostName,
      lastError,
      clueGiverPeerId,
      createHostRoom,
      hostCreateOffer,
      hostAcceptAnswer,
      hostStartGame,
      hostControl,
      hostSetClueGiver,
      hostAssignTeam,
      hostKick,
      startGuest,
      guestAcceptOffer,
      guestSendIntent,
      guestChooseTeam,
      leave,
    }),
    [
      role,
      lobby,
      hostGame,
      guestView,
      card,
      connection,
      selfPeerId,
      hostName,
      lastError,
      clueGiverPeerId,
      createHostRoom,
      hostCreateOffer,
      hostAcceptAnswer,
      hostStartGame,
      hostControl,
      hostSetClueGiver,
      hostAssignTeam,
      hostKick,
      startGuest,
      guestAcceptOffer,
      guestSendIntent,
      guestChooseTeam,
      leave,
    ],
  );

  return <PeerContext.Provider value={value}>{children}</PeerContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePeer(): PeerContextValue {
  const ctx = useContext(PeerContext);
  if (!ctx) throw new Error("usePeer must be used within PeerProvider");
  return ctx;
}
