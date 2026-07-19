interface SpinnerProps {
  label?: string;
}

export function Spinner({ label = "Loading" }: SpinnerProps) {
  return (
    <span className="wl-cluster" role="status">
      <span className="wl-spinner" aria-hidden="true" />
      <span className="wl-sr-only">{label}</span>
    </span>
  );
}
