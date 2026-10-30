import { useEffect, useRef } from 'react';
import { ScrollRoot, useMediaQuery, useReducedMotion, useSmoothWheel } from '../../ui/chrome/scroll';
import { SiteChrome } from '../../ui/chrome/SiteChrome';
import { SiteFooter } from '../../ui/chrome/SiteFooter';
import { Art, BrandSlider, Elevate, ExtraMile, HeadFi, Hero, LogoStrip, Newsletter } from './sections';
import { Story } from './Story';
import './hifi.css';

/** Hi-Fi landing page — Figma "Artisan Audio-Web" (node 1-4435). Route: ROUTES.hiFi. */
export default function HiFiLanding() {
  const root = useRef<HTMLDivElement>(null);
  // desktop: sections 2–6 play as one pinned, scroll-scrubbed story;
  // tablet / phone / reduced motion: the same sections in normal flow
  const desktop = useMediaQuery('(min-width: 1024px) and (min-height: 560px)');
  const reduced = useReducedMotion();
  const story = desktop && !reduced;
  useSmoothWheel(root, !reduced);
  useEffect(() => {
    const prev = document.title;
    document.title = 'Hi-Fi — Hifonix Studios';
    // the other landing page is one tab away: warm its chunk so switching never waits
    import('../headphones/HeadphonesLanding').catch(() => {});
    return () => {
      document.title = prev;
    };
  }, []);
  return (
    <ScrollRoot.Provider value={root}>
      <div ref={root} className="hf">
        <SiteChrome />
        <main>
          <Hero />
          <LogoStrip />
          {story ? (
            <Story />
          ) : (
            <>
              <Elevate />
              <BrandSlider />
              <HeadFi />
              <Art />
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
