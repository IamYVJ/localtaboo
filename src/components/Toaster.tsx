import { useToast } from "../context/ToastContext";

/** Renders active toasts in a polite live region anchored to the bottom. */
export function Toaster() {
  const { toasts, dismissToast } = useToast();
  return (
    <div className="wl-toaster" role="region" aria-label="Notifications">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`wl-toast wl-toast--${toast.tone}`}
          role={toast.tone === "error" ? "alert" : "status"}
        >
          <span className="wl-toast__message">{toast.message}</span>
          <button
            type="button"
            className="wl-btn wl-btn--ghost wl-btn--sm"
            onClick={() => dismissToast(toast.id)}
            aria-label="Dismiss notification"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>
      ))}
    </div>
  );
}
