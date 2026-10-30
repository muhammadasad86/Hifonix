import { MENU_CATEGORIES, type MenuCategory } from './navigation';

/**
 * Shop taxonomy, routes and editorial (site-owned) content for the shopping
 * pages. Product data comes from the commerce layer (src/commerce); this file
 * only holds what the Figma design adds around it: hero photography, gallery
 * strips, brand tiles / logos, category thumbnails.
 *
 * Routes (all client-side, deep-linkable):
 *   /shop/:department        product listing      (Figma Product-listing v5-2)
 *   /collections/:handle     category page        (Figma Category-listing v5-3)
 *   /brands                  brands A–Z           (Figma "Brands" 2155:86253)
 *   /brands/:handle          brand page           (Figma Brands-listing v5-3)
 *   /products/:handle        product detail       (Figma PDP v5-3-2)
 *   /cart                    view cart            (Figma View-Cart v5-2)
 *   /checkout(/confirmation) demonstration checkout (Figma Checkout / Thank you)
 */
export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/[()®]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const SHOP_ROUTES = {
  department: (id: string) => `/shop/${id}`,
  collection: (handle: string) => `/collections/${handle}`,
  brands: '/brands',
  brand: (handle: string) => `/brands/${handle}`,
  product: (handle: string) => `/products/${handle}`,
  cart: '/cart',
  checkout: '/checkout',
  confirmation: '/checkout/confirmation',
} as const;

export type RouteMatch =
  | { page: 'department'; id: string }
  | { page: 'collection'; handle: string }
  | { page: 'brands' }
  | { page: 'brand'; handle: string }
  | { page: 'product'; handle: string }
  | { page: 'cart' }
  | { page: 'checkout' }
  | { page: 'confirmation' };

/** Resolves a path to a shop page, or null when it is not a shop route. */
export function matchShopRoute(path: string): RouteMatch | null {
  const [, a, b, extra] = path.split('/');
  if (a === 'checkout' && b === 'confirmation' && extra === undefined) return { page: 'confirmation' };
  if (extra !== undefined) return null;
  if (a === 'shop' && b) return { page: 'department', id: b };
  if (a === 'collections' && b) return { page: 'collection', handle: b };
  if (a === 'brands') return b ? { page: 'brand', handle: b } : { page: 'brands' };
  if (a === 'products' && b) return { page: 'product', handle: b };
  if (a === 'cart' && !b) return { page: 'cart' };
  if (a === 'checkout' && !b) return { page: 'checkout' };
  return null;
}

const im = (url: string, alt: string) => ({ url, alt });

/* ------------------------------------------------------------ departments */
export interface Department {
  id: MenuCategory['id'];
  label: string;
  /** collections listed under "Shop by Category" */
  categories: { handle: string; title: string; thumb?: string }[];
}

/** Shop-header mega menu = the same categories as the site Menu (Figma 1934:37988 …). */
export const DEPARTMENTS: Department[] = MENU_CATEGORIES.filter((c) => c.columns).map((c) => ({
  id: c.id,
  label: c.label,
  categories: [...new Map((c.columns ?? []).flat().slice(1).map((title) => [slugify(title), { handle: slugify(title), title }])).values()],
}));

/** Figma sidebar "Shop by Category" (Head-Fi) — with product thumbnails. */
const T = '/shop/cat/thumbs';
export const HEADPHONE_CATEGORIES = [
  { handle: 'closed-back-headphones', title: 'Closed Back Headphones', thumb: `${T}/closed-back.webp` },
  { handle: 'open-back-headphones', title: 'Open Back Headphones', thumb: `${T}/open-back.webp` },
  { handle: 'wireless-headphones', title: 'Wireless Headphones', thumb: `${T}/wireless.webp` },
  { handle: 'electrostatic-headphones', title: 'Electrostatic Headphones', thumb: `${T}/electrostatic.webp` },
  { handle: 'earphones-in-ear-monitors-iem', title: 'Earphones - In Ear Monitors', thumb: `${T}/iem.webp` },
  { handle: 'custom-in-ear-monitors', title: 'Custom In Ear Monitors', thumb: `${T}/custom-iem.webp` },
];
const headFi = DEPARTMENTS.find((d) => d.id === 'head-fi');
if (headFi) {
  const thumbs = new Map(HEADPHONE_CATEGORIES.map((c) => [c.handle, c.thumb]));
  headFi.categories = headFi.categories.map((c) => ({ ...c, thumb: thumbs.get(c.handle) }));
}

export const departmentOf = (collection: string) => DEPARTMENTS.find((d) => d.categories.some((c) => c.handle === collection)) ?? null;
export const collectionTitle = (handle: string) =>
  DEPARTMENTS.flatMap((d) => d.categories).find((c) => c.handle === handle)?.title ??
  handle.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());

