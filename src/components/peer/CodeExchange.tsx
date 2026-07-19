import { useState } from "react";
import { Button } from "../Button";
import { TextArea } from "../form/TextArea";
import { QrImage } from "./QrImage";
import { QrScanner } from "./QrScanner";
import { copyToClipboard } from "../../utils/clipboard";

interface ShareCodeProps {
  code: string;
  label: string;
  hint?: string;
  onCopied?: () => void;
}

/** Present a code for the other player to scan or copy. */
export function ShareCode({ code, label, hint, onCopied }: ShareCodeProps) {
  const [showQr, setShowQr] = useState(true);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const ok = await copyToClipboard(code);
    setCopied(ok);
    if (ok) onCopied?.();
  };

  return (
    <div className="wl-stack wl-stack--tight">
      <div className="wl-cluster wl-cluster--between">
        <span className="wl-label">{label}</span>
        <button
          type="button"
          className="wl-btn wl-btn--ghost wl-btn--sm"
          onClick={() => setShowQr((v) => !v)}
          aria-pressed={showQr}
        >
          {showQr ? "Hide QR" : "Show QR"}
        </button>
      </div>
      {hint ? <p className="wl-small">{hint}</p> : null}
      {showQr ? (
        <div className="wl-cluster" style={{ justifyContent: "center" }}>
          <QrImage value={code} label={label} />
        </div>
      ) : null}
      <TextArea label={label} hideLabel value={code} readOnly rows={3} spellCheck={false} />
      <Button variant="secondary" onClick={() => void copy()}>
        {copied ? "Copied ✓" : "Copy code"}
      </Button>
    </div>
  );
}

interface EnterCodeProps {
  label: string;
  hint?: string;
  submitLabel: string;
  busy?: boolean;
  onSubmit: (code: string) => void;
}

/** Accept a code from the other player via paste or camera scan. */
export function EnterCode({ label, hint, submitLabel, busy, onSubmit }: EnterCodeProps) {
  const [value, setValue] = useState("");
  const [scanning, setScanning] = useState(false);

  const submit = (code: string) => {
    const trimmed = code.trim();
    if (trimmed.length > 0) onSubmit(trimmed);
  };

  return (
    <div className="wl-stack wl-stack--tight">
      <TextArea
        label={label}
        hint={hint}
        value={value}
        rows={3}
        spellCheck={false}
        placeholder="Paste the code here…"
        onChange={(e) => setValue(e.target.value)}
      />
      {scanning ? (
        <QrScanner
          onResult={(text) => {
            setScanning(false);
            setValue(text);
            submit(text);
          }}
          onCancel={() => setScanning(false)}
        />
      ) : (
        <div className="wl-cluster">
          <Button variant="accent" onClick={() => submit(value)} disabled={busy}>
            {busy ? "Connecting…" : submitLabel}
          </Button>
          <Button variant="ghost" onClick={() => setScanning(true)}>
            Scan QR
          </Button>
        </div>
      )}
    </div>
  );
}
