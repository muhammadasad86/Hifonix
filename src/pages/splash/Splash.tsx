import { type CSSProperties, useCallback, useEffect, useState } from 'react';
import { navigate } from '../../router';
import { useExperience } from '../../state/useExperience';
import { BottomBar } from '../../ui/chrome/BottomBar';
import { beginImageHandoff } from '../../ui/transition/imageHandoff';
import { SPLASH_CARDS, type SplashCardData } from './content';
import { SPLASH_TIMING_VARS, stageAttrs, useSplashSequence } from './sequence';
import { SplashCard } from './SplashCard';
import '../../ui/chrome/chrome.css';
import './splash.css';

/** Ms the rest of the splash takes to clear before the shared image expands. */
const LEAVE_MS = 420;

/** Splash / category chooser — Figma "Splash-Web2" (node 1-4329). Route: ROUTES.splash. */
export default function Splash() {
  const reducedMotion = useExperience((s) => s.reducedMotion);
  const { stage, skip } = useSplashSequence(reducedMotion);
  const [active, setActive] = useState<SplashCardData['id'] | null>(null);
  const [leaving, setLeaving] = useState<SplashCardData['id'] | null>(null);
  const ready = stage === 'ready';
  const attrs = stageAttrs(stage);

  useEffect(() => {
    const prev = document.title;
    document.title = 'Hifonix Studios — For the love of music';
    return () => {
      document.title = prev;
    };
  }, []);

  // warm the Hi-Fi landing chunk + hero photo so the hand-off never waits on the network
  useEffect(() => {
    if (!ready) return;
    import('../hifi/HiFiLanding').catch(() => {});
    import('../headphones/HeadphonesLanding').catch(() => {});
  }, [ready]);

  // Esc / Enter / Space skip the entrance (repeat visitors, reviewers)
  useEffect(() => {
    if (ready) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') skip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ready, skip]);

  const explore = useCallback(
    (card: SplashCardData, el: { card: HTMLElement; img: HTMLImageElement | null }) => {
      if (leaving) return true;
      setLeaving(card.id);
      if (card.handoff && el.img) {
        beginImageHandoff(card.handoff.key, el.card.getBoundingClientRect(), el.img, card.handoff.shade);
      }
      window.setTimeout(() => navigate(card.to), reducedMotion ? 0 : LEAVE_MS);
      return true;
    },
    [leaving, reducedMotion],
  );

  return (
    <div
      className="splash"
      {...attrs}
      data-leaving={leaving ?? undefined}
      style={SPLASH_TIMING_VARS as CSSProperties}
      onPointerUp={(e) => {
        if (!(e.target as HTMLElement).closest('.splash-card')) setActive(null);
      }}
    >
      <div className="splash__stage">
        <h1 className="splash__logo">
          <span className="splash__logo-in">
            <img className="splash__logo-mark" src="/hifi/logo-mark.svg" alt="" />
            <img className="splash__logo-word" src="/hifi/logo-word.svg" alt="" />
          </span>
          <span className="sr-only">Hifonix Studios</span>
        </h1>
        <main className="splash__cards">
          {SPLASH_CARDS.map((c, i) => (
            <SplashCard
              key={c.id}
              card={c}
              index={i}
              active={active === c.id}
              writing={attrs['data-write'] !== undefined}
              interactive={ready && !leaving}
              onActivate={setActive}
              onExplore={explore}
            />
          ))}
        </main>
      </div>
      <BottomBar variant="glass" className="splash__bar" />
    </div>
  );
}
