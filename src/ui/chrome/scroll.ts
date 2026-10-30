import { createContext, type RefObject, useContext, useEffect, useRef, useState, useSyncExternalStore } from 'react';

/**
 * Page scroll root. html/body are overflow:hidden for the WebGL homepage, so
 * content pages scroll inside their own element and share it via context.
 */
export const ScrollRoot = createContext<RefObject<HTMLElement | null> | null>(null);

/*
 * One scroll loop per scroll root: a single passive listener and a single
 * requestAnimationFrame per frame. scrollTop is read once per frame and the
 * viewport height is cached (ResizeObserver), so subscribers never force a
 * style/layout flush in the middle of another subscriber's style writes.
 */
type FrameFn = (y: number, el: HTMLElement, vh: number) => void;
interface Loop {
  subs: Set<{ current: FrameFn }>;
  vh: number;
  run: () => void;
  stop: () => void;
}
const loops = new WeakMap<HTMLElement, Loop>();

function getLoop(el: HTMLElement): Loop {
  let loop = loops.get(el);
  if (loop) return loop;
  let raf = 0;
  const subs = new Set<{ current: FrameFn }>();
  const frame = () => {
    raf = 0;
    const y = el.scrollTop;
    subs.forEach((s) => s.current(y, el, l.vh));
  };
  const on = () => {
    if (!raf) raf = requestAnimationFrame(frame);
  };
  const ro = new ResizeObserver(() => {
    l.vh = el.clientHeight;
    on();
  });
  const l: Loop = {
    subs,
    vh: el.clientHeight,
    run: on,
    stop: () => {
      el.removeEventListener('scroll', on);
      ro.disconnect();
      cancelAnimationFrame(raf);
      loops.delete(el);
    },
  };
  el.addEventListener('scroll', on, { passive: true });
  ro.observe(el);
  loops.set(el, l);
  loop = l;
  return loop;
}

/** Calls `fn(scrollTop, el, viewportHeight)` once per animation frame in which the page scrolled (and on mount / resize). */
export function useScrollFrame(fn: FrameFn) {
  const root = useContext(ScrollRoot);
  const cb = useRef(fn);
  cb.current = fn;
  useEffect(() => {
    const el = root?.current;
    if (!el) return;
    const loop = getLoop(el);
    loop.subs.add(cb);
    cb.current(el.scrollTop, el, loop.vh);
    return () => {
      loop.subs.delete(cb);
      if (!loop.subs.size) loop.stop();
    };
  }, [root]);
}

export function useScrollRootEl() {
  return useContext(ScrollRoot);
}

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (on) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', on);
      return () => mq.removeEventListener('change', on);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');

/**
 * Entrance reveal: marks the element `data-in` the first time it enters the
 * viewport. Styling lives in CSS (`[data-reveal]`), so reduced motion and
 * no-JS states are handled there.
 */
export function useReveal<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

/** Smoothly scrolls the page root to an element id (instant under reduced motion). */
export function scrollToId(root: HTMLElement | null | undefined, id: string, reduced: boolean) {
  const target = document.getElementById(id);
  if (!root || !target) return;
  let top = target.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop;
  // scenes inside the pinned desktop story declare their place on its timeline (screens)
  const story = target.closest<HTMLElement>('.hf-story');
  if (story && target.dataset.storyP) {
    top = story.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop + parseFloat(target.dataset.storyP) * root.clientHeight;
  }
  root.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
}

/* ---------------------------------------------------------------------------
 * Scroll-linked progress
 * ------------------------------------------------------------------------- */

export interface SectionProgress {
  /** 0 → 1 while the element's top travels from the viewport bottom to the viewport top */
  enter: number;
  /** 0 → 1 while the element's bottom travels from the viewport bottom to the viewport top */
  exit: number;
  /** 0 → 1 across the whole pass (top enters bottom … bottom leaves top) */
  through: number;
  vh: number;
}

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
/** Maps v from [a, b] to [0, 1], clamped. */
export const span = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Scroll-linked progress for an element inside the page scroll root.
 * Geometry is cached (re-measured on resize / content size changes), so the
 * per-frame work is pure arithmetic + the caller's style writes — no layout
 * reads in the scroll path. Progress follows the actual scroll position: when
 * scrolling stops, the animation stops where it is.
 * Reduced motion → fixed "settled" values (enter 1, exit 0).
 */
