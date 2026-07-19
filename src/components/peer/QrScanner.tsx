import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Button } from "../Button";

interface QrScannerProps {
  onResult: (text: string) => void;
  onCancel: () => void;
}

/**
 * Camera-based QR scanner. Uses getUserMedia + jsQR entirely on-device — no
 * frames leave the browser. Falls back to a clear message (and the manual paste
 * field remains available) when a camera is unavailable or permission is denied.
 */
export function QrScanner({ onResult, onCancel }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    const canvas = document.createElement("canvas");
    canvasRef.current = canvas;

    const scan = () => {
      const video = videoRef.current;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!video || !ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
        rafRef.current = requestAnimationFrame(scan);
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const found = jsQR(image.data, image.width, image.height, {
        inversionAttempts: "dontInvert",
      });
      if (found && found.data) {
        onResult(found.data);
        return; // stop scanning once we have a code
      }
      rafRef.current = requestAnimationFrame(scan);
    };

    async function begin() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("No camera is available on this device. Paste the code instead.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
          rafRef.current = requestAnimationFrame(scan);
        }
      } catch {
        setError("Couldn’t open the camera. Check permissions, or paste the code instead.");
      }
    }

    void begin();
    return () => {
      cancelled = true;
      stop();
    };
  }, [onResult, stop]);

  return (
    <div className="wl-stack wl-stack--tight">
      {error ? (
        <p className="wl-small" role="status">
          {error}
        </p>
      ) : (
        <div className="wl-qr-scanner">
          <video ref={videoRef} muted playsInline aria-label="Camera preview for scanning" />
        </div>
      )}
      <Button
        variant="ghost"
        onClick={() => {
          stop();
          onCancel();
        }}
      >
        Stop camera
      </Button>
    </div>
  );
}
