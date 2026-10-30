import { type CSSProperties, type PointerEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import { Link } from '../../router';
import { scrollToId, useReducedMotion, useScrollRootEl } from '../../ui/chrome/scroll';

/**
 * Shop hero — Figma image 563 / 571 (1920 × 750): photograph with the black →
 * clear gradient, script or serif title, intro copy, and the "Scroll to view
 * products" cue. Entrance: photo settles from a slight zoom, copy rises in.
 */
export function ShopHero({
  image,
  title,
  logo,
  children,
  target,
  variant = 'script',
  cue = 'Scroll to view products',
}: {
  image: { url: string; alt: string };
  title?: string;
  logo?: string;
  children?: ReactNode;
  /** id scrolled to by the cue */
  target: string;
  variant?: 'script' | 'serif';
  /** label of the scroll cue */
  cue?: string;
}) {
  const root = useScrollRootEl();
  const reduced = useReducedMotion();
  const [inView, setIn] = useState(false);
  useEffect(() => {
    const r = requestAnimationFrame(() => setIn(true));
    return () => cancelAnimationFrame(r);
  }, []);
  return (
    <section className={`hs-hero hs-hero--${variant}`} data-in={inView || undefined}>
      <div className="hs-hero__media">
        <img src={image.url} alt={image.alt} fetchPriority="high" decoding="async" />
      </div>
      <div className="hs-hero__copy">
        {logo && <span className="hs-hero__logo" role="img" aria-label={title} style={{ '--logo': `url(${logo})` } as CSSProperties} />}
        {title && !logo && <h1 className="hs-hero__title">{title}</h1>}
        {title && logo && <h1 className="sr-only">{title}</h1>}
        {children && <div className="hs-hero__body">{children}</div>}
      </div>
      <button type="button" className="hs-hero__cue" onClick={() => scrollToId(root?.current, target, reduced)}>
        <img src="/shop/icons/scroll.svg" alt="" />
        <span>{cue}</span>
      </button>
    </section>
  );
}

/**
 * Gallery strip under the hero (Figma 6 × 640 × 450, wider than the page):
 * scrolls sideways — drag, trackpad or shift-wheel — with a gentle parallax.
 */
export function GalleryStrip({ images, label }: { images: { url: string; alt: string; logo?: string; to?: string }[]; label: string }) {
  const el = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || !el.current) return;
    drag.current = { x: e.clientX, left: el.current.scrollLeft, moved: false };
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || !el.current) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 4) {
      d.moved = true;
      el.current.dataset.dragging = 'true';
    }
    el.current.scrollLeft = d.left - dx;
  };
  const up = () => {
    if (el.current) delete el.current.dataset.dragging;
    window.setTimeout(() => (drag.current = null), 0);
  };
  return (
    <div
      ref={el}
      className="hs-strip"
      aria-label={label}
      role="region"
      tabIndex={0}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerLeave={up}
      onClickCapture={(e) => drag.current?.moved && e.preventDefault()}
    >
      {images.map((im, i) => {
        const inner = (
          <>
            <img src={im.url} alt={im.alt} loading={i < 3 ? 'eager' : 'lazy'} decoding="async" draggable={false} />
            {im.logo && <span className="hs-strip__logo" style={{ '--logo': `url(${im.logo})` } as CSSProperties} />}
          </>
        );
        return im.to ? (
          <Link key={i} className="hs-strip__item" to={im.to} draggable={false} style={{ '--i': i } as CSSProperties}>
            {inner}
          </Link>
        ) : (
          <figure key={i} className="hs-strip__item" style={{ '--i': i } as CSSProperties}>
            {inner}
          </figure>
        );
      })}
    </div>
  );
}