export function useScrollProgress<T extends HTMLElement>(fn: ((p: SectionProgress, el: T) => void) | null) {
  const ref = useRef<T>(null);
  const root = useContext(ScrollRoot);
  const reduced = useReducedMotion();
  const geo = useRef<{ top: number; height: number } | null>(null);
  const cb = useRef(fn);
  cb.current = fn;

  useEffect(() => {
    const el = ref.current;
    const r = root?.current;
    if (!el || !r) return;
    const measure = () => {
      const rr = r.getBoundingClientRect();
      const er = el.getBoundingClientRect();
      geo.current = { top: er.top - rr.top + r.scrollTop, height: er.height };
      r.dispatchEvent(new Event('scroll')); // re-run frames with fresh geometry
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const main = r.querySelector('main');
    if (main) ro.observe(main);
    window.addEventListener('resize', measure);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [root]);

  useScrollFrame((y, _r, vh) => {
    const el = ref.current;
    const g = geo.current;
    if (!el || !g || !cb.current) return; // null → driven by a parent timeline (see hifi/Story)
    if (reduced) {
      cb.current({ enter: 1, exit: 0, through: 0.5, vh }, el);
      return;
    }
    cb.current(
      {
        enter: clamp01((y + vh - g.top) / vh),
        exit: clamp01((y + vh - (g.top + g.height)) / vh),
        through: clamp01((y + vh - g.top) / (g.height + vh)),
        vh,
      },
      el,
    );
  });
  return ref;
}

const written = new WeakMap<HTMLElement, Record<string, string>>();

/**
 * Writes numeric CSS custom properties (4 dp) on an element — only the ones
 * whose value changed, so settled phases cost no style recalculation.
 */
export function setVars(el: HTMLElement | null | undefined, vars: Record<string, number>) {
  if (!el) return;
  let last = written.get(el);
  if (!last) written.set(el, (last = {}));
  for (const k in vars) {
    const v = vars[k].toFixed(4);
    if (last[k] === v) continue;
    last[k] = v;
    el.style.setProperty(k, v);
  }
}

/* ---------------------------------------------------------------------------
 * Smooth mouse-wheel scrolling
 * ------------------------------------------------------------------------- */

/**
 * A notched mouse wheel scrolls in coarse ~100px jumps, which makes the
 * scroll-scrubbed animations step instead of glide. For those wheels only, the
 * jump is eased over ~¼ s (exponential approach, same feel as Chrome's native
 * smooth scrolling on Windows). Trackpads, touch, keyboard and scrollbar drags
 * keep the browser's native scrolling untouched. Off under reduced motion.
 */
export function useSmoothWheel(root: RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    const el = root.current;
    if (!el || !enabled) return;
    const TAU = 85; // ms — time constant of the ease (≈ 95 % settled after 255 ms)
    let raf = 0;
    let target = 0;
    let pos = 0;
    let last = 0;
    let set = -1; // last scrollTop written by us

    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      set = -1;
    };
    const tick = (t: number) => {
      const dt = Math.min(64, t - last);
      last = t;
      pos += (target - pos) * (1 - Math.exp(-dt / TAU));
      if (Math.abs(target - pos) < 0.5) pos = target;
      el.scrollTop = pos;
      set = el.scrollTop;
      if (pos === target) {
        stop();
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const isNotchedWheel = (e: WheelEvent) => {
      if (e.deltaMode !== 0) return true; // Firefox: lines / pages
      const legacy = (e as WheelEvent & { wheelDeltaY?: number }).wheelDeltaY;
      // trackpads report wheelDeltaY === -3 · deltaY (Chrome, Safari); notched wheels report multiples of 120
      return !!legacy && legacy % 120 === 0 && Math.abs(legacy) !== Math.abs(e.deltaY * 3);
    };
    const scrollsItself = (node: EventTarget | null) => {
      for (let n = node as HTMLElement | null; n && n !== el; n = n.parentElement) {
        if (n.scrollHeight > n.clientHeight) {
          const o = getComputedStyle(n).overflowY;
          if (o === 'auto' || o === 'scroll') return true;
        }
      }
      return false;
    };

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.defaultPrevented || el.dataset.locked === 'true') return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || !isNotchedWheel(e) || scrollsItself(e.target)) {
        if (raf) stop(); // hand straight back to native scrolling
        return;
      }
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? el.clientHeight : 1;
      const max = el.scrollHeight - el.clientHeight;
      if (!raf) {
        pos = target = el.scrollTop;
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
      target = Math.max(0, Math.min(max, target + e.deltaY * unit));
    };
    // anything else moved the page (scrollbar, keys, scrollTo, anchor) → give way
    const onScroll = () => {
      if (raf && set >= 0 && Math.abs(el.scrollTop - set) > 2) stop();
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      stop();
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('scroll', onScroll);
    };
  }, [root, enabled]);
}
