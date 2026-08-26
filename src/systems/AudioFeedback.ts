export type FeedbackSound =
  | "shot"
  | "wall"
  | "bumper"
  | "sand"
  | "ice"
  | "portal"
  | "jump"
  | "land"
  | "void"
  | "trap"
  | "lip"
  | "hole"
  | "star";

type WebkitWindow = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };
type VibratingNavigator = Navigator & { vibrate?: (pattern: number | number[]) => boolean };

let context: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (context) return context;
  const Ctor = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
  if (!Ctor) return null;
  try { context = new Ctor(); return context; }
  catch { return null; }
}

function tone(freq: number, duration: number, volume: number, type: OscillatorType = "sine", endFreq?: number): void {
  const ctx = audioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (endFreq !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
  gain.gain.setValueAtTime(Math.max(0.0001, volume), now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

function noise(duration: number, volume: number, highpass = 600): void {
  const ctx = audioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();
  const frames = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  filter.type = "highpass";
  filter.frequency.value = highpass;
  gain.gain.value = volume;
  source.buffer = buffer;
  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start();
}

function vibrate(pattern: number | number[]): void {
  try { (navigator as VibratingNavigator).vibrate?.(pattern); } catch { /* optional */ }
}

export const AudioFeedback = {
  unlock(): void { audioContext(); },

  play(sound: FeedbackSound, intensity = 1): void {
    const k = Math.max(0.35, Math.min(1.25, intensity));
    switch (sound) {
      case "shot":
        tone(150, .075, .055 * k, "triangle", 82); noise(.035, .018 * k, 900); vibrate(9); break;
      case "wall":
        tone(190, .055, .035 * k, "square", 125); vibrate(7); break;
      case "bumper":
        tone(380, .11, .055 * k, "sine", 720); vibrate(12); break;
      case "sand":
        noise(.10, .020, 180); break;
      case "ice":
        tone(980, .11, .018, "sine", 1250); break;
      case "portal":
        tone(330, .18, .035, "sine", 780); setTimeout(() => tone(760, .13, .025, "sine", 420), 55); vibrate([8, 18, 8]); break;
      case "jump":
        tone(240, .13, .035, "triangle", 610); vibrate(8); break;
      case "land":
        tone(115, .07, .025, "triangle", 70); break;
      case "void":
        tone(180, .26, .035, "sawtooth", 45); noise(.12, .022, 300); vibrate([18, 25, 18]); break;
      case "trap":
        tone(115, .08, .055, "square", 78); setTimeout(() => tone(220, .08, .035, "square", 150), 45); vibrate(18); break;
      case "lip":
        tone(510, .055, .035, "triangle", 390); vibrate(6); break;
      case "hole":
        tone(420, .16, .045, "sine", 650); setTimeout(() => tone(660, .22, .04, "sine", 880), 80); vibrate([12, 25, 20]); break;
      case "star":
        tone(660, .12, .035, "sine", 800); setTimeout(() => tone(880, .16, .035, "sine", 1040), 70); break;
    }
  }
};
