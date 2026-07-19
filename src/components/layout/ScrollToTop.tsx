import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Resets scroll position on navigation (HashRouter has no built-in restore). */
export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
