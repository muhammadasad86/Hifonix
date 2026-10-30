# Hifonix — The Listening Studio

Immersive 3D storefront → studio experience. React 18 · TypeScript · Three.js · React Three Fiber · Drei · Vite.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

## Status — Milestone 1 (storefront + cinematic entry)

| Area | State |
|---|---|
| Facade | Parametric placeholder (UK shopfront typology) — awaiting storefront reference |
| Entry | Camera path through the recessed lobby and hinged door into the interior; door closes behind |
| Interior | Neutral placeholder shell, Hi-Fi left / Head-Fi right blockouts — awaiting interior references |
| A11y | `Enter` / `Esc`, real buttons, live region, `prefers-reduced-motion` → short veil cut, WebGL2 fallback page |

## Structure

```
src/
  config/      world.ts (all dimensions) · shots.ts (camera + timings) · assets.ts (asset slots)
  state/       useExperience.ts — phase machine: exterior → entering → interior → exiting
  scene/
    Experience.tsx       Canvas, renderer, dusk sky, Lightformer environment
    CameraRig.tsx        resting shots, entry/exit path, damped look-around
    Block.tsx            min/max box primitive with world-scaled UVs
    materials.ts         shared material library + PALETTE
    storefront/          Shopfront · EntranceDoor · UpperStorey · Street · Storefront
    interior/            PlaceholderInterior (replaced in Milestone 2)
  ui/          Overlay (HUD, CTA) · Fallback (no-WebGL)
  styles/      tokens.css (colour, type, space, motion) · global.css
public/
  fonts/       Inter + Cormorant Garamond (OFL, self-hosted, subset)
  models/      GLB slots — see README inside
  textures/    brand + PBR slots — see README inside
```

## Swapping assets

1. Put the file in `public/models/…` or `public/textures/…`.
2. Set `src` on the matching entry in `src/config/assets.ts`.
3. Proportions of the parametric facade live in `src/config/world.ts`.

## Dev hook

In dev builds `window.__hifonix` exposes the store (`__hifonix.getState().enter()`), used by automated browser tests.

## Motion system (splash → Hi-Fi landing)

- **Hand-written titles** — `src/ui/handwriting/`. `titles.ts` is generated from the Cintarini font by
  `python3 scripts/handwriting/generate.py` (fontTools, Pillow, scikit-image, scipy): glyph outlines + pen
  strokes traced from the letter skeletons, revealed stroke by stroke via an SVG mask. Add a title to
  `TITLES` in the script and re-run to get a new one.
- **Splash → hero image hand-off** — `src/ui/transition/imageHandoff.ts`. Only the "Start exploring"
  button navigates; the Artisan Audio photo expands into the Hi-Fi hero.
- **Scroll-linked sections** — `useScrollProgress` in `src/ui/chrome/scroll.ts` writes `--p` / `--q`
  (enter / exit progress) per frame; CSS maps them to transforms. Motion follows the scroll position exactly.
- **360° headphone** — `src/pages/hifi/Headphone360.tsx`. Uses a procedural three.js stand-in until a real
  model exists: put it at `public/models/headphone.glb` and set `MODEL_URL` in that file.
- **Map** — keyless Google Maps embed centred on the UAE (`MAP_EMBED` in `sections.tsx`). For a styled map
  (custom colours, branded marker) add a Maps JavaScript API key as `VITE_GOOGLE_MAPS_KEY`.

## Shop, demo checkout & CMS

Routes: `/splash` (start — `/` and every logo redirect here) · `/shop/:department` · `/collections/:handle` · `/brands` ·
`/brands/:handle` · `/products/:handle` · `/cart` · `/checkout` · `/checkout/confirmation` · `/admin` (CMS, not linked, noindex).

**Data layer** (`src/commerce/`) — the UI only talks to two interfaces in `types.ts`:
- `CatalogService` → `cms.ts` (Supabase, when configured) or `demo/` (bundled sample catalogue).
- `CartService` → `localCart.ts` (browser-local demo cart; survives refresh and navigation).
Product / variant / cart shapes mirror Shopify's Storefront API, so Shopify is added later as a third adapter
(`catalog` + `cartService` in `index.ts`) without touching pages.

**Demo checkout** — `/checkout` validates contact + delivery locally, takes **no payment**, sends nothing,
clears the cart and shows a demo confirmation. Every shop page shows a dismissible "Demo store" notice.

### CMS setup (Supabase, free tier)
1. Create a project at supabase.com.
2. SQL Editor → paste `supabase/schema.sql`, change `you@example.com` to your admin email, Run.
   Creates `products` (+ the current sample catalogue as seed rows), `admins`, row-level security and the
   public `product-images` storage bucket.
3. Authentication → Users → **Add user** with that email + a password (tick *Auto confirm user*).
   Authentication → Sign In / Providers: you can switch off public sign-ups — admins are added here.
4. Project Settings → API → copy **Project URL** and **anon public** key into `.env.local` (see `.env.example`)
   and into Vercel's environment variables; restart `npm run dev` / redeploy.
5. Open `/admin`, sign in. Add / edit products, upload / reorder / remove images (resized to WebP in the browser,
   stored in Supabase Storage), set price, options, specs, department, categories, brand, availability;
   **Preview page** before publishing. Only *Published* products appear on the storefront.

Security: only the anon key ships to browsers. Writes need a Supabase Auth session whose email is in
`public.admins` (enforced in Postgres by RLS, not by the UI). No service_role key is used anywhere.
`npm run cms:seed` regenerates the seed SQL from the sample catalogue.

## Deploy (Vercel)
`vercel.json` builds with `npm run build` → `dist/` and rewrites every non-file route to `index.html`,
so `/splash`, `/products/…` etc. survive refresh / direct links. Set the two `VITE_SUPABASE_*` variables
in the Vercel project before building to use the CMS.
