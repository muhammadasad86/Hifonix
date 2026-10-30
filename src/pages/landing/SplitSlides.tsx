import { type CSSProperties, useLayoutEffect, useRef, useState } from 'react';
import { Link } from '../../router';

export interface SplitSlide {
  id: string;
  /** one string, or explicit lines (Figma line breaks) */
  title: string | readonly string[];
  body: string;
  to: string;
  image: string;
}

/**
 * The split slider scene shared by both landing stories: copy column on the
 * left (vertical track, numbered pager), framed photograph on the right.
 * Figma: Hi-Fi "Aavik → Manley" (light) and Headphones categories (dark).
 * The parent story owns the timeline: it passes the active slide and scrolls
 * the page when a pager dot is pressed.
 */
export function SplitSlides({
  id,
  label,
  slides,
  active,
  onGo,
  storyP,
  variant = 'light',
  eyebrow,
  pagerLabel,
}: {
  id: string;
  label: string;
  slides: readonly SplitSlide[];
  active: number;
  onGo: (i: number) => void;
  storyP: number;
  variant?: 'light' | 'dark';
  eyebrow?: string;
  pagerLabel: string;
}) {
  const n = slides.length;
  const track = useRef<HTMLDivElement>(null);
  const [offsets, setOffsets] = useState<number[]>([]);

  // copy column: offsets of each slide in the vertical track
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

  return (
    <section
      id={id}
      data-story-p={storyP}
      className={`hf-scene hf-scene--brands hf-brands${variant === 'dark' ? ' hf-brands--dark' : ''}`}
      style={{ '--n': n } as CSSProperties}
      aria-label={label}
    >
      <div className="hf-brands__pin">
        <div className="hf-brands__left">
          <div className="hf-brands__inner">
            {eyebrow && <p className="hf-brands__eyebrow">{eyebrow}</p>}
            <div className="hf-brands__viewport">
              <div ref={track} className="hf-brands__track" style={{ transform: `translate3d(0, ${-(offsets[active] ?? 0)}px, 0)` }}>
                {slides.map((b, i) => (
                  <article key={b.id} className="hf-brand" data-active={i === active || undefined} aria-hidden={i !== active}>
                    <h3 className="hf-display hf-brand__title">
                      {typeof b.title === 'string' ? b.title : b.title.map((t) => <span key={t}>{t}</span>)}
                    </h3>
                    <p className="hf-copy hf-brand__body">{b.body}</p>
                    <Link to={b.to} className={`hf-pill${variant === 'dark' ? '' : ' hf-pill--dark'}`} tabIndex={i === active ? 0 : -1}>
                      <span>Discover more</span>
                    </Link>
                  </article>
                ))}
              </div>
            </div>
            <ol className="hf-pager" aria-label={pagerLabel}>
              {slides.map((b, i) => (
                <li key={b.id}>
                  <button
                    type="button"
                    className="hf-pager__dot"
                    data-active={i === active || undefined}
                    aria-label={`${i + 1}: ${typeof b.title === 'string' ? b.title : b.title.join(' ')}`}
                    aria-current={i === active ? 'step' : undefined}
                    onClick={() => onGo(i)}
                  >
                    <span className="hf-pager__fill" />
                    <span className="hf-pager__num">{i + 1}</span>
                  </button>
                  {i < n - 1 && (
                    <span className="hf-pager__line" aria-hidden="true">
                      <span style={{ '--i': i } as CSSProperties} />
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
              {slides.map((b, i) => (
                <div key={b.id} className="hf-brands__img" data-active={i === active || undefined}>
                  <img decoding="async" src={b.image} alt="" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
