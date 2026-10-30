/**
 * Ambient music engine.
 *
 * Source priority:
 *  1. A licensed track dropped at /public/audio/ambient.mp3 (looped, streamed
 *     through Web Audio so volume ramps are smooth).
 *  2. Otherwise a built-in generative pad: slow major-seventh voicings with
 *     soft attack, lowpass and a synthesised room reverb — royalty-free by
 *     construction, no network request that could fail.
 *
 * Browsers block audio until a user gesture: nothing is created until
 * `enable()` is called from a click/tap/key handler.
 */
type Listener = (on: boolean) => void;

const TARGET_GAIN = 0.16; // quiet, background level
const FADE_IN = 2.4; // s
const FADE_OUT = 0.35; // s — mute feels immediate without a click
const FILE = `${import.meta.env.BASE_URL}audio/ambient.mp3`;
const PREF_KEY = 'hifonix:sound';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let playing = false;
let sourceKind: 'file' | 'synth' | null = null;
let padTimer = 0;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l(playing));
}

export function onSoundChange(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const isPlaying = () => playing;
export const soundSource = () => sourceKind;

/** The visitor explicitly muted on a previous visit? (respected on Start Exploring) */
export function prefersMuted(): boolean {
  try {
    return localStorage.getItem(PREF_KEY) === 'off';
  } catch {
    return false;
  }
}
function savePref(on: boolean) {
  try {
    localStorage.setItem(PREF_KEY, on ? 'on' : 'off');
  } catch {
    /* storage unavailable — fine */
  }
}

function makeReverb(c: AudioContext) {
  const len = c.sampleRate * 4.5;
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
  }
  const conv = c.createConvolver();
  conv.buffer = buf;
  return conv;
}

async function tryFile(c: AudioContext, out: AudioNode): Promise<boolean> {
  try {
    const head = await fetch(FILE, { method: 'HEAD' });
    const type = head.headers.get('content-type') ?? '';
    if (!head.ok || !type.startsWith('audio')) return false;
    const el = new Audio(FILE);
    el.loop = true;
    el.crossOrigin = 'anonymous';
    c.createMediaElementSource(el).connect(out);
    await el.play();
    return true;
  } catch {
    return false;
  }
}

/** Generative pad: Dmaj9 → Bm11 → Gmaj9 → Aadd9, 9 s per chord, overlapping swells. */
function startSynth(c: AudioContext, out: AudioNode) {
  const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);
  const chords = [
    [50, 57, 61, 64, 66, 69],
    [47, 54, 57, 61, 64, 66],
    [43, 50, 54, 57, 59, 62],
    [45, 52, 57, 59, 61, 64],
  ];
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 1150;
  lp.Q.value = 0.4;
  const dry = c.createGain();
  dry.gain.value = 0.55;
  const wet = c.createGain();
  wet.gain.value = 0.75;
  const verb = makeReverb(c);
  lp.connect(dry).connect(out);
  lp.connect(verb).connect(wet).connect(out);
  // slow filter breathing
  const lfo = c.createOscillator();
  const lfoAmt = c.createGain();
  lfo.frequency.value = 0.045;
  lfoAmt.gain.value = 320;
  lfo.connect(lfoAmt).connect(lp.frequency);
  lfo.start();

  const DUR = 9;
  let i = 0;
  const play = () => {
    if (c.state !== 'running') return; // muted → context suspended; don't stack voices
    const now = c.currentTime;
    chords[i % chords.length].forEach((m, v) => {
      for (const detune of [-5, 6]) {
        const o = c.createOscillator();
        o.type = v === 0 ? 'sine' : 'triangle';
        o.frequency.value = hz(m);
        o.detune.value = detune;
        const g = c.createGain();
        const peak = (v === 0 ? 0.11 : 0.05) / 2;
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(peak, now + 3.5);
        g.gain.setValueAtTime(peak, now + DUR - 1);
        g.gain.linearRampToValueAtTime(0, now + DUR + 4.5);
        o.connect(g).connect(lp);
        o.start(now);
        o.stop(now + DUR + 5);
      }
    });
    i++;
  };
  play();
  padTimer = window.setInterval(play, DUR * 1000);
}

async function ensureGraph() {
  if (ctx) return;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  if (await tryFile(ctx, master)) sourceKind = 'file';
  else {
    startSynth(ctx, master);
    sourceKind = 'synth';
  }
}

/** Turn sound on. Must be called from a user gesture the first time. */
export async function enable() {
  playing = true;
  emit();
  savePref(true);
  await ensureGraph();
  if (!ctx || !master || !playing) return;
  if (ctx.state === 'suspended') await ctx.resume();
  const t = ctx.currentTime;
  master.gain.cancelScheduledValues(t);
  master.gain.setValueAtTime(master.gain.value, t);
  master.gain.linearRampToValueAtTime(TARGET_GAIN, t + FADE_IN);
}

/** Turn sound off — fades in ~0.35 s, then suspends the context (no CPU use). */
export function disable() {
  playing = false;
  emit();
  savePref(false);
  if (!ctx || !master) return;
  const t = ctx.currentTime;
  master.gain.cancelScheduledValues(t);
  master.gain.setValueAtTime(master.gain.value, t);
  master.gain.linearRampToValueAtTime(0, t + FADE_OUT);
  const c = ctx;
  window.setTimeout(() => {
    if (!playing) void c.suspend();
  }, FADE_OUT * 1000 + 80);
}

export function toggle() {
  return playing ? disable() : enable();
}

/** Stop and release everything (route change). */
export function teardown() {
  window.clearInterval(padTimer);
  void ctx?.close();
  ctx = null;
  master = null;
  playing = false;
  sourceKind = null;
  emit();
}