/* -------------------------------------------------------- category pages */
export interface CategoryEditorial {
  title: string;
  intro?: string;
  hero?: { url: string; alt: string };
  strip?: { url: string; alt: string }[];
}
const CB = '/shop/cat/closed-back';
export const CATEGORY_EDITORIAL: Record<string, CategoryEditorial> = {
  'closed-back-headphones': {
    title: 'Closed Back Headphones',
    intro: 'Experience ultimate isolation and deep, impactful bass with our premium range of closed-back designs.',
    hero: im(`${CB}/hero.webp`, 'Closed-back headphones in their case'),
    strip: [1, 2, 3, 4, 5, 6].map((i) => im(`${CB}/strip-${i}.webp`, 'Closed-back headphones')),
  },
};

/* ----------------------------------------------------------------- brands */
export type BrandGroup = 'artisan' | 'headphones';
export interface Brand {
  handle: string;
  name: string;
  /** Brands page tab (Figma 3673:38327: "Artisan Audio Brands" / "Headphone Brands") */
  group: BrandGroup;
  /** brand-wall photograph (A–Z grid) */
  tile?: string;
  /** monochrome logo, rendered white over photography via CSS mask */
  logo?: string;
}
const B = '/shop/brands';
const brand = (name: string, group: BrandGroup, slug = slugify(name), opts: { tile?: boolean; logo?: string | false } = {}): Brand => ({
  handle: slug,
  name,
  group,
  tile: opts.tile === false ? undefined : `${B}/tile/${slug}.webp`,
  logo: opts.logo === false ? undefined : (opts.logo ?? `${B}/logo/${slug}.webp`),
});
/** brands with a full Figma brand page (hero + strip + logo, 3673:38327) */
const page = (name: string, group: BrandGroup, slug = slugify(name)) => brand(name, group, slug, { logo: `${B}/logo/${slug}-hero.webp` });

export const BRAND_GROUPS: { id: BrandGroup; label: string; hero: { url: string; alt: string } }[] = [
  { id: 'artisan', label: 'Artisan Audio', hero: { url: `${B}/hero-hifi.webp`, alt: 'Floor-standing loudspeakers by a window' } },
  { id: 'headphones', label: 'Headphones', hero: { url: `${B}/hero-hp.webp`, alt: 'Wooden planar headphones' } },
];

/** Brands A–Z. Figma 3388:19910 (Artisan Audio) + 3389:24342 (Headphones); earlier wall entries keep their tiles. */
export const BRANDS: Brand[] = [
  // Artisan Audio (Hi-Fi)
  page('Audiovector', 'artisan'),
  page('ATC', 'artisan'),
  page('DCS', 'artisan'),
  page('LAiV', 'artisan'),
  page('Moon By Simaudio', 'artisan'),
  page('SV Audio', 'artisan'),
  page('Viva Audio', 'artisan'),
  page('Vpi', 'artisan'),
  brand('Aavik', 'artisan'),
  brand('Albedo', 'artisan'),
  brand('Audio Bastion', 'artisan'),
  brand('Audiolab', 'artisan'),
  brand('AUDMA', 'artisan', 'audma'),
  brand('Auralic', 'artisan'),
  brand('Aurender', 'artisan'),
  brand('Axxess', 'artisan'),
  brand('Benchmark', 'artisan'),
  brand('BORRESEN', 'artisan', 'borresen'),
  brand('Brinkmann Audio', 'artisan', 'brinkmann'),
  // Headphones
  page('64 Audio', 'headphones'),
  page('Astell&Kern', 'headphones', 'astell-kern'),
  brand('Abyss Audio', 'headphones', 'abyss'),
  page('oBravo', 'headphones'),
  page('Audeze', 'headphones'),
  page('Brise Audio', 'headphones'),
  page('Cayin Audio', 'headphones'),
  page('Canpur', 'headphones'),
  page('Campfire Audio', 'headphones'),
  page('Dan Clark Audio', 'headphones'),
  page('Final Audio', 'headphones'),
  page('Focal', 'headphones'),
  page('Hiby', 'headphones'),
  page('Hifiman', 'headphones'),
  page('Hedd', 'headphones'),
  page('Luxury & Precision', 'headphones', 'luxury-precision'),
  page('Lotoo', 'headphones'),
  page('Noble Audio', 'headphones'),
  page('NUR Headphones', 'headphones'),
  page('Oriolus Japan', 'headphones'),
  page('Raal 1995', 'headphones'),
  page('Spirit Torino', 'headphones'),
  page('Stax', 'headphones'),
  page('Unique Melody', 'headphones'),
  page('Zaehl Elektronik-Tontechnik', 'headphones', 'zaehl'),
  brand('AROMA Audio', 'headphones', 'aroma-audio'),
  brand('Audio Technica', 'headphones'),
  brand('Austrian Audio', 'headphones'),
].sort((x, y) => x.name.localeCompare(y.name, 'en', { sensitivity: 'base' }));

