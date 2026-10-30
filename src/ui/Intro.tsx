import { useEffect, useRef, useState } from 'react';
import { clamp01, easeInOutCubic, easeInOutSine } from '../lib/easing';
import { signAnchor } from '../state/signAnchor';
import { useExperience } from '../state/useExperience';
import { LOGO_ASPECT, LOGO_SRC } from './brand';
import './intro.css';

/**
 * Full-screen brand intro, once per page load:
 *   0. BOOT  — brand-ink veil only, until the 3D scene has compiled its first
 *              frame (so shader compilation can never stutter the reveal)
 *   1. ZOOM  — logo eases in at screen centre (gentle push from 86% → 100%),
 *              run on the compositor via the Web Animations API
 *   2. HOLD  — exactly 3 s at final size
 *   3. (waits here only if the 3D sign has not finished loading)
 *   4. FLY   — logo scales/moves onto the live screen position of the 3D
 *              storefront sign while the veil dissolves and the logo
 *              cross-fades into the real signage
 * Reduced motion: fade in, 3 s hold, cross-fade out — no movement.
 */
export const INTRO_TIMING = { zoom: 1600, hold: 3000, fly: 1900, rmIn: 500, rmOut: 900 } as const;

type Stage = 'boot' | 'zoom' | 'hold' | 'wait' | 'fly';
const BOOT_MAX_MS = 4000;

function centreRect() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const w = Math.min(vw * (vw < 720 ? 0.78 : 0.56), 600);
  const h = w / LOGO_ASPECT;
  return { left: (vw - w) / 2, top: (vh - h) / 2, width: w, height: h };
}

export function Intro() {
  const finishIntro = useExperience((s) => s.finishIntro);
  const reducedMotion = useExperience((s) => s.reducedMotion);
  const [gone, setGone] = useState(false);
  const logo = useRef<HTMLImageElement>(null);
  const veil = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = logo.current;
    const bg = veil.current;
    if (!el || !bg) return;
    let raf = 0;
    let stage: Stage = 'boot';
    let t0 = performance.now();
    let readyFrames = 0;
    let zoomAnim: Animation | null = null;
    const rm = reducedMotion;
    const zoomMs = rm ? INTRO_TIMING.rmIn : INTRO_TIMING.zoom;
    const flyMs = rm ? INTRO_TIMING.rmOut : INTRO_TIMING.fly;

    const place = (left: number, top: number, width: number, opacity: number) => {
      const c = centreRect();
      const s = width / c.width;
      el.style.width = `${c.width}px`;
      el.style.left = `${c.left}px`;
      el.style.top = `${c.top}px`;
      el.style.transform = `translate3d(${left - c.left}px, ${top - c.top}px, 0) scale(${s})`;
      el.style.opacity = String(opacity);
    };

    const tick = (now: number) => {
      const c = centreRect();
      const dt = now - t0;
      if (stage === 'boot') {
        const ready = useExperience.getState().sceneReady && signAnchor.ready;
        readyFrames = ready ? readyFrames + 1 : 0;
        if (readyFrames >= 3 || dt > BOOT_MAX_MS) {
          stage = 'zoom';
          t0 = now;
          place(c.left, c.top, c.width, 1);
          el.style.opacity = '0';
          el.style.transformOrigin = '50% 50%'; // zoom from the logo's centre
          const from = rm ? 1 : 0.86;
          zoomAnim = el.animate(
            [
              { opacity: 0, scale: String(from) },
              { opacity: 1, scale: '1' },
            ],
            { duration: zoomMs, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' },
          );
          zoomAnim.onfinish = () => {
            el.style.opacity = '1';
            el.style.transformOrigin = '0 0'; // fly maths uses top-left origin
            zoomAnim?.cancel();
            zoomAnim = null;
            stage = 'hold';
            t0 = performance.now();
          };
        }
      } else if (stage === 'zoom') {
        // compositor-driven; keep the base rect centred if the viewport changes
        place(c.left, c.top, c.width, 0);
      } else if (stage === 'hold') {
        place(c.left, c.top, c.width, 1);
        if (dt >= INTRO_TIMING.hold) {
          stage = 'wait';
          t0 = now;
        }
      }
      if (stage === 'wait') {
        place(c.left, c.top, c.width, 1);
        const st = useExperience.getState();
        if (st.sceneReady && signAnchor.ready && signAnchor.width > 4) {
          stage = 'fly';
          t0 = now;
        }
      } else if (stage === 'fly') {
        const t = clamp01((now - t0) / flyMs);
        if (rm) {
          place(c.left, c.top, c.width, 1 - easeInOutSine(t));
          bg.style.opacity = String(1 - easeInOutSine(t));
        } else {
          const k = easeInOutCubic(t);
          const a = signAnchor; // live: tracks the camera's gentle drift
          const left = c.left + (a.left - c.left) * k;
          const top = c.top + (a.top - c.top) * k;
          const width = c.width + (a.width - c.width) * k;
          const fade = 1 - easeInOutSine(clamp01((t - 0.72) / 0.28));
          place(left, top, width, fade);
          bg.style.opacity = String(1 - easeInOutSine(clamp01((t - 0.12) / 0.76)));
        }
        if (t >= 1) {
          finishIntro();
          setGone(true);
          return;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      zoomAnim?.cancel();
    };
    // Runs once per mount; reduced-motion is read at start.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (gone) return null;
  return (
    <div className="intro-layer" aria-hidden="true">
      <div ref={veil} className="intro-veil" />
      <img ref={logo} className="intro-logo" src={LOGO_SRC} alt="" draggable={false} decoding="sync" />
      <p className="sr-only" role="status">
        Hifonix
      </p>
    </div>
  );
}
