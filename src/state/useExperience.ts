import { create } from 'zustand';

export type Phase = 'exterior' | 'entering' | 'interior' | 'exiting';

interface ExperienceState {
  phase: Phase;
  /** 0 → 1 progress of the active camera transition (for UI sync). */
  progress: number;
  doorOpen: boolean;
  hoverEntrance: boolean;
  reducedMotion: boolean;
  /** Full-screen logo intro has finished (once per page load). */
  introDone: boolean;
  /** Storefront signage (and its textures) are on screen. */
  sceneReady: boolean;
  enter: () => void;
  exit: () => void;
  setProgress: (p: number) => void;
  finishTransition: () => void;
  setHoverEntrance: (v: boolean) => void;
  setReducedMotion: (v: boolean) => void;
  finishIntro: () => void;
  setSceneReady: (v: boolean) => void;
}

export const useExperience = create<ExperienceState>((set, get) => ({
  phase: 'exterior',
  progress: 0,
  doorOpen: false,
  hoverEntrance: false,
  reducedMotion: false,
  introDone: false,
  sceneReady: false,

  enter: () => {
    if (get().phase !== 'exterior' || !get().introDone) return;
    set({ phase: 'entering', progress: 0, doorOpen: true, hoverEntrance: false });
  },
  exit: () => {
    if (get().phase !== 'interior') return;
    set({ phase: 'exiting', progress: 0, doorOpen: true });
  },
  setProgress: (progress) => set({ progress }),
  finishTransition: () => {
    const { phase } = get();
    if (phase === 'entering') set({ phase: 'interior', progress: 1, doorOpen: false });
    if (phase === 'exiting') set({ phase: 'exterior', progress: 1, doorOpen: false });
  },
  setHoverEntrance: (hoverEntrance) => set({ hoverEntrance }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  finishIntro: () => set({ introDone: true }),
  setSceneReady: (sceneReady) => set({ sceneReady }),
}));

// Dev/test hook: lets automated browser tests drive and inspect the experience.
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as unknown as { __hifonix: typeof useExperience }).__hifonix = useExperience;
}
