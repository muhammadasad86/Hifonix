import { CatmullRomCurve3, Vector3 } from 'three';
import { ROUTES } from '../config/navigation';

/**
 * The homepage journey — one continuous camera path through four connected
 * rooms. Scroll progress p ∈ [0, 1] drives the camera; repeated keys create
 * "holds" where the view settles while the visitor reads.
 *
 * Plan (z runs forward/negative, metres):
 *   splash wall + portal, horn pair ......... z -3.6
 *   I   antechamber (brand intro) ........... z -4   … -12
 *   II  Hi-Fi listening room ................ z -12.4 … -24.4  (system on the left wall)
 *   III headphone salon ..................... z -24.8 … -34.8  (niches on the right wall)
 *   IV  collections atelier ................. z -35.2 … -47.2
 */
export const ROOMS = {
  splashWall: { z: -3.6, depth: 0.4 },
  ante: { z0: -4, z1: -12, hw: 4, h: 5 },
  hifi: { z0: -12.4, z1: -24.4, hw: 5.5, h: 5 },
  salon: { z0: -24.8, z1: -34.8, hw: 3.6, h: 4.2 },
  atelier: { z0: -35.2, z1: -47.2, hw: 5, h: 5.6 },
  wall: 0.4,
  /** rectangular portals between rooms (camera passes at x≈0, y≈1.6) */
  portal: { w: 2.4, h: 3.0 },
  /** splash portal (camera flight passes at x≈0.5, y≈1.9) */
  splashPortal: { w: 2.6, h: 2.65 },
} as const;

type Key = { p: number; pos: [number, number, number]; look: [number, number, number] };

/** Splash pose (before Start Exploring) — framing the lattice oculus. */
export const SPLASH = {
  pos: new Vector3(0, 2.05, 1.6),
  look: new Vector3(0, 2.05, -3.6),
  fov: 42,
};
export const JOURNEY_FOV = 50;

export const KEYS: Key[] = [
  { p: 0.0, pos: [0, 1.75, -5.7], look: [0, 1.95, -12] }, // I  intro, settled
  { p: 0.08, pos: [0, 1.74, -6.6], look: [0, 1.9, -13] },
  { p: 0.16, pos: [0, 1.68, -11.4], look: [-0.6, 1.6, -18] }, // through arch I→II
  { p: 0.24, pos: [1.7, 1.52, -17.3], look: [-5.5, 1.15, -18.2] }, // II Hi-Fi settle
  { p: 0.36, pos: [1.45, 1.5, -18.1], look: [-5.5, 1.12, -18.4] },
  { p: 0.44, pos: [0, 1.6, -22.2], look: [0, 1.6, -28.5] },
  { p: 0.5, pos: [0, 1.58, -25.6], look: [1.6, 1.45, -29.6] }, // through arch II→III
  { p: 0.56, pos: [-1.15, 1.46, -29.3], look: [3.6, 1.32, -29.6] }, // III headphones settle
  { p: 0.68, pos: [-1.0, 1.45, -30.1], look: [3.6, 1.3, -30.3] },
  { p: 0.75, pos: [0, 1.6, -33.4], look: [0, 1.6, -40] },
  { p: 0.81, pos: [0, 1.66, -36.4], look: [0, 1.5, -45] }, // through arch III→IV
  { p: 0.88, pos: [0, 1.62, -39.2], look: [0, 1.3, -47.2] }, // IV collections settle
  { p: 1.0, pos: [0, 1.6, -39.8], look: [0, 1.28, -47.2] },
];

const posCurve = new CatmullRomCurve3(KEYS.map((k) => new Vector3(...k.pos)), false, 'centripetal');
const lookCurve = new CatmullRomCurve3(KEYS.map((k) => new Vector3(...k.look)), false, 'centripetal');
const smooth = (t: number) => t * t * (3 - 2 * t);

/** Camera pose for progress p. Each key-to-key segment eases in/out → natural settles. */
export function poseAt(p: number, outPos: Vector3, outLook: Vector3) {
  const n = KEYS.length - 1;
  let i = 0;
  while (i < n - 1 && p > KEYS[i + 1].p) i++;
  const a = KEYS[i].p;
  const b = KEYS[i + 1].p;
  const u = smooth(Math.min(1, Math.max(0, (p - a) / (b - a))));
  const t = (i + u) / n;
  posCurve.getPoint(t, outPos);
  lookCurve.getPoint(t, outLook);
}

/** Chapters: drive the bottom navigator, stage copy windows and CTAs. */
export interface Chapter {
  id: string;
  index: string;
  label: string;
  /** progress where the chapter's view is settled (navigator jumps here) */
  at: number;
  /** copy fully visible between [in, out] (fades over FADE either side) */
  in: number;
  out: number;
}

export const FADE = 0.035;

export const CHAPTERS: Chapter[] = [
  { id: 'intro', index: '00', label: 'Hifonix', at: 0, in: -1, out: 0.075 },
  { id: 'hi-fi', index: '01', label: 'Hi-Fi', at: 0.3, in: 0.255, out: 0.385 },
  { id: 'headphones', index: '02', label: 'Headphones', at: 0.62, in: 0.575, out: 0.69 },
  { id: 'collections', index: '03', label: 'Collections', at: 0.94, in: 0.885, out: 2 },
];

export const STAGE_ROUTES = {
  'hi-fi': ROUTES.hiFi,
  headphones: ROUTES.headphones,
  collections: ROUTES.collections,
} as const;

/** Scroll length of the journey in viewport heights (longer = slower travel). */
export const JOURNEY_VH = 9;

/**
 * Shared mutable runtime state (frame-rate updates without React renders).
 * The DOM loop writes `target`; it damps `current`, which the camera reads.
 */
export const journey = {
  started: false,
  /** 0→1 progress of the Start Exploring flight (splash → intro pose) */
  flight: 0,
  target: 0,
  current: 0,
  reducedMotion: false,
};
