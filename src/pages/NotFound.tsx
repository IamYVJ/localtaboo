import { Link } from "react-router-dom";
import { ROUTES } from "../app/routes";
import { buttonClasses } from "../components/buttonClasses";

export default function NotFound() {
  return (
    <div
      className="wl-stack wl-stack--loose wl-text-center"
      style={{ paddingBlock: "var(--space-9)" }}
    >
      <p className="wl-display wl-accent" aria-hidden="true">
        404
      </p>
      <h1 className="wl-h1">This page isn’t here.</h1>
      <p className="wl-lede" style={{ marginInline: "auto" }}>
        The link may be broken, or the page may have moved.
      </p>
      <div className="wl-cluster" style={{ justifyContent: "center" }}>
        <Link to={ROUTES.home} className={buttonClasses("primary", "lg")}>
          Back to home
        </Link>
      </div>
    </div>
  );
}
