import { useEffect, useRef } from 'react';
import { ScrollRoot, useMediaQuery, useReducedMotion, useSmoothWheel } from '../../ui/chrome/scroll';
import { SiteChrome } from '../../ui/chrome/SiteChrome';
import { SiteFooter } from '../../ui/chrome/SiteFooter';
import { ExtraMile, Newsletter } from '../hifi/sections';
import { HeadphonesStory } from './HeadphonesStory';
import { CategoryStack, HpHero } from './sections';
import '../hifi/hifi.css';
import './headphones.css';

/** Headphones landing page — Figma prototype "Headphone-Web.v5-1" (1934:20663). Route: ROUTES.headphones. */
export default function HeadphonesLanding() {
  const root = useRef<HTMLDivElement>(null);
  // desktop: the whole page plays as one pinned, scroll-scrubbed story;
  // tablet / phone / reduced motion: the same sections in normal flow
  const desktop = useMediaQuery('(min-width: 1024px) and (min-height: 560px)');
  const reduced = useReducedMotion();
  const story = desktop && !reduced;
  useSmoothWheel(root, !reduced);
  useEffect(() => {
    const prev = document.title;
    document.title = 'Headphones — Hifonix Studios';
    // the other landing page is one tab away: warm its chunk so switching never waits
    import('../hifi/HiFiLanding').catch(() => {});
    return () => {
      document.title = prev;
    };
  }, []);
  return (
    <ScrollRoot.Provider value={root}>
      <div ref={root} className="hf hp">
        <SiteChrome />
        <main>
          {story ? (
            <HeadphonesStory />
          ) : (
            <>
              <HpHero />
              <CategoryStack />
              <ExtraMile />
              <Newsletter />
            </>
          )}
        </main>
        <SiteFooter />
      </div>
    </ScrollRoot.Provider>
  );
}
