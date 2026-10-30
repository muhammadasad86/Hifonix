import { type RefObject, useEffect, useRef } from 'react';
import { useScrollRootEl } from '../../ui/chrome/scroll';

/**
 * Shared plumbing for the pinned desktop scroll stories (Hi-Fi + Headphones
 * landing pages): one tall track, one sticky stage, one timeline in screens.
 */

/** Track geometry, cached (re-measured on resize / content changes) — no layout reads in the scroll path. */
export function useStoryGeometry(track: RefObject<HTMLElement>) {
  const root = useScrollRootEl();
  const geo = useRef({ top: 0, vh: 1 });
  useEffect(() => {
    const t = track.current;
    const r = root?.current;
    if (!t || !r) return;
    const measure = () => {
      geo.current = {
        top: t.getBoundingClientRect().top - r.getBoundingClientRect().top + r.scrollTop,
        vh: r.clientHeight,
      };
      r.dispatchEvent(new Event('scroll'));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(t);
    const main = r.querySelector('main');
    if (main) ro.observe(main);
    window.addEventListener('resize', measure);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [root, track]);
  return geo;
}

/**
 * Decode every stage image up front (off the main thread), so a scene that
 * becomes visible mid-scroll never stalls a frame on image decoding.
 */
export function useDecodeImages(stage: RefObject<HTMLElement>) {
  useEffect(() => {
    stage.current?.querySelectorAll('img').forEach((img) => {
      img.decode?.().catch(() => {});
    });
  }, [stage]);
}

/** Toggles a stacked scene's visibility (only touches the DOM when it changes). */
export function show(stage: HTMLElement, sel: string, on: boolean) {
  const el = stage.querySelector<HTMLElement>(sel);
  if (!el) return;
  const v = on ? '' : 'hidden';
  if (el.style.visibility !== v) el.style.visibility = v;
}
