/**
 * Asset slot registry.
 *
 * Every visual element that will eventually be replaced by a supplied model or
 * texture is registered here. While `src` is null the scene renders a
 * procedural placeholder; set `src` (path under /public) and the slot loads
 * the GLB/texture instead — no scene code changes required.
 *
 * Status: 'placeholder' | 'supplied' | 'final'
 */
export type SlotStatus = 'placeholder' | 'supplied' | 'final';

export interface ModelSlot {
  kind: 'model';
  src: string | null; // e.g. '/models/storefront/facade.glb'
  status: SlotStatus;
  note: string;
}

export interface TextureSlot {
  kind: 'texture';
  src: string | null; // e.g. '/textures/brand/hifonix-logo-white.png'
  status: SlotStatus;
  note: string;
}

export const ASSETS = {
  // ── Storefront ───────────────────────────────────────────────
  facadeModel: {
    kind: 'model',
    src: null,
    status: 'placeholder',
    note: 'Full facade GLB (optional). Until supplied, facade is built parametrically from config/world.ts.',
  },
  fasciaLogo: {
    kind: 'texture',
    src: 'textures/brand/hifonix-logo.png', // relative to BASE_URL
    status: 'supplied',
    note: 'Official Hifonix logo (supplied, 782×207 transparent PNG). Rendered unaltered; a ≥2048px version would sharpen close-ups.',
  },
  windowDisplayLeft: {
    kind: 'model',
    src: null,
    status: 'placeholder',
    note: 'Left window display (product/plinth). Placeholder plinth + blockout.',
  },
  windowDisplayRight: {
    kind: 'model',
    src: null,
    status: 'placeholder',
    note: 'Right window display. Placeholder plinth + blockout.',
  },
  // ── Interior (Milestone 2 — awaiting references) ─────────────
  interiorShell: {
    kind: 'model',
    src: null,
    status: 'placeholder',
    note: 'Studio interior architecture. Awaiting interior references.',
  },
} satisfies Record<string, ModelSlot | TextureSlot>;

export type AssetKey = keyof typeof ASSETS;
