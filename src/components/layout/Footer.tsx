import { Link } from "react-router-dom";
import { ROUTES } from "../../app/routes";
import { appConfig } from "../../config/appConfig";

export function Footer() {
  return (
    <footer className="wl-footer">
      <div className="wl-footer__inner">
        <p className="wl-caption">
          {appConfig.name} · v{appConfig.version} · Runs entirely in your browser
        </p>
        <div className="wl-cluster">
          <Link to={ROUTES.howToPlay} className="wl-nav__link">
            How to play
          </Link>
          <Link to={ROUTES.privacy} className="wl-nav__link">
            Privacy
          </Link>
          <Link to={ROUTES.about} className="wl-nav__link">
            About
          </Link>
          <a
            className="wl-nav__link"
            href={appConfig.repositoryUrl}
            target="_blank"
            rel="noreferrer noopener"
          >
            Source
          </a>
        </div>
      </div>
    </footer>
  );
}
