import { useCallback } from "react";

export type SoundName = "tap" | "correct" | "skip" | "penalty" | "warning" | "end";

type Tone = { freq: number; dur: number; type: OscillatorType; gain?: number };

/**
 * Short synthesised cues, played in sequence. No audio files are shipped and
 * nothing plays on load — the {@link AudioContext} is created lazily the first
 * time a sound is triggered, which only happens inside a user gesture.
 */
const TONES: Record<SoundName, Tone[]> = {
  tap: [{ freq: 440, dur: 0.05, type: "sine" }],
  correct: [
    { freq: 660, dur: 0.09, type: "sine" },
    { freq: 990, dur: 0.12, type: "sine" },
  ],
  skip: [{ freq: 380, dur: 0.12, type: "triangle" }],
  penalty: [
    { freq: 200, dur: 0.16, type: "sawtooth", gain: 0.12 },
    { freq: 150, dur: 0.2, type: "sawtooth", gain: 0.12 },
  ],
  warning: [
    { freq: 880, dur: 0.08, type: "square", gain: 0.08 },
    { freq: 880, dur: 0.08, type: "square", gain: 0.08 },
  ],
  end: [
    { freq: 660, dur: 0.12, type: "sine" },
    { freq: 520, dur: 0.12, type: "sine" },
    { freq: 392, dur: 0.24, type: "sine" },
  ],
};

type WindowWithAudio = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const w = window as WindowWithAudio;
  const Ctor = window.AudioContext ?? w.webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) {
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
  }
  return ctx;
}

/** Play a named cue as a small envelope-shaped tone sequence. */
function play(name: SoundName): void {
  const audio = getContext();
  if (!audio) return;
  // Resume if the browser suspended the context (autoplay policy, backgrounding).
  if (audio.state === "suspended") void audio.resume();

  let at = audio.currentTime;
  for (const tone of TONES[name]) {
    const osc = audio.createOscillator();
    const env = audio.createGain();
    const peak = tone.gain ?? 0.1;
    osc.type = tone.type;
    osc.frequency.setValueAtTime(tone.freq, at);
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(peak, at + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, at + tone.dur);
    osc.connect(env);
    env.connect(audio.destination);
    osc.start(at);
    osc.stop(at + tone.dur + 0.02);
    at += tone.dur;
  }
}

/** Sound feedback, gated on the user preference and device support. */
export function useSound(enabled: boolean): (name: SoundName) => void {
  return useCallback(
    (name: SoundName) => {
      if (!enabled) return;
      try {
        play(name);
      } catch {
        // Audio can throw if the context is disallowed; ignore.
      }
    },
    [enabled],
  );
}
