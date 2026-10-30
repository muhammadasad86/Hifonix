import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../../ui/chrome/scroll';

/**
 * Real model (glTF binary). When the client supplies one, place it at
 * public/models/headphone.glb and set this to '/models/headphone.glb' — it
 * replaces the procedural stand-in with no other change.
 */
const MODEL_URL: string | null = null;

type Mode = 'poster' | 'model';

/**
 * 360° headphone viewer (Elevate section).
 *
 * Shows the Figma photograph at rest. Dragging (mouse or touch) hands over to
 * a live 3D model the user can turn through a full 360°, with inertia. Three.js
 * is loaded on first approach, so it never weighs on the initial page load.
 * Vertical swipes still scroll the page on touch (touch-action: pan-y).
 */
export function Headphone360({ poster, alt }: { poster: string; alt: string }) {
  const host = useRef<HTMLDivElement>(null);
  const canvasHost = useRef<HTMLDivElement>(null);
  const api = useRef<{ start: (x: number) => void; move: (x: number, y: number) => void; end: () => void; dispose: () => void } | null>(null);
  const [mode, setMode] = useState<Mode>('poster');
  const [ready, setReady] = useState(false);
  const [hint, setHint] = useState(true);
  const reduced = useReducedMotion();

  // load three.js + build the scene when the viewer nears the viewport
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        import('./headphoneScene')
          .then(({ createHeadphoneScene }) => createHeadphoneScene(canvasHost.current!, MODEL_URL, { reduced }))
          .then((s) => {
            if (disposed) return s.dispose();
            api.current = s;
            setReady(true);
          })
          .catch(() => {
            /* no WebGL: the photograph stays */
          });
      },
      { rootMargin: '400px 0px' },
    );
    io.observe(el);
    return () => {
      disposed = true;
      io.disconnect();
      api.current?.dispose();
      api.current = null;
    };
  }, [reduced]);

  // pointer drag → rotate
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let down = false;
    let sx = 0;
    let sy = 0;
    let axis: 'x' | 'y' | null = null;
    const onDown = (e: PointerEvent) => {
      if (!api.current) return;
      down = true;
      axis = e.pointerType === 'mouse' ? 'x' : null;
      sx = e.clientX;
      sy = e.clientY;
      api.current.start(e.clientX);
      if (axis) {
        el.setPointerCapture(e.pointerId);
        setMode('model');
        setHint(false);
      }
    };
    const onMove = (e: PointerEvent) => {
      if (!down || !api.current) return;
      if (!axis) {
        // touch: decide between rotating (horizontal) and scrolling (vertical)
        const dx = Math.abs(e.clientX - sx);
        const dy = Math.abs(e.clientY - sy);
        if (dx < 6 && dy < 6) return;
        axis = dx > dy ? 'x' : 'y';
        if (axis === 'y') {
          down = false;
          return;
        }
        el.setPointerCapture(e.pointerId);
        setMode('model');
        setHint(false);
      }
      api.current.move(e.clientX, e.clientY);
    };
    const onUp = () => {
      if (!down) return;
      down = false;
      api.current?.end();
    };
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
    };
  }, []);

  return (
    <div
      ref={host}
      className="hf-360"
      data-mode={mode}
      data-ready={ready || undefined}
      role="img"
      aria-label={`${alt} — drag to rotate 360°`}
    >
      <div ref={canvasHost} className="hf-360__canvas" aria-hidden="true" />
      <img className="hf-360__poster" src={poster} alt="" loading="lazy" draggable={false} />
      <span className="hf-360__hint" data-show={(ready && hint) || undefined} aria-hidden="true">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path d="M4 12a8 3.2 0 1 0 16 0" />
          <path d="M17.5 14.3 20 12l-2.6-1.9" />
          <circle cx="12" cy="8" r="1.2" fill="currentColor" stroke="none" />
        </svg>
        Drag to rotate 360°
      </span>
    </div>
  );
}
