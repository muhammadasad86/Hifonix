import { type CSSProperties, type FormEvent, type RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from '../../router';
import {
  clamp01,
  easeInOut,
  easeOut,
  scrollToId,
  setVars,
  span,
  useMediaQuery,
  useReducedMotion,
  useReveal,
  useScrollFrame,
  useScrollProgress,
  useScrollRootEl,
} from '../../ui/chrome/scroll';
import { Handwriting } from '../../ui/handwriting/Handwriting';
import { landImageHandoff, peekImageHandoff, releaseImageHandoff } from '../../ui/transition/imageHandoff';
import { ART, BRAND_SLIDES, ELEVATE, EXTRA_MILE, HEADFI, HERO, LOGO_STRIP, NEWSLETTER } from './content';
import { Headphone360 } from './Headphone360';

const d = (i: number) => ({ '--d': i }) as CSSProperties;

/* ------------------------------------------------------------------ hero */
/**
 * Pointer-driven depth for a hero: the scene tilts toward the quadrant under
 * the cursor, a warm key light follows it, and the copy counter-shifts
 * (writes --tx / --ty / --tz on the section; CSS: .hf-hero__tilt / __light / __slides).
 * Shared by the Hi-Fi and Headphones heroes.
 */
export function useHeroTilt(sec: RefObject<HTMLElement>, reduced: boolean) {
  useEffect(() => {
    const s = sec.current;
    if (!s || reduced || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    let tx = 0;
    let ty = 0;
    let tz = 0;
    let x = 0;
    let y = 0;
    let z = 0;
    let raf = 0;
    const loop = () => {
      x += (tx - x) * 0.075;
      y += (ty - y) * 0.075;
      z += (tz - z) * 0.06;
      setVars(s, { '--tx': x, '--ty': y, '--tz': z });
      raf = Math.abs(tx - x) + Math.abs(ty - y) + Math.abs(tz - z) > 0.0015 ? requestAnimationFrame(loop) : 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const move = (e: PointerEvent) => {
      const r = s.getBoundingClientRect();
      tx = clamp01((e.clientX - r.left) / r.width) * 2 - 1;
      ty = clamp01((e.clientY - r.top) / r.height) * 2 - 1;
      tz = 1;
      kick();
    };
    const leave = () => {
      tx = ty = tz = 0;
      kick();
    };
    s.addEventListener('pointermove', move);
    s.addEventListener('pointerleave', leave);
    return () => {
      cancelAnimationFrame(raf);
      s.removeEventListener('pointermove', move);
      s.removeEventListener('pointerleave', leave);
    };
  }, [sec, reduced]);
}

/** Ms each hero title takes to write; the copy below follows when the pen lifts. */
const HERO_WRITE = [
  [850, 900], // "Hifonix - For" / "the love of music"
  [800], // "Hi-Fi"
];

/**
 * Figma 1:4436 — masked hero image with two stacked text states.
 * Arriving from the splash "Artisan Audio" card, the speaker photo is handed
 * over (imageHandoff) and expands into place before the copy writes itself in.
 */
export function Hero() {
  const reduced = useReducedMotion();
  const root = useScrollRootEl();
  const [handoff] = useState(() => peekImageHandoff('hifi-hero'));
  const [phase, setPhase] = useState<'arriving' | 'landed' | 'idle'>(handoff ? 'arriving' : 'idle');
  const [active, setActive] = useState(handoff ? 1 : 0);
  const [paused, setPaused] = useState(false);
  const [entered, setEntered] = useState(false);
  const media = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const sec = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (!handoff) {
      const r = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(r);
    }
    const s = sec.current;
    const i = img.current;
    if (!s || !i) return;
    // the page root's ref is attached after child layout effects run — resolve it from the DOM
    const page = s.closest<HTMLElement>('.hf');
    page?.setAttribute('data-arriving', '');
    let alive = true;
    landImageHandoff(handoff, s.getBoundingClientRect(), i.getBoundingClientRect()).then(() => {
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

  useEffect(() => {
    if (reduced || paused || !entered) return;
    const t = window.setInterval(() => setActive((a) => (a + 1) % HERO.slides.length), 9000);
    return () => window.clearInterval(t);
  }, [reduced, paused, entered]);

  // Figma prototype: leaving the hero, the camera pushes into the speaker cone
  // (scroll-linked — reverses when scrolling back up)
  useScrollFrame((y) => {
    const el = media.current;
    const s = sec.current;
    const h = s?.offsetHeight ?? 1;
    if (!el || !s || reduced || y > h * 1.2) return;
    const k = easeInOut(clamp01(y / h));
    el.style.transform = `translate3d(0, ${(y * 0.35).toFixed(1)}px, 0) scale(${(1 + k * 0.85).toFixed(4)})`;
    setVars(s, { '--zoom': k });
  });

  useHeroTilt(sec, reduced);

  // visual stacking order in Figma: state A ("Hi-Fi") sits above state B
  const pos = (i: number) => (i === 0 ? 1 : 0);

  return (
    <section
      ref={sec}
      className="hf-hero"
      data-in={entered || undefined}
      data-phase={phase}
      aria-roledescription="carousel"
      aria-label="Introduction"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="hf-hero__media" ref={media}>
        <div className="hf-hero__tilt">
          <img ref={img} src={HERO.image} alt="" />
          <span className="hf-hero__light" aria-hidden="true" />
        </div>
      </div>
      <div className="hf-hero__slides">
        {HERO.slides.map((s, i) => {
          const off = pos(i) - pos(active);
          const on = entered && i === active;
          const write = HERO_WRITE[i];
          const total = write.reduce((t, w) => t + w, 0) + 80 * (write.length - 1);
          const after = (extra: number) => ({ transitionDelay: on ? `${total + extra}ms` : '0ms' });
          return (
            <div
              key={s.title}
              className="hf-hero__slide"
              data-active={i === active || undefined}
              style={{ '--off': off } as CSSProperties}
              aria-hidden={i !== active}
              role="group"
              aria-roledescription="slide"
            >
              <div className="hf-container">
                <div className="hf-hero__col">
                  {(() => {
                    const T = i === 0 ? 'h1' : 'p';
                    return (
                      <T className="hf-hero__title">
                        {i === 0 ? (
                          <>
                            <span className="hf-hero__line">
                              <Handwriting name="hifonix-line-1" play={on} duration={write[0]} />
                            </span>
                            <span className="hf-hero__line">
                              <Handwriting name="hifonix-line-2" play={on} duration={write[1]} delay={write[0] + 80} />
                            </span>
                          </>
                        ) : (
                          <Handwriting name="hi-fi" play={on} duration={write[0]} />
                        )}
                      </T>
                    );
                  })()}
                  <p className="hf-hero__body" style={after(0)}>
                    {s.body[0]}{' '}
                    <br />
                    {s.body[1]}
                  </p>
                  <button
                    type="button"
                    className="hf-pill hf-hero__cta"
                    style={after(160)}
                    tabIndex={i === active ? 0 : -1}
                    onClick={() => scrollToId(root?.current, s.cta.target, reduced)}
                  >
                    <span>{s.cta.label}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ logo strip */
/** Logos arrive once, staggered left → right, the first time the strip is seen. */
export function LogoStrip() {
  const [ref, inView] = useReveal<HTMLElement>(0.4);
  const row = (hidden: boolean) => (
    <ul className="hf-strip__row" aria-hidden={hidden || undefined}>
      {LOGO_STRIP.map((l, i) => (
        <li key={i} style={{ '--i': i + (hidden ? LOGO_STRIP.length : 0) } as CSSProperties}>
          <img decoding="async" src={l.src} alt="" style={{ width: l.w, height: l.h }} loading="lazy" />
        </li>
      ))}
    </ul>
  );
  return (
    <section ref={ref} className="hf-strip" data-in={inView || undefined} aria-label="Brands we carry">
      <div className="hf-strip__track">
        {row(false)}
        {row(true)}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- elevate */
/**
 * Scroll-linked split: copy travels in from the left, the headphone from the
 * right, in proportion to scroll (stop scrolling → the motion stops).
 */
/** `staged`: rendered as a scene of the pinned desktop Story, which drives its CSS vars. */
interface Staged {
  staged?: boolean;
}

export function Elevate({ staged }: Staged) {
  const ref = useScrollProgress<HTMLElement>(
    staged
      ? null
      : ({ enter, exit }, el) => {
          setVars(el, { '--p': easeOut(span(enter, 0.08, 0.82)), '--q': easeInOut(span(exit, 0.35, 1)) });
        },
  );
  return (
    <section ref={ref} id="hf-elevate" className={`hf-sec hf-elevate${staged ? ' hf-scene hf-scene--elevate' : ''}`}>
      <div className="hf-bg" aria-hidden="true">
        <img decoding="async" src={ELEVATE.bg} alt="" loading="lazy" />
        <span className="hf-bg__shade hf-bg__shade--a" />
      </div>
      <div className="hf-container">
        <div className="hf-canvas">
          <h2 className="hf-display hf-elevate__title hf-from-left" style={{ '--k': 0 } as CSSProperties}>
            {ELEVATE.title.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </h2>
          <p className="hf-copy hf-elevate__body hf-from-left" style={{ '--k': 1 } as CSSProperties}>
            {ELEVATE.body}
          </p>
          <div className="hf-elevate__product hf-from-right">
            <Headphone360 poster={ELEVATE.product} alt="Headphones" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------- brand slider */
export function BrandSlider() {
  const desktop = useMediaQuery('(min-width: 1024px)');
  return desktop ? <BrandSliderPinned /> : <BrandSliderStack />;
}

function BrandSliderPinned() {
  const n = BRAND_SLIDES.length;
  const reduced = useReducedMotion();
  const root = useScrollRootEl();
  const wrap = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const fills = useRef<(HTMLSpanElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [offsets, setOffsets] = useState<number[]>([]);

  useLayoutEffect(() => {
    const el = track.current;
    if (!el) return;
    const measure = () => setOffsets(Array.from(el.children, (c) => (c as HTMLElement).offsetTop));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => ro.disconnect();
  }, []);

  // scroll distance over which the section stays pinned
  const range = () => {
    const w = wrap.current;
    const vh = root?.current?.clientHeight ?? window.innerHeight;
    if (!w) return { top: 0, len: 1 };
    return { top: w.offsetTop, len: Math.max(1, w.offsetHeight - vh) };
  };

  const pin = useRef<HTMLDivElement>(null);

  useScrollFrame((y) => {
    const { top, len } = range();
    const vh = root?.current?.clientHeight ?? window.innerHeight;
    const p = Math.min(1, Math.max(0, (y - top) / len));
    const step = Math.min(n - 1, Math.floor(p * n));
    setActive(step);
    // scroll-linked entrance (before pinning) and split exit (after release)
    if (!reduced) {
      setVars(pin.current, {
        '--in': easeOut(span(y + vh - top, vh * 0.1, vh * 0.92)),
        '--out': easeInOut(span(y - top - len, 0, vh * 0.85)),
      });
    }
    fills.current.forEach((f, i) => {
      if (f) f.style.transform = `scaleX(${Math.min(1, Math.max(0, p * n - i)).toFixed(3)})`;
    });
  });

  const go = (i: number) => {
    const { top, len } = range();
    root?.current?.scrollTo({ top: top + ((i + 0.5) / n) * len, behavior: reduced ? 'auto' : 'smooth' });
  };

  return (
    <section ref={wrap} id="hf-brands" className="hf-brands" style={{ '--n': n } as CSSProperties} aria-label="Featured brands">
      <div ref={pin} className="hf-brands__pin">
        <div className="hf-brands__left">
          <div className="hf-brands__inner">
            <div className="hf-brands__viewport">
              <div ref={track} className="hf-brands__track" style={{ transform: `translate3d(0, ${-(offsets[active] ?? 0)}px, 0)` }}>
                {BRAND_SLIDES.map((b, i) => (
                  <article key={b.id} className="hf-brand" data-active={i === active || undefined} aria-hidden={i !== active}>
                    <h3 className="hf-display hf-brand__title">{b.title}</h3>
                    <p className="hf-copy hf-brand__body">{b.body}</p>
                    <Link to={b.to} className="hf-pill hf-pill--dark" tabIndex={i === active ? 0 : -1}>
                      <span>Discover more</span>
                    </Link>
                  </article>
                ))}
              </div>
            </div>
            <ol className="hf-pager" aria-label="Brand">
              {BRAND_SLIDES.map((b, i) => (
                <li key={b.id}>
                  <button
                    type="button"
                    className="hf-pager__dot"
                    data-active={i === active || undefined}
                    aria-label={`${i + 1}: ${b.title}`}
                    aria-current={i === active ? 'step' : undefined}
                    onClick={() => go(i)}
                  >
                    <span className="hf-pager__fill" />
                    <span className="hf-pager__num">{i + 1}</span>
                  </button>
                  {i < n - 1 && (
                    <span className="hf-pager__line" aria-hidden="true">
                      <span ref={(el) => (fills.current[i] = el)} />
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div className="hf-brands__right" aria-hidden="true">
          <span className="hf-frame hf-frame--all" />
          <span className="hf-frame hf-frame--fade" />
          <span className="hf-frame hf-frame--side" />
          <span className="hf-frame hf-frame--top" />
          <div className="hf-brands__shot">
            <div className="hf-brands__shots" style={{ transform: `translate3d(0, ${(-active * 100) / n}%, 0)` }}>
              {BRAND_SLIDES.map((b, i) => (
                <div key={b.id} className="hf-brands__img" data-active={i === active || undefined}>
                  {b.video ? (
                    <video src={b.video} poster={b.image} muted loop playsInline autoPlay={!reduced} />
                  ) : (
                    <img decoding="async" src={b.image} alt="" loading="lazy" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function BrandSliderStack() {
  return (
    <section id="hf-brands" className="hf-brands-stack" aria-label="Featured brands">
      {BRAND_SLIDES.map((b) => (
        <StackCard key={b.id} b={b} />
      ))}
    </section>
  );
}

function StackCard({ b }: { b: (typeof BRAND_SLIDES)[number] }) {
  const ref = useScrollProgress<HTMLElement>(({ enter }, el) => {
    setVars(el, { '--p': easeOut(span(enter, 0.05, 0.7)) });
  });
  return (
    <article ref={ref} className="hf-brand-card">
      <div className="hf-brand-card__img hf-from-right">
        <img decoding="async" src={b.image} alt="" loading="lazy" />
      </div>
      <div className="hf-container hf-from-left">
        <h3 className="hf-display hf-brand__title">{b.title}</h3>
        <p className="hf-copy hf-brand__body">{b.body}</p>
        <Link to={b.to} className="hf-pill hf-pill--dark">
          <span>Discover more</span>
        </Link>
      </div>
    </article>
  );
}

/* --------------------------------------------------------------- head-fi */
/**
 * Section 4: the photograph starts dissolved (blurred, pushed in) and resolves
 * — zooming out to crisp — as it scrolls in; the title lines follow one by one.
 * On the way out its background dissolves toward the next section.
 */
export function HeadFi({ staged }: Staged) {
  const ref = useScrollProgress<HTMLElement>(
    staged
      ? null
      : ({ enter, exit }, el) => {
          setVars(el, { '--p': easeOut(span(enter, 0, 0.95)), '--q': span(exit, 0.15, 1) });
        },
  );
  return (
    <section ref={ref} className={`hf-sec hf-headfi${staged ? ' hf-scene hf-scene--headfi' : ''}`}>
      <div className="hf-bg hf-bg--crop hf-headfi__bg" aria-hidden="true">
        <img decoding="async" src={HEADFI.bg} alt="" loading="lazy" />
        <span className="hf-bg__shade hf-bg__shade--a" />
      </div>
      <div className="hf-container">
        <div className="hf-canvas hf-stackcol">
          <h2 className="hf-display">
            {HEADFI.title.map((t, i) => (
              <span key={t} className="hf-line" style={{ '--k': i } as CSSProperties}>
                {t}
              </span>
            ))}
          </h2>
          <p className="hf-copy hf-line" style={{ '--k': HEADFI.title.length } as CSSProperties}>
            {HEADFI.body}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------- art */
/**
 * Section 5: its background fades up as Head-Fi's fades out (no hard cut),
 * the copy rises and scales in, the stands glide up into place. Leaving, the
 * whole section dissolves to the black of section 6.
 */
export function Art({ staged }: Staged) {
  const ref = useScrollProgress<HTMLElement>(
    staged
      ? null
      : ({ enter, exit }, el) => {
          setVars(el, {
            '--p': easeOut(span(enter, 0, 0.9)),
            '--h': easeOut(span(enter, 0.25, 1)),
            '--q': easeInOut(span(exit, 0.1, 0.9)),
          });
        },
  );
  return (
    <section ref={ref} className={`hf-sec hf-art${staged ? ' hf-scene hf-scene--art' : ''}`}>
      <div className="hf-bg hf-bg--blur hf-art__bg" aria-hidden="true">
        <img decoding="async" src={ART.bg} alt="" loading="lazy" />
        <span className="hf-bg__shade hf-bg__shade--b" />
      </div>
      <div className="hf-container">
        <div className="hf-canvas hf-stackcol hf-art__copy">
          <div className="hf-art__product">
            <img decoding="async" src={ART.product} alt="Headphones on display stands" loading="lazy" />
          </div>
          <h2 className="hf-display">
            {ART.title.map((t, i) => (
              <span key={t} className="hf-line" style={{ '--k': i } as CSSProperties}>
                {t}
              </span>
            ))}
          </h2>
          <p className="hf-copy hf-art__body hf-line" style={{ '--k': ART.title.length } as CSSProperties}>
            {ART.body.map((t, i) => (
              <span key={t}>
                {t}
                {i < ART.body.length - 1 ? ' ' : ''}
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ extra mile */
/**
 * Section 6 on black — Figma prototype frames 3647:12567 → 12580 → 12637.
 *
 *   A  black; the two collage shots are small, 20 % opacity, blurred 34
 *   B  shots grow to their places (40 %, sharp); "Going the extra mile…" fades in
 *   C  shots grow again (70 %, bleeding off the canvas); the copy dissolves into
 *      "Community & Support"; two soft shots surface behind it
 *
 * In the desktop story the stage drives `--g` (shots fade in), `--a` (A → B) and
 * `--c` (B → C). In flow layouts (tablet / mobile / reduced motion) the shots sit
 * at state B and both copy blocks stack.
 */
export function ExtraMile({ staged }: Staged) {
  const ref = useScrollProgress<HTMLElement>(
    staged
      ? null
      : ({ enter }, el) => {
          setVars(el, { '--t': easeOut(span(enter, 0.2, 0.9)) });
        },
  );
  const next = EXTRA_MILE.next;
  return (
    <section ref={ref} className={`hf-sec hf-extra${staged ? ' hf-scene hf-scene--extra' : ''}`}>
      <div className="hf-container">
        <div className="hf-canvas">
          <div className="hf-extra__ghost hf-extra__ghost--c" aria-hidden="true">
            <img decoding="async" src={next.imageC} alt="" loading="lazy" />
          </div>
          <div className="hf-extra__ghost hf-extra__ghost--d" aria-hidden="true">
            <img decoding="async" src={next.imageD} alt="" loading="lazy" />
          </div>
          <div className="hf-extra__a" aria-hidden="true">
            <img decoding="async" src={EXTRA_MILE.imageA} alt="" loading="lazy" />
          </div>
          <div className="hf-extra__b" aria-hidden="true">
            <img decoding="async" src={EXTRA_MILE.imageB} alt="" loading="lazy" />
          </div>
          <div className="hf-extra__text hf-extra__text--1">
            <h2 className="hf-display hf-line" style={{ '--k': 0 } as CSSProperties}>
              {EXTRA_MILE.title}
            </h2>
            <p className="hf-copy hf-line" style={{ '--k': 1 } as CSSProperties}>
              {EXTRA_MILE.body}
            </p>
          </div>
          <div className="hf-extra__text hf-extra__text--2">
            <h2 className="hf-display hf-line" style={{ '--k': 0 } as CSSProperties}>
              {next.title}
            </h2>
            <div className="hf-copy hf-line hf-extra__paras" style={{ '--k': 1 } as CSSProperties}>
              {next.body.map((t) => (
                <p key={t.slice(0, 12)}>{t}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ newsletter */
/** Google Maps embed centred on the UAE with a marker (keyless embed; see README for the JS API option). */
const MAP_EMBED = 'https://www.google.com/maps?q=United+Arab+Emirates&ll=24.2,54.4&z=6&hl=en&output=embed';

export function Newsletter({ staged }: Staged) {
  const [ref, inView] = useReveal<HTMLElement>(0.2);
  // in the desktop stories the whole panel slides in from the right instead
  const map = useScrollProgress<HTMLDivElement>(
    staged
      ? null
      : ({ enter }, el) => {
          setVars(el, { '--p': easeOut(span(enter, 0.02, 0.7)) });
        },
  );
  const [sent, setSent] = useState(false);
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!e.currentTarget.reportValidity()) return;
    setSent(true); // placeholder only — no newsletter / Shopify customer API connected
  };
  const field = (id: string, label: string, type = 'text', auto?: string) => (
    <label className="hf-field" htmlFor={`hf-nl-${id}`}>
      <input id={`hf-nl-${id}`} name={id} type={type} placeholder=" " required autoComplete={auto} />
      <span>
        {label} <em>(required)</em>
      </span>
    </label>
  );
  return (
    <section
      ref={ref}
      className={`hf-sec hf-news${staged ? ' hf-scene hf-scene--news' : ''}`}
      data-in={inView || undefined}
      aria-labelledby="hf-news-title"
    >
      <div className="hf-container">
        <div className="hf-canvas hf-news__row">
          <form className="hf-news__form" onSubmit={submit} noValidate>
            <div className="hf-news__head" data-r style={d(0)}>
              <p className="hf-news__eyebrow">
                {NEWSLETTER.eyebrow[0]}
                <b>{NEWSLETTER.eyebrow[1]}</b>
              </p>
              <h2 id="hf-news-title" className="hf-news__title">
                {NEWSLETTER.title[0]}{' '}
                <br />
                {NEWSLETTER.title[1]}
              </h2>
            </div>
            <ul className="hf-news__perks" data-r style={d(1)}>
              {NEWSLETTER.perks.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <div data-r style={d(2)}>
              {field('email', 'Email', 'email', 'email')}
            </div>
            <div className="hf-news__pair" data-r style={d(2)}>
              {field('first', 'First name', 'text', 'given-name')}
              {field('last', 'Last name', 'text', 'family-name')}
            </div>
            <p className="hf-news__fine" data-r style={d(3)}>
              {NEWSLETTER.consent}
              <Link to={NEWSLETTER.privacyTo}>privacy policy</Link>
              <b>.</b>
            </p>
            <p className="hf-news__fine hf-news__fine--tight" data-r style={d(3)}>
              This site is protected by reCAPTCHA and the{' '}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
                Google Privacy Policy
              </a>{' '}
              and{' '}
              <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer">
                Terms of Service
              </a>{' '}
              apply.
            </p>
            <div className="hf-news__submit" data-r style={d(4)}>
              <button type="submit" className="hf-pill hf-pill--dark">
                <span>Subscribe</span>
              </button>
              <span role="status" className="hf-news__status" data-show={sent || undefined}>
                Thank you — sign-up isn&rsquo;t connected yet (development preview).
              </span>
            </div>
          </form>
          <div ref={map} className="hf-news__map">
            <img decoding="async" className="hf-news__mapimg" src={NEWSLETTER.map} alt="" loading="lazy" />
            <iframe
              className="hf-news__gmap"
              title="Hifonix — United Arab Emirates on Google Maps"
              src={MAP_EMBED}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </section>
  );
}
