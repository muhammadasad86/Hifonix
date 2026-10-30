import { type CSSProperties, type MutableRefObject, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { enable, prefersMuted, teardown } from '../audio/ambient';
import { COLLECTIONS } from '../config/navigation';
import { supportsWebGL2 } from '../lib/webgl';
import { Link } from '../router';
import { useExperience } from '../state/useExperience';
import { SiteHeader } from '../ui/SiteHeader';
import { SoundToggle } from '../ui/SoundToggle';
import { CHAPTERS, FADE, JOURNEY_VH, journey, STAGE_ROUTES } from './journey';
import './home.css';

const HomeScene = lazy(() => import('./HomeScene').then((m) => ({ default: m.HomeScene })));

const FLIGHT_MS = 3400;
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const smooth = (t: number) => t * t * (3 - 2 * t);

/** Visibility 0→1 of a chapter's copy at progress p. */
function reveal(p: number, cin: number, cout: number) {
  const a = smooth(clamp01((p - (cin - FADE)) / FADE));
  const b = 1 - smooth(clamp01((p - cout) / FADE));
  return Math.min(a, b);
}

/** Splits copy into masked lines for the staggered reveal. */
function Lines({ lines, className }: { lines: string[]; className?: string }) {
  return (
    <>
      {lines.map((l, i) => (
        <span key={i} className={`line ${className ?? ''}`} style={{ '--i': i } as CSSProperties}>
          <span>{l}</span>
        </span>
      ))}
    </>
  );
}

const STAGES = [
  {
    id: 'hi-fi' as const,
    eyebrow: 'Artisan Studio',
    title: ['Hi-Fi'],
    lede: 'Loudspeakers, amplification, streaming and vinyl — auditioned in a room built for listening, not for the showroom.',
    cta: 'Discover Hi-Fi',
  },
  {
    id: 'headphones' as const,
    eyebrow: 'Headphone Studio',
    title: ['Headphones'],
    lede: 'Open-back, closed-back and electrostatic designs, with the amplifiers, DACs and players that complete them.',
    cta: 'Discover Headphones',
  },
  {
    id: 'collections' as const,
    eyebrow: 'Furniture & Accessories',
    title: ['Collections'],
    lede: 'Equipment furniture, isolation and cabling — the finishing details that let a system perform at its best.',
    cta: 'Discover More',
  },
];

export default function Home() {
  const webgl = useMemo(supportsWebGL2, []);
  const reducedMotion = useExperience((s) => s.reducedMotion);
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [arrived, setArrived] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const veil = useRef<HTMLDivElement>(null);
  const panels = useRef<(HTMLElement | null)[]>([]);
  const flightStart = useRef(0);

  useEffect(() => {
    journey.reducedMotion = reducedMotion;
  }, [reducedMotion]);

  // reset shared journey state on mount, release audio on leave
  useEffect(() => {
    journey.started = false;
    journey.flight = 0;
    journey.target = 0;
    journey.current = 0;
    return () => teardown();
  }, []);

  const start = useCallback(() => {
    if (journey.started) return;
    if (!prefersMuted()) void enable(); // user gesture → audio allowed
    journey.started = true;
    flightStart.current = performance.now();
    setStarted(true);
  }, []);

  // frame loop: flight, scroll damping, DOM reveals, navigator
  useEffect(() => {
    let raf = 0;
    let lastActive = -1;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const rm = journey.reducedMotion;
      if (journey.started && journey.flight < 1) {
        if (rm) {
          // cut through a short veil instead of flying
          const t = clamp01((now - flightStart.current) / 700);
          if (veil.current) veil.current.style.opacity = String(1 - Math.abs(t * 2 - 1));
          if (t >= 0.5) journey.flight = 1;
        } else {
          journey.flight = clamp01((now - flightStart.current) / FLIGHT_MS);
        }
        if (journey.flight >= 1) {
          setArrived(true);
          scroller.current?.focus({ preventScroll: true });
        }
      } else if (veil.current && rm) veil.current.style.opacity = '0';

      const el = scroller.current;
      if (el && journey.flight >= 1) {
        const max = Math.max(1, el.scrollHeight - el.clientHeight);
        journey.target = clamp01(el.scrollTop / max);
      }
      journey.current += (journey.target - journey.current) * (rm ? 1 : 1 - Math.exp(-4.2 * dt));
      const p = journey.current;
      const arrivedK = smooth(clamp01((journey.flight - 0.72) / 0.28));

      CHAPTERS.forEach((c, i) => {
        const node = panels.current[i];
        if (!node) return;
        let v = reveal(p, c.in, c.out);
        if (i === 0) v *= arrivedK;
        node.style.setProperty('--v', v.toFixed(4));
        node.style.visibility = v < 0.002 ? 'hidden' : 'visible';
      });
      root.current?.style.setProperty('--p', p.toFixed(4));
      root.current?.style.setProperty('--flight', journey.flight.toFixed(4));

      // navigator: nearest chapter
      let idx = 0;
      CHAPTERS.forEach((c, i) => {
        if (p >= c.at - 0.12) idx = i;
      });
      if (idx !== lastActive) {
        lastActive = idx;
        setActive(idx);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const goTo = (i: number) => {
    const el = scroller.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    el.scrollTo({ top: CHAPTERS[i].at * max, behavior: journey.reducedMotion ? 'auto' : 'smooth' });
  };

  if (!webgl) return <HomeStatic />;

  return (
    <div className="home" ref={root} data-ready={ready || undefined} data-started={started || undefined} data-arrived={arrived || undefined}>
      {/* scroll driver: native scrolling (wheel, touch, keys) anywhere → progress */}
      <div className="home-scroll" ref={scroller} tabIndex={arrived ? 0 : -1} aria-label="Scroll to explore">
        <div className="home-sticky">
          <Suspense fallback={null}>
            <HomeScene onReady={() => setReady(true)} />
          </Suspense>
          <JourneyPanels panels={panels} arrived={arrived} />
        </div>
        <div style={{ height: `${(JOURNEY_VH - 1) * 100}vh` }} aria-hidden="true" />
      </div>

      <SiteHeader end={<SoundToggle />} />

      {/* ── Splash ─────────────────────────────── */}
      <section className="splash" aria-hidden={started} aria-label="Hifonix">
        <h1 className="splash__title">
          <span className="line" style={{ '--i': 0 } as CSSProperties}>
            <span>
              Artisan <em>Audio</em>
            </span>
          </span>
        </h1>
        <div className="splash__foot">
          <button type="button" className="pill" onClick={start} disabled={!ready || started} tabIndex={started ? -1 : 0}>
            <span className="pill__star" aria-hidden="true">
              ✦
            </span>
            <span>{ready ? 'Start Exploring' : 'Preparing the studio…'}</span>
            <span className="pill__star" aria-hidden="true">
              ✦
            </span>
          </button>
          <p className="splash__note">Best enjoyed with sound on</p>
        </div>
      </section>

      {/* ── Chapter navigator ── */}
      <nav className="chapters" aria-label="Homepage chapters" data-show={arrived || undefined}>
        {CHAPTERS.map((c, i) => (
          <button
            key={c.id}
            type="button"
            className="chapters__item"
            data-active={i === active || undefined}
            aria-current={i === active ? 'step' : undefined}
            onClick={() => goTo(i)}
            tabIndex={arrived ? 0 : -1}
          >
            <span className="chapters__mark" aria-hidden="true">
              ✦
            </span>
            <span className="chapters__label">{c.label}</span>
          </button>
        ))}
      </nav>

      <div className="home-veil" ref={veil} aria-hidden="true" />
    </div>
  );
}

/** Journey copy, revealed by scroll progress (styles driven by --v from the frame loop). */
function JourneyPanels({ panels, arrived }: { panels: MutableRefObject<(HTMLElement | null)[]>; arrived: boolean }) {
  return (
  <div className="panels" aria-live="off">
    <p className="intro__hint" aria-hidden="true">
      <span className="intro__hint-line" />
      Scroll to enter the studio
    </p>
    <article className="panel panel--intro" ref={(n) => (panels.current[0] = n)} aria-hidden={!arrived}>
      <h2 className="intro__title">
        <Lines lines={['When you live', 'for music']} />
      </h2>
      <div className="intro__copy">
        <p>
          Welcome to Hifonix. With nearly 20 years of hi-fi experience, we provide expert guidance and premium sound for every
          listener.
        </p>
        <p>
          Our love for exceptional sound has driven us for almost two decades. Ten years ago, we decided to turn this passion into
          a reality by opening Hifonix. Our store is more than just a place to buy gear; it’s a haven for music lovers who
          appreciate the art and science of great sound.
        </p>
      </div>
    </article>

    {STAGES.map((s, i) => {
      const col = COLLECTIONS[s.id];
      return (
        <article key={s.id} className="panel panel--stage" ref={(n) => (panels.current[i + 1] = n)} aria-labelledby={`stage-${s.id}`}>
          <p className="stage__eyebrow">
            <span>{CHAPTERS[i + 1].index}</span> {s.eyebrow}
          </p>
          <h2 className="stage__title" id={`stage-${s.id}`}>
            <Lines lines={s.title} />
          </h2>
          <p className="stage__lede">{s.lede}</p>
          <ul className="stage__cats" aria-label={`${col.title} categories`}>
            {col.categories.slice(0, 5).map((c) => (
              <li key={c.href}>{c.label}</li>
            ))}
          </ul>
          <Link to={STAGE_ROUTES[s.id]} className="cta">
            <span>{s.cta}</span>
            <svg width="18" height="10" viewBox="0 0 18 10" aria-hidden="true">
              <path d="M0 5h16M12 1l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1" />
            </svg>
          </Link>
        </article>
      );
    })}
  </div>
  );
}

/** No-WebGL fallback: the same copy and CTAs, as a calm stacked page. */
function HomeStatic() {
  return (
    <div className="home-static">
      <SiteHeader end={<SoundToggle />} />
      <section className="home-static__splash">
        <h1 className="splash__title">Artisan Audio</h1>
      </section>
      <section className="home-static__block">
        <h2 className="intro__title">When you live for music</h2>
        <p>
          Welcome to Hifonix. With nearly 20 years of hi-fi experience, we provide expert guidance and premium sound for every listener.
        </p>
        <p>
          Our love for exceptional sound has driven us for almost two decades. Ten years ago, we decided to turn this passion into a
          reality by opening Hifonix. Our store is more than just a place to buy gear; it’s a haven for music lovers who appreciate the
          art and science of great sound.
        </p>
      </section>
      {STAGES.map((s) => (
        <section key={s.id} className="home-static__block">
          <p className="stage__eyebrow">{s.eyebrow}</p>
          <h2 className="stage__title">{s.title.join(' ')}</h2>
          <p>{s.lede}</p>
          <Link to={STAGE_ROUTES[s.id]} className="cta">
            {s.cta}
          </Link>
        </section>
      ))}
    </div>
  );
}
