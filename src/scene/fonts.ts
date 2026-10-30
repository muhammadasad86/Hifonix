/** Self-hosted static instances (OFL) for 3D text — no runtime font CDN. */
const base = import.meta.env.BASE_URL;
export const FONTS = {
  sans: `${base}fonts/Inter-500.ttf`,
  display: `${base}fonts/Cormorant-500.ttf`,
} as const;