/** Featured brand carousel under the Brands hero. */
export const FEATURED_BRANDS = [
  { handle: '64-audio', name: '64 Audio', image: `${B}/featured-1.webp`, logo: `${B}/logo/featured-1.webp` },
  { handle: 'benchmark', name: 'Benchmark', image: `${B}/featured-2.webp`, logo: `${B}/logo/featured-2.webp` },
  { handle: 'meze-audio', name: 'Meze Audio', image: `${B}/featured-3.webp`, logo: `${B}/logo/featured-3.webp` },
  { handle: 'aavik', name: 'Aavik', image: `${B}/featured-4.webp`, logo: `${B}/logo/featured-4.webp` },
  { handle: 'spirit-torino', name: 'Spirit Torino', image: `${B}/featured-5.webp`, logo: `${B}/logo/featured-5.webp` },
  { handle: 'violectric', name: 'Violectric', image: `${B}/featured-6.webp`, logo: `${B}/logo/featured-6.webp` },
];

export const BRANDS_INTRO = {
  title: 'Brands',
  body: 'There are systems that go along for the ride, and others that redefine it.',
  hero: im(`${B}/hero.webp`, 'Spherical speaker in a living room'),
};

export interface BrandEditorial {
  name: string;
  intro?: string;
  hero?: { url: string; alt: string };
  logo?: string;
  badge?: string;
  strip?: { url: string; alt: string }[];
}
const BRAND_PAGES: Record<string, BrandEditorial> = {
  abyss: {
    name: 'Abyss Audio',
    intro:
      'Since 1990, Abyss provide the highest quality advice, products, and service available. Products engineered and made in the USA. Abyss Headphones is a division of JPS Labs LLC. Abyss, Abyss Headphones, and their triangular shape logo, are registered trademarks of JPS Labs LLC.',
    hero: im(`${B}/abyss/hero.webp`, 'Abyss headphones on a desk'),
    logo: `${B}/logo/abyss-hero.webp`,
    badge: `${B}/abyss/badge.webp`,
    strip: [1, 2, 3, 4, 5, 6].map((i) => im(`${B}/abyss/strip-${i}.webp`, 'Abyss headphones')),
  },
};
/** brand pages from Figma 3673:38327 — hero, 4-photo strip (Moon: 3) and white logo. Intro copy is pending (Figma "Content Need"). */
const STRIP_COUNT: Record<string, number> = { 'moon-by-simaudio': 3 };
const figmaBrandPage = (b: Brand): BrandEditorial => ({
  name: b.name,
  intro: `Discover ${b.name} at Hifonix — every model is available to audition in our listening rooms.`,
  hero: im(`${B}/${b.handle}/hero.webp`, `${b.name}`),
  logo: b.logo,
  strip: Array.from({ length: STRIP_COUNT[b.handle] ?? 4 }, (_, i) => im(`${B}/${b.handle}/strip-${i + 1}.webp`, `${b.name}`)),
});
export const BRAND_EDITORIAL: Record<string, BrandEditorial> = {
  ...Object.fromEntries(BRANDS.filter((b) => b.logo?.endsWith('-hero.webp')).map((b) => [b.handle, figmaBrandPage(b)])),
  ...BRAND_PAGES,
};
/** Menu brand-wall labels → brand handles. */
const BRAND_ALIASES: Record<string, string> = { '4 Audio': '64-audio', Abyss: 'abyss' };
export const brandHandle = (label: string) => BRAND_ALIASES[label] ?? slugify(label);

export const brandName = (handle: string) =>
  BRAND_EDITORIAL[handle]?.name ??
  BRANDS.find((b) => b.handle === handle)?.name ??
  FEATURED_BRANDS.find((b) => b.handle === handle)?.name ??
  handle.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());

/** Product page service promises (Figma PDP buy box). */
export const SERVICE_PROMISES = [
  { icon: 'warranty', label: '10 year warranty' },
  { icon: 'trade', label: 'Trade in product' },
  { icon: 'demo', label: 'Book a Demonstration' },
  { icon: 'store', label: 'Collect immediately' },
  { icon: 'shield', label: 'Guaranteed In-Stock' },
  { icon: 'truck', label: 'Free delivery 4 – 5 days' },
] as const;
