import { Outlet } from "react-router-dom";
import { NavBar } from "./NavBar";
import { Footer } from "./Footer";
import { ScrollToTop } from "./ScrollToTop";
import { OfflineIndicator } from "../OfflineIndicator";
import { Toaster } from "../Toaster";

/** App shell: skip link, offline bar, nav, routed content, footer, toasts. */
export function AppLayout() {
  return (
    <>
      <a href="#main" className="wl-skip-link">
        Skip to content
      </a>
      <OfflineIndicator />
      <NavBar />
      <main id="main" className="wl-page">
        <Outlet />
      </main>
      <Footer />
      <Toaster />
      <ScrollToTop />
    </>
  );
}
