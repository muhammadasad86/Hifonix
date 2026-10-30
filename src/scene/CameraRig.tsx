import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { CatmullRomCurve3, MathUtils, type PerspectiveCamera, Vector3 } from 'three';
import { entryPath, exteriorShot, INTERIOR_OVERVIEW, LOOK, TIMING, type Shot } from '../config/shots';
import { clamp01, damp, easeCinematic, easeInOutSine } from '../lib/easing';
import { useExperience } from '../state/useExperience';

type Anim =
  | {
      kind: 'path';
      pos: CatmullRomCurve3;
      tgt: CatmullRomCurve3;
      fov0: number;
      fov1: number;
      dur: number;
      t: number;
    }
  | { kind: 'cut'; to: Shot; dur: number; t: number; swapped: boolean };

const UP = new Vector3(0, 1, 0);

/**
 * Owns the camera. Holds framing for the two resting states (exterior,
 * interior overview), runs the entry/exit path, and layers a damped
 * pointer look-around on top of whatever the base framing is.
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  const phase = useExperience((s) => s.phase);
  const reducedMotion = useExperience((s) => s.reducedMotion);
  const finishTransition = useExperience((s) => s.finishTransition);

  const aspect = size.width / Math.max(1, size.height);
  const ext = useMemo(() => exteriorShot(aspect), [aspect]);

  const anim = useRef<Anim | null>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const look = useRef({ yaw: 0, pitch: 0 });
  const restShot = useRef<Shot>(ext);
  const v = useMemo(
    () => ({ pos: new Vector3(), tgt: new Vector3(), dir: new Vector3(), right: new Vector3() }),
    [],
  );

  // Pointer → normalised [-1, 1] look offsets.
  useEffect(() => {
    const move = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const reset = () => {
      pointer.current.x = 0;
      pointer.current.y = 0;
    };
    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerleave', reset);
    window.addEventListener('blur', reset);
    return () => {
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerleave', reset);
      window.removeEventListener('blur', reset);
    };
  }, []);

  // Start transitions on phase change.
  useEffect(() => {
    if (phase !== 'entering' && phase !== 'exiting') return;
    const to = phase === 'entering' ? INTERIOR_OVERVIEW : ext;
    if (reducedMotion) {
      anim.current = { kind: 'cut', to, dur: TIMING.reducedMotionCut * 2, t: 0, swapped: false };
      return;
    }
    const path = entryPath(ext);
    const positions = phase === 'entering' ? path.positions : [...path.positions].reverse();
    const targets = phase === 'entering' ? path.targets : [...path.targets].reverse();
    anim.current = {
      kind: 'path',
      pos: new CatmullRomCurve3(positions, false, 'centripetal'),
      tgt: new CatmullRomCurve3(targets, false, 'centripetal'),
      fov0: phase === 'entering' ? ext.fov : INTERIOR_OVERVIEW.fov,
      fov1: phase === 'entering' ? INTERIOR_OVERVIEW.fov : ext.fov,
      dur: phase === 'entering' ? TIMING.enter : TIMING.exit,
      t: 0,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Snap to the resting shot on mount / resize / settle.
  useEffect(() => {
    if (anim.current) return;
    restShot.current = phase === 'interior' ? INTERIOR_OVERVIEW : ext;
  }, [phase, ext]);

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20); // avoid jumps after tab switches
    const a = anim.current;
    let fov = restShot.current.fov;
    let lookScale = 1;

    if (a?.kind === 'path') {
      a.t = clamp01(a.t + dt / a.dur);
      const e = easeCinematic(a.t);
      a.pos.getPointAt(e, v.pos);
      a.tgt.getPointAt(e, v.tgt);
      fov = MathUtils.lerp(a.fov0, a.fov1, easeInOutSine(clamp01((a.t - 0.25) / 0.75)));
      lookScale = 0;
      if (a.t >= 1) {
        anim.current = null;
        restShot.current = phase === 'entering' ? INTERIOR_OVERVIEW : ext;
        finishTransition();
      }
    } else if (a?.kind === 'cut') {
      a.t = clamp01(a.t + dt / a.dur);
      const veil = document.getElementById('veil');
      if (veil) veil.style.opacity = String(1 - Math.abs(a.t * 2 - 1));
      if (!a.swapped && a.t >= 0.5) {
        restShot.current = a.to;
        a.swapped = true;
      }
      v.pos.copy(restShot.current.position);
      v.tgt.copy(restShot.current.target);
      fov = restShot.current.fov;
      lookScale = 0;
      if (a.t >= 1) {
        if (veil) veil.style.opacity = '0';
        anim.current = null;
        finishTransition();
      }
    } else {
      v.pos.copy(restShot.current.position);
      v.tgt.copy(restShot.current.target);
      // Barely-there handheld breathing on the establishing shot.
      if (phase === 'exterior' && !reducedMotion) {
        const t = clock.elapsedTime;
        v.pos.x += Math.sin(t * 0.13) * 0.06;
        v.pos.y += Math.sin(t * 0.19) * 0.015;
      }
    }

    // Look-around layer.
    const limits = phase === 'interior' ? LOOK.interior : LOOK.exterior;
    const allow = !(phase === 'exterior' && reducedMotion);
    const wantYaw = allow ? -pointer.current.x * limits.yaw * lookScale : 0;
    const wantPitch = allow ? -pointer.current.y * limits.pitch * lookScale : 0;
    const k = damp(LOOK.damping, dt);
    look.current.yaw += (wantYaw - look.current.yaw) * k;
    look.current.pitch += (wantPitch - look.current.pitch) * k;

    v.dir.subVectors(v.tgt, v.pos).applyAxisAngle(UP, look.current.yaw);
    v.right.crossVectors(v.dir, UP).normalize();
    v.dir.applyAxisAngle(v.right, look.current.pitch);

    camera.position.copy(v.pos);
    camera.lookAt(v.tgt.copy(v.pos).add(v.dir));
    if (Math.abs(camera.fov - fov) > 1e-3) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
