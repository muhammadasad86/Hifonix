import { type CSSProperties, type MouseEvent, type PointerEvent, useRef, useState } from 'react';
import { Link } from '../../router';
import { Handwriting, type HandwritingKey } from '../../ui/handwriting/Handwriting';
import type { SplashCardData } from './content';
import { SPLASH_TIMING } from './sequence';

interface Props {
  card: SplashCardData;
  /** position in the sequence (staggers the title / copy reveal) */
  index: number;
  active: boolean;
  /** titles start writing */
  writing: boolean;
  interactive: boolean;
  onActivate: (id: SplashCardData['id'] | null) => void;
  /** CTA pressed: the parent runs the exit (and, if it has one, the image hand-off) */
  onExplore: (card: SplashCardData, el: { card: HTMLElement; img: HTMLImageElement | null }) => boolean;
}

const TITLE: Record<SplashCardData['id'], HandwritingKey> = { artisan: 'artisan-audio', headphones: 'headphones' };

/**
 * One splash category panel. Presentational — entrance / reveal timing is
 * driven by data-attributes on the parent (see sequence.ts + splash.css).
 * Only the "Start exploring" button navigates:
 *   mouse    — hover reveals the button (copy lifts to make room)
 *   touch    — tap the panel to reveal it, tap the button to go
 *   keyboard — the button is a real link; focusing it reveals it
 */
export function SplashCard({ card, index, active, writing, interactive, onActivate, onExplore }: Props) {
  const [missing, setMissing] = useState(false);
  const root = useRef<HTMLElement>(null);
  const img = useRef<HTMLImageElement>(null);

  const onPointerUp = (e: PointerEvent<HTMLElement>) => {
    if (!interactive || e.pointerType === 'mouse' || (e.target as HTMLElement).closest('a')) return;
    onActivate(active ? null : card.id);
  };

  const explore = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || !root.current) return;
    if (onExplore(card, { card: root.current, img: img.current })) e.preventDefault();
  };

  return (
    <section
      ref={root}
      className={`splash-card splash-card--${card.id}`}
      data-from={card.from}
      data-active={active || undefined}
      aria-labelledby={`splash-${card.id}`}
      style={{ '--i': index } as CSSProperties}
      onPointerUp={onPointerUp}
    >
      {missing ? (
        <div className="splash-card__ph" aria-hidden="true">
          <span>Image placeholder</span>
          {card.image.placeholder}
        </div>
      ) : (
        <div className="splash-card__media" aria-hidden="true">
          <img ref={img} src={card.image.src} alt={card.image.alt} decoding="async" onError={() => setMissing(true)} />
        </div>
      )}

      <div className="splash-card__copy">
        <h2 id={`splash-${card.id}`} className="splash-card__title">
          <Handwriting
            name={TITLE[card.id]}
            play={writing}
            duration={SPLASH_TIMING.write}
            delay={index * SPLASH_TIMING.stagger}
          />
        </h2>
        <p className="splash-card__text">
          {card.lines.map((l, i) => (
            <span key={i} style={{ '--l': i } as CSSProperties}>
              {l}{' '}
            </span>
          ))}
        </p>
        <Link
          to={card.to}
          className="splash-card__cta"
          aria-label={`Start exploring ${card.title}`}
          tabIndex={interactive ? 0 : -1}
          onFocus={() => onActivate(card.id)}
          onClick={explore}
        >
          Start exploring
        </Link>
      </div>
    </section>
  );
}
