import { describe, expect, it } from "vitest";
import { decodeSignal, encodeSignal } from "./signaling";

const SAMPLE_SDP =
  "v=0\r\no=- 46117 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\nm=application 9 UDP/DTLS/SCTP webrtc-datachannel\r\n";

describe("signaling codec", () => {
  it("round-trips an offer through encode/decode", async () => {
    const code = await encodeSignal({ type: "offer", sdp: SAMPLE_SDP });
    expect(code.startsWith("W1")).toBe(true);
    const decoded = await decodeSignal(code);
    expect(decoded).toEqual({ type: "offer", sdp: SAMPLE_SDP });
  });

  it("round-trips an answer", async () => {
    const code = await encodeSignal({ type: "answer", sdp: SAMPLE_SDP });
    const decoded = await decodeSignal(code);
    expect(decoded).toEqual({ type: "answer", sdp: SAMPLE_SDP });
  });

  it("refuses to encode an incomplete description", async () => {
    await expect(encodeSignal({ type: "offer" })).rejects.toThrow();
  });

  it("returns null for codes without the expected prefix", async () => {
    expect(await decodeSignal("not-a-code")).toBeNull();
    expect(await decodeSignal("")).toBeNull();
  });

  it("returns null for a corrupt payload", async () => {
    expect(await decodeSignal("W1p@@@not-base64@@@")).toBeNull();
  });
});
