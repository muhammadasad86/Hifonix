/** Headphones desktop story timeline, in screens of scroll (see HeadphonesStory.tsx). */
export const HP_STORY = {
  length: 12.95,
  /** Figma 1934:20663 → 20700: the photo zooms and turns into the grille */
  zoom: [0.15, 1.25],
  /** 1934:20700 → 24498 (2 s ease-out): the slider opens through a grille hole */
  circle: [1.15, 2.15],
  /** 24498 → 25302: categories 1–6 */
  slides: [2.35, 6.85],
  /** 25302 → 23214 (2 s ease-out): the halves part; "Going the extra mile…" */
  split: [6.85, 7.85],
  /** 23214 → 23360: "Community & Support" */
  extraNext: [8.25, 9.45],
  /** 23360 → 23511: the soft shots come forward */
  extraD: [9.75, 10.95],
  /** 23511 → 23924: the newsletter slides in from the right */
  newsIn: [11.25, 12.45],
} as const;
