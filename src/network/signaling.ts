/**
 * Manual signaling codec. There is no signaling server: the offer/answer SDP is
 * encoded into a compact, copy-pasteable (and QR-encodable) code that players
 * exchange out-of-band. Codes are gzip-compressed when the browser supports the
 * Compression Streams API, falling back to plain base64url otherwise.
 *
 *   Code format:  W1<g|p><base64url payload>
 *                 └┬┘└┬─┘└──────┬──────────┘
 *              version  codec    data
 */

const PREFIX = "W1";
const MAX_SDP_LENGTH = 20_000;

interface SignalPayload {
  /** "offer" or "answer". */
  o: RTCSdpType;
  /** The SDP blob. */
  s: string;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array {
  const padded = text.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function hasCompression(): boolean {
  return typeof CompressionStream !== "undefined" && typeof DecompressionStream !== "undefined";
}

/**
 * Push a byte array through a (de)compression transform and collect the result.
 * Driving the writer/reader directly (rather than `Blob.stream().pipeThrough`)
 * keeps this working across browsers, Node, and the jsdom test environment,
 * whose Blob implementation lacks a usable `.stream()`.
 */
async function runTransform(
  bytes: Uint8Array,
  transform: CompressionStream | DecompressionStream,
): Promise<Uint8Array> {
  // Copy into a fresh, non-shared ArrayBuffer so the chunk is a valid BufferSource.
  const chunk = new Uint8Array(bytes.byteLength);
  chunk.set(bytes);

  const writer = transform.writable.getWriter();
  void writer.write(chunk);
  void writer.close();

  const reader = transform.readable.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      total += value.byteLength;
    }
  }

  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

async function gzip(bytes: Uint8Array): Promise<Uint8Array> {
  return runTransform(bytes, new CompressionStream("gzip"));
}

async function gunzip(bytes: Uint8Array): Promise<Uint8Array> {
  return runTransform(bytes, new DecompressionStream("gzip"));
}

/** Encode a local description into a shareable code. */
export async function encodeSignal(desc: RTCSessionDescriptionInit): Promise<string> {
  if (!desc.sdp || (desc.type !== "offer" && desc.type !== "answer")) {
    throw new Error("Cannot encode an incomplete session description.");
  }
  const payload: SignalPayload = { o: desc.type, s: desc.sdp };
  const raw = new TextEncoder().encode(JSON.stringify(payload));

  if (hasCompression()) {
    return `${PREFIX}g${toBase64Url(await gzip(raw))}`;
  }
  return `${PREFIX}p${toBase64Url(raw)}`;
}

/** Decode a shared code back into a session description, or null if invalid. */
export async function decodeSignal(code: string): Promise<RTCSessionDescriptionInit | null> {
  const trimmed = code.trim();
  if (!trimmed.startsWith(PREFIX) || trimmed.length < 4) return null;

  const codec = trimmed[2];
  const body = trimmed.slice(3);
  try {
    const bytes = fromBase64Url(body);
    const rawBytes = codec === "g" ? await gunzip(bytes) : codec === "p" ? bytes : null;
    if (!rawBytes) return null;

    const parsed: unknown = JSON.parse(new TextDecoder().decode(rawBytes));
    if (typeof parsed !== "object" || parsed === null || !("o" in parsed) || !("s" in parsed)) {
      return null;
    }
    const { o, s } = parsed as { o: unknown; s: unknown };
    if ((o !== "offer" && o !== "answer") || typeof s !== "string" || s.length > MAX_SDP_LENGTH) {
      return null;
    }
    return { type: o, sdp: s };
  } catch {
    return null;
  }
}
