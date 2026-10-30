import { useCallback, useEffect, useState } from 'react';

/**
 * Splash entrance choreography (ms). Single source for JS stage timers and the
 * CSS custom properties consumed by splash.css.
 *
 *   intro  → logo zooms in and settles at viewport centre (black screen)
 *   lift   → logo travels up to its Figma position
 *   cards  → Artisan Audio enters from the left, Headphones from the right
 *   write  → titles are hand-written, then supporting copy rises in
 *   ready  → hover / tap reveals "Start exploring"
 */
export const SPLASH_TIMING = {
  zoom: 1300,
  hold: 400,
  lift: 1050,
  /** cards start this long after the lift begins */
  cardsDelay: 380,
  cards: 1350,
  /** pause between cards landing and the first stroke */
  writeGap: 120,
  write: 1500,
  /** second card's title starts this long after the first */
  stagger: 300,
  copy: 720,
} as const;

export type SplashStage = 'intro' | 'lift' | 'cards' | 'write' | 'ready';
const ORDER: SplashStage[] = ['intro', 'lift', 'cards', 'write', 'ready'];

const T = SPLASH_TIMING;
const AT: Record<Exclude<SplashStage, 'intro'>, number> = {
  lift: T.zoom + T.hold,
  cards: T.zoom + T.hold + T.cardsDelay,
  write: T.zoom + T.hold + T.cardsDelay + T.cards + T.writeGap,
  ready: T.zoom + T.hold + T.cardsDelay + T.cards + T.writeGap + T.stagger + T.write,
};

/** CSS custom properties mirroring SPLASH_TIMING. */
export const SPLASH_TIMING_VARS = Object.fromEntries(
  Object.entries(T).map(([k, v]) => [`--t-${k}`, `${v}ms`]),
) as Record<string, string>;

/** Boolean data-attributes for every stage reached (CSS can't compare stage order). */
export function stageAttrs(stage: SplashStage) {
  const i = ORDER.indexOf(stage);
  const on = (s: SplashStage) => (i >= ORDER.indexOf(s) ? '' : undefined);
  return { 'data-lift': on('lift'), 'data-cards': on('cards'), 'data-write': on('write'), 'data-ready': on('ready') };
}

/** Drives the stage machine. Reduced motion → straight to `ready` (CSS fades only). */
export function useSplashSequence(reducedMotion: boolean) {
  const [stage, setStage] = useState<SplashStage>('intro');

  useEffect(() => {
    if (reducedMotion) {
      setStage('ready');
      return;
    }
    const ids = (Object.keys(AT) as (keyof typeof AT)[]).map((s) =>
      // never step backwards (e.g. after a skip)
      window.setTimeout(() => setStage((p) => (ORDER.indexOf(s) > ORDER.indexOf(p) ? s : p)), AT[s]),
    );
    return () => ids.forEach((id) => window.clearTimeout(id));
  }, [reducedMotion]);

  const skip = useCallback(() => setStage('ready'), []);
  return { stage, skip };
}
