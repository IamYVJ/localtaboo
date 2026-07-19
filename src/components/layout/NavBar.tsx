import { NavLink } from "react-router-dom";
import { ROUTES } from "../../app/routes";
import { Wordmark } from "../Wordmark";
import { ThemeToggle } from "../ThemeToggle";

const PRIMARY_LINKS = [
  { to: ROUTES.howToPlay, label: "How to play" },
  { to: ROUTES.decks, label: "Decks" },
  { to: ROUTES.settings, label: "Settings" },
];

export function NavBar() {
  return (
    <nav className="wl-nav" aria-label="Primary">
      <div className="wl-nav__inner">
        <NavLink to={ROUTES.home} aria-label="Home">
          <Wordmark size="var(--text-lg)" />
        </NavLink>
        <div className="wl-nav__links">
          {PRIMARY_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className="wl-nav__link wl-hide-mobile">
              {link.label}
            </NavLink>
          ))}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
