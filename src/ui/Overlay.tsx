import { useEffect } from 'react';
import { useExperience } from '../state/useExperience';
import { LOGO_SRC } from './brand';
import './overlay.css';

const SITE = 'https://hifonix.co.uk/';

function Arrow() {
  return (
    <svg className="arrow" width="18" height="10" viewBox="0 0 18 10" aria-hidden="true">
      <path d="M0 5h16M12 1l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

export function Overlay() {
  const phase = useExperience((s) => s.phase);
  const hover = useExperience((s) => s.hoverEntrance);
  const enter = useExperience((s) => s.enter);
  const exit = useExperience((s) => s.exit);
  const introDone = useExperience((s) => s.introDone);

  // Keyboard: Enter → step inside, Escape → step outside.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest('button, a, input, textarea')) return;
      if (e.key === 'Enter') enter();
      if (e.key === 'Escape') exit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enter, exit]);

  const moving = phase === 'entering' || phase === 'exiting';
  const announce =
    phase === 'entering'
      ? 'Entering the Hifonix studio'
      : phase === 'interior'
        ? 'You are inside the studio. Hi-Fi is on the left, Head-Fi on the right.'
        : phase === 'exiting'
          ? 'Stepping outside'
          : 'Outside the Hifonix storefront';

  return (
    <div className="overlay" data-phase={phase} data-moving={moving || undefined} data-intro={!introDone || undefined}>
      <header className="topbar">
        <a className="wordmark" href={SITE} aria-label="Hifonix home (opens hifonix.co.uk)">
          <img src={LOGO_SRC} alt="Hifonix" width={782} height={207} />
        </a>
        <div className="topbar__end">
          <button
            type="button"
            className="ghost"
            onClick={exit}
            tabIndex={phase === 'interior' ? 0 : -1}
            aria-hidden={phase !== 'interior'}
            data-show={phase === 'interior' || undefined}
          >
            Step outside
          </button>
          <a className="sitelink" href={SITE} target="_blank" rel="noreferrer">
            hifonix.co.uk <span aria-hidden="true">↗</span>
          </a>
        </div>
      </header>

      <section className="intro" aria-hidden={phase !== 'exterior' || !introDone} data-show={(phase === 'exterior' && introDone) || undefined}>
        <p className="eyebrow">396 Birmingham Road · Sutton Coldfield</p>
        <h1 className="headline">Elevated Audio Realism</h1>
        <p className="lede">Hi-Fi and Head-Fi specialists. Open Monday to Saturday, 10am – 6pm.</p>
      </section>

      <div className="cta" data-show={(phase === 'exterior' && introDone) || undefined}>
        <button
          type="button"
          className="enter"
          data-hover={hover || undefined}
          onClick={enter}
          tabIndex={phase === 'exterior' && introDone ? 0 : -1}
          aria-hidden={phase !== 'exterior' || !introDone}
        >
          <span>Step inside</span>
          <Arrow />
        </button>
        <p className="hint">
          or click the door <kbd>Enter ↵</kbd>
        </p>
      </div>

      <div className="interior-note" data-show={phase === 'interior' || undefined} aria-hidden={phase !== 'interior'}>
        <span className="chip">Studio interior · placeholder</span>
        <span className="hint">Move to look around · <kbd>Esc</kbd> to step outside</span>
      </div>

      <div id="veil" className="veil" aria-hidden="true" />
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}
