import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { easeInOut, easeOut, setVars, span, useScrollFrame, useScrollRootEl } from '../../ui/chrome/scroll';
import { ExtraMile, Newsletter } from '../hifi/sections';
import { extraMileVars } from '../landing/extraMile';
import { SplitSlides } from '../landing/SplitSlides';
import { show, useDecodeImages, useStoryGeometry } from '../landing/story';
import { HP_CATEGORIES, HP_CATEGORY_EYEBROW, HP_ZOOM } from './content';
import { HpHero } from './sections';
import { HP_STORY } from './storyTimeline';

/**
 * Desktop scroll story for the whole Headphones page (Figma prototype
 * "Headphone-Web.v5-1", 1934:20663 → 1934:24336). One sticky stage, one
 * timeline in screens of scroll (P) — every transition is scrubbed: it
 * follows the scroll, stops when scrolling stops, reverses when scrolling back.
 *
 *   0 → .15       hero holds
 *   .15 → 1.25    the photo zooms ×10.5 and turns 15° into the ear-cup grille
 *   1.15 → 2.15   the category slider opens through one grille hole (growing circle)
 *   2.35 → 6.85   categories 1–6 (pinned)
 *   6.85 → 7.85   the halves part left / right; "Going the extra mile…" settles in
 *   8.25 → 9.45   → "Community & Support"
 *   9.75 → 10.95  the soft shots come forward
 *   11.25 → 12.45 the newsletter slides in from the right
 *   12.45 → 12.95 settled, then the stage releases: newsletter and footer scroll on
 */
const n = HP_CATEGORIES.length;
type SceneId = 'hero' | 'brands' | 'extra' | 'news';

export function HeadphonesStory() {
  const root = useScrollRootEl();
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const imgWrap = useRef<HTMLDivElement>(null);
  const geo = useStoryGeometry(track);
  // hero photo box (relative to the stage) and the stage size — cached, re-measured on resize
  const box = useRef({ l: 0, t: 0, w: 1, h: 1, sw: 1, sh: 1 });
  const last = useRef({ tf: '', clip: '' });
  const [active, setActive] = useState(0);
  const [current, setCurrent] = useState<SceneId>('hero');
  useDecodeImages(stage);

  useEffect(() => {
    const st = stage.current;
    const w = imgWrap.current;
    if (!st || !w) return;
    const measure = () => {
      box.current = { l: w.offsetLeft, t: w.offsetTop, w: w.offsetWidth, h: w.offsetHeight, sw: st.clientWidth, sh: st.clientHeight };
      last.current = { tf: '', clip: '' };
      root?.current?.dispatchEvent(new Event('scroll'));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(st);
    ro.observe(w);
    return () => ro.disconnect();
  }, [root]);

  useScrollFrame((y) => {
    const st = stage.current;
    const wrap = imgWrap.current;
    if (!st || !wrap) return;
    const { top, vh } = geo.current;
    const P = (y - top) / vh;
    const T = HP_STORY;
    const s = (r: readonly [number, number]) => span(P, r[0], r[1]);

    const z = easeInOut(s(T.zoom));
    const cr = easeOut(s(T.circle));
    const sl = s(T.slides);
    const split = s(T.split);
    const bo = easeInOut(split);
    const a = easeOut(split);
    const c = easeOut(s(T.extraNext));
    const cd = easeOut(s(T.extraD));
    const de = easeInOut(s(T.newsIn));

    // 1 · zoom into the grille: the photo point under the hole travels to the hole
    // while the photo scales and turns about it (transform only — no layout)
    const { l, t, w, h, sw, sh } = box.current;
    const k = 1 + (HP_ZOOM.scale - 1) * z;
    const th = ((HP_ZOOM.turn * z) * Math.PI) / 180;
    const lx = HP_ZOOM.zoomPoint[0] * w;
    const ly = HP_ZOOM.zoomPoint[1] * h;
    const px = l + lx + (HP_ZOOM.hole[0] * sw - (l + lx)) * z;
    const py = t + ly + (HP_ZOOM.hole[1] * sh - (t + ly)) * z;
    const cos = Math.cos(th);
    const sin = Math.sin(th);
    const tx = px - l - k * (lx * cos - ly * sin);
    const ty = py - t - k * (lx * sin + ly * cos);
    const tf = z <= 0 ? '' : `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) rotate(${(HP_ZOOM.turn * z).toFixed(3)}deg) scale(${k.toFixed(4)})`;
    if (tf !== last.current.tf) {
      wrap.style.transform = tf;
      last.current.tf = tf;
    }

    // 2 · the slider opens through the hole as a growing circle
    const brands = st.querySelector<HTMLElement>('.hf-scene--brands');
    if (brands) {
      const cx = (HP_ZOOM.hole[0] + (HP_ZOOM.holeEnd[0] - HP_ZOOM.hole[0]) * cr) * sw;
      const cy = (HP_ZOOM.hole[1] + (HP_ZOOM.holeEnd[1] - HP_ZOOM.hole[1]) * cr) * sh;
      const far = Math.hypot(Math.max(cx, sw - cx), Math.max(cy, sh - cy)) * 1.02;
      const r = (3.5 * sh) / 1035 + (far - (3.5 * sh) / 1035) * cr;
      const clip = cr >= 1 ? 'none' : `circle(${r.toFixed(1)}px at ${cx.toFixed(1)}px ${cy.toFixed(1)}px)`;
      if (clip !== last.current.clip) {
        brands.style.clipPath = clip;
        last.current.clip = clip;
      }
    }

    // leaving the hero — as on Hi-Fi: the copy drifts up and away and the photo
    // darkens as the camera pushes in (--zoom, see .hp-story .hp-hero)
    setVars(st.querySelector<HTMLElement>('.hp-hero'), { '--zoom': z });
    setVars(st, { '--bi': 1, '--bo': bo, '--sl': sl, '--x': split > 0 ? 1 : 0, '--ni': de, '--z': z });
    setVars(st.querySelector<HTMLElement>('.hf-scene--extra'), extraMileVars(1, a, c, cd, de));

    // paint only what can be seen
    show(st, '.hf-scene--hero', cr < 1);
    show(st, '.hf-scene--brands', cr > 0 && bo < 1);
    show(st, '.hf-scene--extra', split > 0 && de < 1);
    show(st, '.hf-scene--news', de > 0);

    setActive(Math.min(n - 1, Math.floor(sl * n)));
    setCurrent(P < T.circle[0] + 0.5 ? 'hero' : P < T.split[0] + 0.5 ? 'brands' : de < 0.5 ? 'extra' : 'news');
  });

  const go = (i: number) => {
    const r = root?.current;
    if (!r) return;
    const { top, vh } = geo.current;
    const [a, b] = HP_STORY.slides;
    r.scrollTo({ top: top + (a + ((i + 0.5) / n) * (b - a)) * vh, behavior: 'smooth' });
  };

  return (
    <div ref={track} className="hf-story hp-story" style={{ '--len': HP_STORY.length } as CSSProperties}>
      <div ref={stage} className="hf-story__stage" data-current={current}>
        <ExtraMile staged />
        <HpHero staged imgWrap={imgWrap} />
        <SplitSlides
          id="hp-categories"
          label="Headphone categories"
          pagerLabel="Category"
          slides={HP_CATEGORIES}
          active={active}
          onGo={go}
          storyP={HP_STORY.slides[0] + 0.05}
          variant="dark"
          eyebrow={HP_CATEGORY_EYEBROW}
        />
        <Newsletter staged />
      </div>
    </div>
  );
}
