/**
 * A single WebRTC data-channel connection between two devices.
 *
 * There is no signaling or TURN server. ICE gathering is non-trickle: we wait
 * for candidates to settle (bounded by a timeout) and fold them into one SDP so
 * the entire handshake fits in a single copy-pasteable code. STUN-only means
 * connections work on most home/office networks but may fail across symmetric
 * NATs — the UI surfaces that as a failed connection.
 */

import { appConfig } from "../config/appConfig";
import { MAX_MESSAGE_BYTES } from "./protocol";
import { decodeSignal, encodeSignal } from "./signaling";

export type PeerStatus = "new" | "connecting" | "connected" | "disconnected" | "failed" | "closed";

interface PeerLinkHandlers {
  onStatus?: (status: PeerStatus) => void;
  onData?: (message: string) => void;
}

const ICE_GATHER_TIMEOUT_MS = 4000;
const CHANNEL_LABEL = "wordlock";

function iceServers(): RTCIceServer[] {
  return appConfig.stunServers.map((url) => ({ urls: url }));
}

export class PeerLink {
  readonly id: string;
  private pc: RTCPeerConnection;
  private channel: RTCDataChannel | null = null;
  private handlers: PeerLinkHandlers;
  private status: PeerStatus = "new";

  constructor(id: string, handlers: PeerLinkHandlers = {}) {
    this.id = id;
    this.handlers = handlers;
    this.pc = new RTCPeerConnection({ iceServers: iceServers() });
    this.pc.onconnectionstatechange = () => this.onConnectionStateChange();
  }

  getStatus(): PeerStatus {
    return this.status;
  }

  /** Replace the event handlers — used when a session takes ownership post-handshake. */
  setHandlers(handlers: PeerLinkHandlers): void {
    this.handlers = handlers;
  }

  /** Offerer side: create the data channel and return an offer code. */
  async createOffer(): Promise<string> {
    this.setStatus("connecting");
    const channel = this.pc.createDataChannel(CHANNEL_LABEL, { ordered: true });
    this.attachChannel(channel);
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    await this.waitForIceGathering();
    return encodeSignal(this.localDescription());
  }

  /** Answerer side: consume an offer code and return an answer code. */
  async acceptOffer(code: string): Promise<string> {
    this.setStatus("connecting");
    const remote = await decodeSignal(code);
    if (!remote || remote.type !== "offer") throw new Error("That is not a valid offer code.");
    this.pc.ondatachannel = (event) => this.attachChannel(event.channel);
    await this.pc.setRemoteDescription(remote);
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    await this.waitForIceGathering();
    return encodeSignal(this.localDescription());
  }

  /** Offerer side: consume the answer code to complete the handshake. */
  async acceptAnswer(code: string): Promise<void> {
    const remote = await decodeSignal(code);
    if (!remote || remote.type !== "answer") throw new Error("That is not a valid answer code.");
    await this.pc.setRemoteDescription(remote);
  }

  send(message: string): boolean {
    if (!this.channel || this.channel.readyState !== "open") return false;
    if (message.length > MAX_MESSAGE_BYTES) return false;
    try {
      this.channel.send(message);
      return true;
    } catch {
      return false;
    }
  }

  close(): void {
    if (this.status === "closed") return;
    try {
      this.channel?.close();
    } catch {
      /* already gone */
    }
    try {
      this.pc.close();
    } catch {
      /* already gone */
    }
    this.setStatus("closed");
  }

  private localDescription(): RTCSessionDescriptionInit {
    const desc = this.pc.localDescription;
    if (!desc) throw new Error("No local description available.");
    return { type: desc.type, sdp: desc.sdp };
  }

  private attachChannel(channel: RTCDataChannel): void {
    this.channel = channel;
    channel.onopen = () => this.setStatus("connected");
    channel.onclose = () => {
      if (this.status !== "closed") this.setStatus("disconnected");
    };
    channel.onmessage = (event) => {
      if (typeof event.data !== "string") return; // binary frames are not part of the protocol
      if (event.data.length > MAX_MESSAGE_BYTES) return;
      this.handlers.onData?.(event.data);
    };
  }

  private onConnectionStateChange(): void {
    switch (this.pc.connectionState) {
      case "connected":
        this.setStatus("connected");
        break;
      case "disconnected":
        this.setStatus("disconnected");
        break;
      case "failed":
        this.setStatus("failed");
        break;
      case "closed":
        this.setStatus("closed");
        break;
      default:
        break;
    }
  }

  private setStatus(status: PeerStatus): void {
    if (this.status === status || this.status === "closed") return;
    this.status = status;
    this.handlers.onStatus?.(status);
  }

  /** Resolve once ICE gathering completes, or after a timeout with whatever we have. */
  private waitForIceGathering(): Promise<void> {
    if (this.pc.iceGatheringState === "complete") return Promise.resolve();
    return new Promise((resolve) => {
      const done = () => {
        this.pc.removeEventListener("icegatheringstatechange", onChange);
        clearTimeout(timer);
        resolve();
      };
      const onChange = () => {
        if (this.pc.iceGatheringState === "complete") done();
      };
      const timer = setTimeout(done, ICE_GATHER_TIMEOUT_MS);
      this.pc.addEventListener("icegatheringstatechange", onChange);
    });
  }
}
