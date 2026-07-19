import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { Spinner } from "../components/Spinner";
import { ROUTES } from "./routes";

const Home = lazy(() => import("../pages/Home"));
const HowToPlay = lazy(() => import("../pages/HowToPlay"));
const Privacy = lazy(() => import("../pages/Privacy"));
const About = lazy(() => import("../pages/About"));
const NotFound = lazy(() => import("../pages/NotFound"));
const PassPlaySetup = lazy(() => import("../pages/passplay/PassPlaySetup"));
const PassPlayGame = lazy(() => import("../pages/passplay/PassPlayGame"));
const DeckManager = lazy(() => import("../pages/DeckManager"));
const Settings = lazy(() => import("../pages/Settings"));
const PeerPlay = lazy(() => import("../pages/peer/PeerPlay"));
const Host = lazy(() => import("../pages/peer/Host"));
const Join = lazy(() => import("../pages/peer/Join"));
const Lobby = lazy(() => import("../pages/peer/Lobby"));
const PeerGame = lazy(() => import("../pages/peer/PeerGame"));

function RouteFallback() {
  return (
    <div className="wl-page" style={{ display: "grid", placeItems: "center" }}>
      <Spinner label="Loading page" />
    </div>
  );
}

export function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path={ROUTES.home} element={<Home />} />
          <Route path={ROUTES.passPlaySetup} element={<PassPlaySetup />} />
          <Route path={ROUTES.passPlayGame} element={<PassPlayGame />} />
          <Route path={ROUTES.peer} element={<PeerPlay />} />
          <Route path={ROUTES.peerHost} element={<Host />} />
          <Route path={ROUTES.peerJoin} element={<Join />} />
          <Route path={ROUTES.peerLobby} element={<Lobby />} />
          <Route path={ROUTES.peerGame} element={<PeerGame />} />
          <Route path={ROUTES.decks} element={<DeckManager />} />
          <Route path={ROUTES.howToPlay} element={<HowToPlay />} />
          <Route path={ROUTES.settings} element={<Settings />} />
          <Route path={ROUTES.privacy} element={<Privacy />} />
          <Route path={ROUTES.about} element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
