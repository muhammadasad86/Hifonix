import { type CSSProperties, useEffect, useId, useRef } from 'react';
import { TITLES } from './titles';
import './handwriting.css';

export type HandwritingKey = keyof typeof TITLES;

interface Props {
  /** generated title (scripts/handwriting/generate.py) */
  name: HandwritingKey;
  /** start writing when true; stays written afterwards */
  play: boolean;
  /** total writing time, ms (pen speed is constant: long strokes take longer) */
  duration?: number;
  delay?: number;
  onDone?: () => void;
  className?: string;
}

const PAD = 40; // font units of breathing room around the ink

/**
 * Script title that is written stroke by stroke.
 *
 * The real text stays in the DOM (transparent) for layout, selection and
 * screen readers; an SVG overlay draws the exact glyph outlines through a mask
 * of pen strokes traced from the letter skeletons. Each stroke's
 * stroke-dashoffset is animated in writing order at a constant pen speed.
 * Reduced motion → the title is shown without the writing animation.
 */
export function Handwriting({ name, play, duration = 1600, delay = 0, onDone, className = '' }: Props) {
  const data = TITLES[name];
  const id = useId().replace(/:/g, '');
  const maskRef = useRef<SVGMaskElement>(null);
  const done = useRef(false);
  const cb = useRef(onDone);
  cb.current = onDone;

  const [x0, y0, x1, y1] = data.box;
  const vb = { x: x0 - PAD, y: y0 - PAD, w: x1 - x0 + PAD * 2, h: y1 - y0 + PAD * 2 };

  useEffect(() => {
    const mask = maskRef.current;
    if (!mask || !play || done.current) return;
    const paths = Array.from(mask.querySelectorAll('path'));
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || typeof paths[0]?.animate !== 'function') {
      paths.forEach((p) => (p.style.strokeDashoffset = '0'));
      done.current = true;
      cb.current?.();
      return;
    }
    // constant pen speed + a short lift between strokes
    const total = data.strokes.reduce((s, k) => s + k.len, 0);
    const lift = Math.min(28, duration * 0.012);
    const draw = Math.max(200, duration - lift * (data.strokes.length - 1));
    let t = delay;
    const anims = paths.map((p, i) => {
      const len = data.strokes[i].len;
      const dur = Math.max(16, (len / total) * draw);
      const a = p.animate([{ strokeDashoffset: len + 1 }, { strokeDashoffset: 0 }], {
        duration: dur,
        delay: t,
        easing: 'cubic-bezier(0.33, 0, 0.45, 1)',
        fill: 'both',
      });
      t += dur + lift;
      return a;
    });
    const last = anims[anims.length - 1];
    if (last) {
      last.onfinish = () => {
        done.current = true;
        cb.current?.();
      };
    }
    return () => {
      if (!done.current) anims.forEach((a) => a.cancel());
    };
  }, [play, delay, duration, data]);

  return (
    <span className={`hw ${className}`} data-written={play || undefined}>
      <span className="hw__text">{data.text}</span>
      <svg
        className="hw__ink"
        aria-hidden="true"
        focusable="false"
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        style={
          {
            left: `${vb.x / 1000}em`,
            top: `calc(50% + ${vb.y / 1000}em)`,
            width: `${vb.w / 1000}em`,
            height: `${vb.h / 1000}em`,
          } as CSSProperties
        }
      >
        <mask id={`hw-${id}`} ref={maskRef} maskUnits="userSpaceOnUse" x={vb.x} y={vb.y} width={vb.w} height={vb.h}>
          {data.strokes.map((s, i) => (
            <path
              key={i}
              d={s.d}
              fill="none"
              stroke="#fff"
              strokeWidth={s.w}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={`${s.len + 1} ${s.len + 1}`}
              strokeDashoffset={s.len + 1}
            />
          ))}
        </mask>
        <path d={data.fill} fill="currentColor" mask={`url(#hw-${id})`} />
      </svg>
    </span>
  );
}
