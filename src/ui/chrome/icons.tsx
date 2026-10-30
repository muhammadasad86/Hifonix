/**
 * Figma icon slots (Header.v4 / bottom bar / footer). Each SVG is used at its
 * Figma frame size; `inset` reproduces Figma's stroke bleed so the exported
 * file keeps its own width/height.
 */
const A = '/hifi';

interface Spec {
  src: string;
  w: number;
  h: number;
  inset?: string;
}

export const ICONS = {
  youtube: { src: `${A}/icon-youtube.svg`, w: 28.37, h: 20, inset: '-3.75% -2.64%' },
  tiktok: { src: `${A}/icon-tiktok.svg`, w: 16, h: 20, inset: '-3.75% -4.69%' },
  // Figma renders this as a Font Awesome Brands glyph () — FA Free SVG of the same glyph
  whatsappGlyph: { src: `${A}/fa-whatsapp.svg`, w: 17.5, h: 20 },
  facebook: { src: `${A}/icon-facebook.svg`, w: 11, h: 20, inset: '-3.75% -6.81% -3.75% -6.82%' },
  instagram: { src: `${A}/icon-instagram.svg`, w: 20, h: 20, inset: '-3.75%' },
  email: { src: `${A}/icon-email.svg`, w: 20, h: 16, inset: '-6.25% -5%' },
  phone: { src: `${A}/icon-phone.svg`, w: 14.4, h: 16, inset: '-5% -5.56%' },
  whatsapp: { src: `${A}/icon-whatsapp.png`, w: 16, h: 16 },
  globe: { src: `${A}/icon-globe.svg`, w: 20, h: 20, inset: '-5%' },
} satisfies Record<string, Spec>;

/** Figma CSS inset shorthand (1/2/4 values, %) → explicit box (replaced elements don't stretch on inset). */
function box(inset = '0') {
  const v = inset.split(/\s+/).map((x) => parseFloat(x) || 0);
  const [t, r, b, l] = v.length === 1 ? [v[0], v[0], v[0], v[0]] : v.length === 2 ? [v[0], v[1], v[0], v[1]] : v;
  return { top: `${t}%`, left: `${l}%`, width: `${100 - l - r}%`, height: `${100 - t - b}%` };
}

export function Icon({ name, className }: { name: keyof typeof ICONS; className?: string }) {
  const s: Spec = ICONS[name];
  return (
    <span className={`hf-ico ${className ?? ''}`} style={{ width: s.w, height: s.h }} aria-hidden="true">
      <img src={s.src} alt="" style={box(s.inset)} />
    </span>
  );
}

/** Vertical 16px rule (Figma "Line 3", rotated 90°). */
export function Rule() {
  return (
    <span className="hf-rule" aria-hidden="true">
      <img src={`${A}/divider.svg`} alt="" />
    </span>
  );
}
