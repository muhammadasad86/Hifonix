import { lazy, Suspense, useMemo } from 'react';
import { supportsWebGL2 } from '../lib/webgl';
import { Fallback } from '../ui/Fallback';
import { Intro } from '../ui/Intro';
import { Overlay } from '../ui/Overlay';

const Experience = lazy(() => import('../scene/Experience').then((m) => ({ default: m.Experience })));

/** Approved Milestone-1/2 experience: storefront intro, facade, entry walk-through, studio. Unchanged. */
export default function Studio() {
  const webgl = useMemo(supportsWebGL2, []);
  if (!webgl) return <Fallback />;
  return (
    <>
      <Suspense fallback={null}>
        <Experience />
      </Suspense>
      <Overlay />
      <Intro />
    </>
  );
}
