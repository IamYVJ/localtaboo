import { useEffect, useState } from "react";
import { StatusDot } from "./StatusDot";

/**
 * Shows a thin bar when the browser reports it is offline. The app works
 * offline once installed, so this is informational rather than an error.
 */
export function OfflineIndicator() {
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div className="wl-offline-bar" role="status">
      <StatusDot status="offline" label="Offline" />
      <span>Offline — the game keeps working; peer connections need a network.</span>
    </div>
  );
}
