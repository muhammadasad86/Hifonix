import { type CSSProperties, useRef, useState } from 'react';
import { easeInOut, easeOut, setVars, span, useScrollFrame, useScrollRootEl } from '../../ui/chrome/scroll';
import { extraMileVars } from '../landing/extraMile';
import { SplitSlides } from '../landing/SplitSlides';
import { show, useDecodeImages, useStoryGeometry } from '../landing/story';
import { BRAND_SLIDES } from './content';
import { STORY } from './storyTimeline';
import { Art, Elevate, ExtraMile, HeadFi, Newsletter } from './sections';

/**
 * Desktop scroll story for sections 2–6 (Figma prototype "Artisan Audio-Web.v5").
 *
 * One tall scroll track with a single sticky full-viewport stage. Every scene
 * is stacked inside the stage and driven by ONE timeline measured in screens
 * of scroll (P), so transitions are scrubbed — they follow the scroll exactly,
 * stop when scrolling stops and reverse when scrolling back.
 *
 *   P −1 → 0     stage scrolls in; Elevate's copy / headphone split in
 *   0 → .35      Elevate holds (pinned)
 *   .35 → 1.35   Brands enter OVER Elevate: left half from the left, right half from
 *                the right; Elevate pushes into the headphone and dims behind them
 *   1.35 → 4.55  brand slides 1–4 (Aavik, Mysphere, EvoOne, Manley)
 *   4.55 → 5.55  Brands split open (left → left, right → right); Head-Fi rises from
 *                below and resolves from blur
 *   5.25 → 6.05  Head-Fi copy writes in line by line, then holds
 *   6.35 → 7.55  Head-Fi dissolves (opacity, focus, scale) into The Art of Headphone
 *                Listening, whose copy and stands settle in
 *   7.55 → 7.95  Art holds
 *   7.95 → 8.95  Art fades (and blurs) to black; the two collage shots surface
 *                small, soft and faint (Figma 3647:12567)
 *   8.95 → 10.05 shots grow and sharpen into place; "Going the extra mile…"
 *                fades in (3647:12580)
 *  10.05 → 10.55 hold
 *  10.55 → 11.75 shots grow again; the copy dissolves into "Community &
 *                Support"; two soft shots surface behind it (3647:12637)
 *  12.05 → 13.25 the first shots grow away and fade; the soft shots sharpen and
 *                come forward (Figma 1934:23419)
 *  13.55 → 14.75 everything grows and dissolves as the newsletter panel slides in
 *                from the right (1934:23760)
 *  14.75 → 15.3  settled, then the stage releases: newsletter and footer scroll on
 */


const n = BRAND_SLIDES.length;
type SceneId = 'elevate' | 'brands' | 'headfi' | 'art' | 'extra' | 'news';

export function Story() {
  const root = useScrollRootEl();
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const geo = useStoryGeometry(track);
  const [active, setActive] = useState(0);
  const [current, setCurrent] = useState<SceneId>('elevate');
  useDecodeImages(stage);

  useScrollFrame((y) => {
    const st = stage.current;
    if (!st) return;
    const { top, vh } = geo.current;
    const P = (y - top) / vh; // screens into the story (negative while the stage scrolls in)
    const T = STORY;
    const s = (r: readonly [number, number]) => span(P, r[0], r[1]);

    const e = easeOut(s(T.elevateIn));
    const bi = easeInOut(s(T.brandsIn));
    const sl = s(T.slides);
    const bo = easeInOut(s(T.brandsOut));
    const tp = easeOut(s(T.headfiText));
    const d = easeInOut(s(T.dissolve));
    const x = s(T.toBlack);
    const a = easeOut(s(T.extraIn));
    const c = easeOut(s(T.extraNext));
    const cd = easeOut(s(T.extraD));
    const de = easeInOut(s(T.newsIn));

    setVars(st, {
      '--e': e,
      '--bi': bi,
      '--bo': bo,
      '--sl': sl,
      '--tp': tp,
      '--d': d,
      '--x': x,
      '--ni': de,
    });
    // scenes reuse their flow-mode CSS vars
    setVars(st.querySelector<HTMLElement>('.hf-scene--elevate'), { '--p': e, '--q': 0 });
    setVars(st.querySelector<HTMLElement>('.hf-scene--headfi'), { '--p': bo, '--q': 0 });
    setVars(st.querySelector<HTMLElement>('.hf-scene--art'), {
      '--p': easeOut(span(d, 0.42, 1)),
      '--h': easeOut(span(d, 0.3, 1)),
      '--q': easeInOut(span(x, 0, 0.55)),
    });
    setVars(st.querySelector<HTMLElement>('.hf-scene--extra'), extraMileVars(easeOut(span(x, 0.3, 1)), a, c, cd, de));

    // Paint only what can be seen: scenes that are fully transparent (their
    // opacity gates above) or fully covered are skipped entirely — identical
    // pixels, far less raster work per frame.
    const covered = bi >= 1 && bo <= 0;
    show(st, '.hf-scene--elevate', bi < 1);
    show(st, '.hf-scene--headfi', bi > 0.97 && !covered && d < 1);
    show(st, '.hf-scene--art', d > 0 && x < 0.6);
    show(st, '.hf-scene--extra', x > 0 && de < 1);
    show(st, '.hf-scene--news', de > 0);

    setActive(Math.min(n - 1, Math.floor(sl * n)));
    setCurrent(
      P < T.brandsIn[0] + 0.5
        ? 'elevate'
        : P < T.brandsOut[0] + 0.5
          ? 'brands'
          : P < T.dissolve[0] + 0.6
            ? 'headfi'
            : P < T.toBlack[0] + 0.5
              ? 'art'
              : de < 0.5
                ? 'extra'
                : 'news',
    );
  });

  // pager: scroll to the middle of a brand's slot
  const go = (i: number) => {
    const r = root?.current;
    if (!r) return;
    const { top, vh } = geo.current;
    const [a, b] = STORY.slides;
    r.scrollTo({ top: top + (a + ((i + 0.5) / n) * (b - a)) * vh, behavior: 'smooth' });
  };

  return (
    <div ref={track} className="hf-story" style={{ '--len': STORY.length } as CSSProperties}>
      <div ref={stage} className="hf-story__stage" data-current={current}>
        <Elevate staged />
        <ExtraMile staged />
        <Art staged />
        <HeadFi staged />
        <SplitSlides
          id="hf-brands"
          label="Featured brands"
          pagerLabel="Brand"
          slides={BRAND_SLIDES}
          active={active}
          onGo={go}
          storyP={STORY.slides[0] + 0.05}
        />
        <Newsletter staged />
      </div>
    </div>
  );
}
