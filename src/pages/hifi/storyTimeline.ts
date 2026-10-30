/** Desktop story timeline, in screens of scroll (see Story.tsx for the sequence). */
export const STORY = {
  length: 15.3,
  elevateIn: [-0.92, -0.08],
  brandsIn: [0.35, 1.35],
  slides: [1.35, 4.55],
  brandsOut: [4.55, 5.55],
  headfiText: [5.25, 6.05],
  dissolve: [6.35, 7.55],
  toBlack: [7.95, 8.95],
  /** Figma 3647:12567 → 12580 (smart animate, ease-out) */
  extraIn: [8.95, 10.05],
  /** Figma 3647:12580 → 12637 after its 0.8 s hold */
  extraNext: [10.55, 11.75],
  /** Figma 1934:23301 → 23419: the soft shots come forward */
  extraD: [12.05, 13.25],
  /** Figma 1934:23419 → 23760: the newsletter slides in from the right */
  newsIn: [13.55, 14.75],
} as const;
