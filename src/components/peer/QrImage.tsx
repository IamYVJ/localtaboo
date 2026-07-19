import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

interface QrImageProps {
  /** The text to encode. Larger payloads produce denser codes. */
  value: string;
  size?: number;
  label?: string;
}

/**
 * Render a QR code to a canvas. Kept dependency-light and offline — the code is
 * generated locally, nothing is fetched. Very large payloads may exceed QR
 * capacity, in which case we surface a hint to use the copyable code instead.
 */
export function QrImage({ value, size = 232, label }: QrImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    QRCode.toCanvas(canvas, value, { errorCorrectionLevel: "L", margin: 1, width: size })
      .then(() => {
        if (!cancelled) setError(false);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (error) {
    return (
      <p className="wl-small" role="status">
        This code is too large for a QR image — use the copyable text instead.
      </p>
    );
  }

  return (
    <div className="wl-qr">
      <canvas ref={canvasRef} role="img" aria-label={label ?? "QR code"} />
    </div>
  );
}
