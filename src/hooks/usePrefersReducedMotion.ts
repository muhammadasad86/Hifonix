import { useEffect } from 'react';
import { useExperience } from '../state/useExperience';

/** Syncs the OS `prefers-reduced-motion` setting into the experience store. */
export function useSyncReducedMotion() {
  const setReducedMotion = useExperience((s) => s.setReducedMotion);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [setReducedMotion]);
}
