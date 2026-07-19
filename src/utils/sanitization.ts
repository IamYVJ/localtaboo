/**
 * Text sanitisation for user- and peer-supplied content.
 * All rendering uses React's default escaping; these helpers additionally strip
 * control characters and cap length so imported or network data can never bloat
 * the UI or smuggle in control sequences. HTML is never interpreted.
 */

function isControlCode(code: number): boolean {
  // C0 controls (0x00-0x1F), DEL + C1 controls (0x7F-0x9F).
  return (code >= 0 && code <= 0x1f) || (code >= 0x7f && code <= 0x9f);
}

export function sanitizeText(input: unknown, maxLength = 120): string {
  if (typeof input !== "string") return "";
  let out = "";
  for (const ch of input) {
    const code = ch.codePointAt(0) ?? 0;
    out += isControlCode(code) ? " " : ch;
  }
  return out.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function sanitizeWord(input: unknown, maxLength = 48): string {
  return sanitizeText(input, maxLength);
}
