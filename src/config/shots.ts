import { Vector3 } from 'three';
import { DERIVED, WORLD } from './world';

/**
 * Camera shots and the entry path. All timings in seconds.
 */
export const TIMING = {
  enter: 4.6,
  exit: 3.6,
  doorOpen: 1.5,
  doorOpenDelay: 0.15,
  reducedMotionCut: 0.45, // fade-out + fade-in half duration
} as const;

export const EYE = 1.62;

export interface Shot {
  position: Vector3;
  target: Vector3;
  fov: number;
}

/**
 * Exterior establishing shot, adapted to viewport aspect so the shopfront
 * stays composed on wide desktop through portrait mobile.
 */
export function exteriorShot(aspect: number): Shot {
  // Horizontal span we want in frame (m) and the vertical FOV for that layout.
  const portrait = aspect < 0.9;
  const span = portrait ? 6.4 : aspect < 1.4 ? 9.5 : 12.5;
  const fov = portrait ? 46 : aspect < 1.4 ? 40 : 34;
  const halfV = (fov * Math.PI) / 360;
  const distance = Math.max(9, span / 2 / (Math.tan(halfV) * aspect));
  return {
    position: new Vector3(0, EYE, distance),
    target: new Vector3(0, portrait ? 2.75 : 2.7, 0),
    fov,
  };
}

export const INTERIOR_OVERVIEW: Shot = {
  position: new Vector3(0, EYE, -3.3),
  target: new Vector3(0, 1.38, -WORLD.interior.depth),
  fov: 52,
};

/**
 * Entry path: control points after the (aspect-dependent) start point.
 * The camera passes the glazing line, the lobby recess and the door plane
 * on the room's centre-line — no cuts, no fades.
 */
export function entryPath(start: Shot) {
  const doorZ = DERIVED.doorZ;
  const positions = [
    start.position.clone(),
    new Vector3(0, EYE, Math.min(start.position.z * 0.42, 4.2)),
    new Vector3(0, EYE - 0.02, 0.45),
    new Vector3(0, EYE - 0.02, doorZ - 0.9),
    INTERIOR_OVERVIEW.position.clone(),
  ];
  const targets = [
    start.target.clone(),
    new Vector3(0, 1.9, doorZ),
    new Vector3(0, 1.55, doorZ - 3),
    new Vector3(0, 1.45, -8),
    INTERIOR_OVERVIEW.target.clone(),
  ];
  return { positions, targets };
}

/** Pointer look-around limits (radians) per state. */
export const LOOK = {
  exterior: { yaw: 0.035, pitch: 0.02 },
  interior: { yaw: 0.32, pitch: 0.1 },
  damping: 3.2,
} as const;
