/**
 * Shared-image hand-off between routes (splash card → landing hero).
 *
 * `beginImageHandoff` lifts the source image into a fixed overlay that looks
 * exactly like the card (same crop, same gradient). The destination page
 * calls `takeImageHandoff` on mount and `landImageHandoff` with its own
 * geometry; the overlay then expands — clip grows from the card to the hero,
 * the photo scales into the hero's crop — and dissolves into the real hero
 * image underneath. No reload, no flash: it is one continuous picture.
 */
export interface ImageHandoff {
  key: string;
  landing?: Promise<void>;
  overlay: HTMLDivElement;
  img: HTMLImageElement;
  shade: HTMLDivElement;
  from: { clip: DOMRect; img: DOMRect };
}

let pending: ImageHandoff | null = null;

const px = (n: number) => `${n.toFixed(2)}px`;
const inset = (r: DOMRect | { top: number; left: number; width: number; height: number }) =>
  `inset(${px(r.top)} ${px(window.innerWidth - r.left - r.width)} ${px(window.innerHeight - r.top - r.height)} ${px(r.left)})`;

export function beginImageHandoff(key: string, clip: DOMRect, source: HTMLImageElement, shade?: string) {
  cancelImageHandoff();
  const imgRect = source.getBoundingClientRect();
  const overlay = document.createElement('div');
  overlay.setAttribute('aria-hidden', 'true');
  Object.assign(overlay.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '1000',
    pointerEvents: 'none',
    clipPath: inset(clip),
    contain: 'strict',
  } as CSSStyleDeclaration);
  const img = document.createElement('img');
  img.src = source.currentSrc || source.src;
  img.alt = '';
  Object.assign(img.style, {
    position: 'absolute',
    left: px(imgRect.left),
    top: px(imgRect.top),
    width: px(imgRect.width),
    height: px(imgRect.height),
    maxWidth: 'none',
    objectFit: 'cover',
  } as CSSStyleDeclaration);
  const shadeEl = document.createElement('div');
  Object.assign(shadeEl.style, {
    position: 'absolute',
    left: px(imgRect.left),
    top: px(imgRect.top),
    width: px(imgRect.width),
    height: px(imgRect.height),
    background: shade ?? 'none',
  } as CSSStyleDeclaration);
  overlay.append(img, shadeEl);
  document.body.append(overlay);
  pending = { key, overlay, img, shade: shadeEl, from: { clip, img: imgRect } };
}

/**
 * Destination: the pending hand-off for `key`, if any. Non-destructive, so a
 * StrictMode double render/effect sees the same object; `releaseImageHandoff`
 * clears it.
 */
export function peekImageHandoff(key: string): ImageHandoff | null {
  return pending && pending.key === key ? pending : null;
}

export function cancelImageHandoff() {
  pending?.overlay.remove();
  pending = null;
}

/** Expands the overlay into `clip` / `img` (viewport rects), then dissolves it. */
export function landImageHandoff(h: ImageHandoff, clip: DOMRect, img: DOMRect, duration = 1150): Promise<void> {
  if (h.landing) return h.landing; // idempotent (StrictMode re-runs effects)
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = 'cubic-bezier(0.7, 0, 0.18, 1)';
  const d = reduced ? 1 : duration;
  const box = (r: DOMRect) => ({ left: px(r.left), top: px(r.top), width: px(r.width), height: px(r.height) });
  const anims = [
    h.overlay.animate([{ clipPath: inset(h.from.clip) }, { clipPath: inset(clip) }], { duration: d, easing: ease, fill: 'forwards' }),
    h.img.animate([box(h.from.img), box(img)], { duration: d, easing: ease, fill: 'forwards' }),
    h.shade.animate([box(h.from.img), { ...box(img), opacity: 0 }], { duration: d, easing: ease, fill: 'forwards' }),
  ];
  h.landing = Promise.all(anims.map((a) => a.finished))
    .catch(() => undefined)
    .then(() => undefined);
  return h.landing;
}

/** Final step: fade the overlay away once the real hero image is visible beneath it. */
export function releaseImageHandoff(h: ImageHandoff, duration = 260) {
  if (pending === h) pending = null;
  const a = h.overlay.animate([{ opacity: 1 }, { opacity: 0 }], { duration, easing: 'ease-out', fill: 'forwards' });
  a.finished.finally(() => h.overlay.remove());
}
