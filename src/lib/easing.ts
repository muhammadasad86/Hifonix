export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

/** Gentle start, long settle — reads as a person walking then slowing. */
export const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/** Blend of sine + cubic: softer launch than cubic, firmer arrival than sine. */
export const easeCinematic = (t: number) => 0.45 * easeInOutSine(t) + 0.55 * easeInOutCubic(t);

/** Frame-rate independent exponential damping factor. */
export const damp = (lambda: number, dt: number) => 1 - Math.exp(-lambda * dt);
