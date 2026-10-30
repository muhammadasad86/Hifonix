import { type CSSProperties, type RefObject, useLayoutEffect, useRef, useState } from 'react';
import { Link } from '../../router';
import { easeOut, scrollToId, setVars, span, useReducedMotion, useScrollProgress, useScrollRootEl } from '../../ui/chrome/scroll';
import { Handwriting } from '../../ui/handwriting/Handwriting';
import { landImageHandoff, peekImageHandoff, releaseImageHandoff } from '../../ui/transition/imageHandoff';
import { useHeroTilt } from '../hifi/sections';
import { HP_CATEGORIES, HP_CATEGORY_EYEBROW, HP_HERO } from './content';

/** Ms each hero title line takes to write (same pen as the Hi-Fi hero). */
const WRITE = [850, 900];

/**
 * Headphones hero — Figma 1934:20663: black left half with the hand-written
 * title, the headphone photograph on the right half. Arriving from the splash
 * "Headphones" card, the same photo is handed over (imageHandoff) and settles
 * into place before the title writes itself in. In the desktop story the
 * photo (`imgWrap`) is then driven by scroll: it zooms into the ear-cup grille.
 */
export function HpHero({ imgWrap, staged }: { imgWrap?: RefObject<HTMLDivElement>; staged?: boolean }) {
  const reduced = useReducedMotion();
  const root = useScrollRootEl();
  const [handoff] = useState(() => peekImageHandoff('hp-hero'));
  const [phase, setPhase] = useState<'arriving' | 'landed' | 'idle'>(handoff ? 'arriving' : 'idle');
  const [entered, setEntered] = useState(false);
  const sec = useRef<HTMLElement>(null);
  const ownWrap = useRef<HTMLDivElement>(null);
  const wrap = imgWrap ?? ownWrap;
  const img = useRef<HTMLImageElement>(null);

  useLayoutEffect(() => {
    if (!handoff) {
      const r = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(r);
    }
    const s = sec.current;
    const i = img.current;
    if (!s || !i) return;
    const page = s.closest<HTMLElement>('.hf');
    page?.setAttribute('data-arriving', '');
    let alive = true;
    landImageHandoff(handoff, s.getBoundingClientRect(), i.getBoundingClientRect(), 1250).then(() => {
      if (!alive) return;
      setPhase('landed');
      requestAnimationFrame(() => {
        releaseImageHandoff(handoff);
        page?.removeAttribute('data-arriving');
        setEntered(true);
      });
    });
    return () => {
      alive = false;
    };
  }, [handoff]);

  // same pointer depth + key light as the Hi-Fi hero
  useHeroTilt(sec, reduced);

  const after = (extra: number) => ({ transitionDelay: entered ? `${WRITE[0] + WRITE[1] + 80 + extra}ms` : '0ms' });

  return (
    <section
      ref={sec}
      id="hp-hero"
      className={`hf-hero hp-hero${staged ? ' hf-scene hf-scene--hero' : ''}`}
      data-in={entered || undefined}
      data-phase={phase}
      aria-label="Introduction"
    >
      <div className="hp-hero__panel" aria-hidden="true" />
      <div className="hf-hero__slides">
        <div className="hf-hero__slide" data-active style={{ '--off': 0 } as CSSProperties}>
          <div className="hf-container">
            <div className="hf-hero__col">
              <h1 className="hf-hero__title">
                <span className="hf-hero__line">
                  <Handwriting name="hifonix-line-1" play={entered} duration={WRITE[0]} />
                </span>
                <span className="hf-hero__line">
                  <Handwriting name="hifonix-line-2" play={entered} duration={WRITE[1]} delay={WRITE[0] + 80} />
                </span>
              </h1>
              <p className="hf-hero__body" style={after(0)}>
                {HP_HERO.body[0]} <br />
                {HP_HERO.body[1]}
              </p>
              <button
                type="button"
                className="hf-pill hf-hero__cta"
                style={after(160)}
                onClick={() => scrollToId(root?.current, 'hp-categories', reduced)}
              >
                <span>{HP_HERO.cta}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* above the copy: when it zooms it covers the whole stage (Figma 1934:20700) */}
      <div ref={wrap} className="hp-hero__img" aria-hidden="true">
        <div className="hf-hero__tilt">
          <img ref={img} src={HP_HERO.image} alt="" />
          <span className="hf-hero__light" />
        </div>
        <span className="hp-hero__shade" />
      </div>
    </section>
  );
}

/** Tablet / phone / reduced motion: the six categories as stacked cards (dark). */
export function CategoryStack() {
  return (
    <section id="hp-categories" className="hf-brands-stack hf-brands-stack--dark" aria-label="Headphone categories">
      <p className="hf-brands__eyebrow hf-container">{HP_CATEGORY_EYEBROW}</p>
      {HP_CATEGORIES.map((b) => (
        <CategoryCard key={b.id} b={b} />
      ))}
    </section>
  );
}

function CategoryCard({ b }: { b: (typeof HP_CATEGORIES)[number] }) {
  const ref = useScrollProgress<HTMLElement>(({ enter }, el) => {
    setVars(el, { '--p': easeOut(span(enter, 0.05, 0.7)) });
  });
  const title = typeof b.title === 'string' ? b.title : b.title.join(' ');
  return (
    <article ref={ref} className="hf-brand-card">
      <div className="hf-brand-card__img hf-from-right">
        <img decoding="async" src={b.image} alt="" loading="lazy" />
      </div>
      <div className="hf-container hf-from-left">
        <h3 className="hf-display hf-brand__title">{title}</h3>
        <p className="hf-copy hf-brand__body">{b.body}</p>
        <Link to={b.to} className="hf-pill">
          <span>Discover more</span>
        </Link>
      </div>
    </article>
  );
}
