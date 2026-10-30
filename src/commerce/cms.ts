import { CURRENCY } from './config';
import { queryProducts } from './demo/service';
import { money } from './money';
import { db } from './supabase';
import type { CatalogService, Img, Product, ProductOption, ProductStory, Variant } from './types';

/**
 * CMS catalogue adapter — products managed in /admin, stored in Supabase.
 * One row per product; variants are derived from its options (a value may
 * carry its own price), which is the same model Shopify uses, so a Shopify
 * adapter can later replace this one behind CatalogService.
 */
export interface CmsImage {
  url: string;
  alt?: string;
  /** storage object path (uploaded images) — used to delete the file */
  path?: string;
}
export interface CmsOptionValue {
  name: string;
  color?: string;
  image?: string;
  price?: number | null;
}
export interface CmsProduct {
  id: string;
  handle: string;
  title: string;
  subtitle: string | null;
  brand: string;
  brand_handle: string;
  department: string;
  categories: string[];
  product_type: string;
  description: string;
  price: number;
  price_from: boolean;
  currency: string;
  available: boolean;
  status: 'draft' | 'published';
  images: CmsImage[];
  hover_image: CmsImage | null;
  options: { name: string; values: CmsOptionValue[] }[];
  specs: { label: string; value: string }[];
  story: ProductStory | null;
  sort_order: number;
  updated_at?: string;
}

export const PLACEHOLDER_IMAGE = '/shop/ui/placeholder.svg';

export function rowToProduct(r: CmsProduct): Product {
  const cur = r.currency || CURRENCY.code;
  const images: Img[] = (r.images ?? []).filter((i) => i.url).map((i) => ({ url: i.url, alt: i.alt || r.title }));
  const featured = images[0] ?? { url: PLACEHOLDER_IMAGE, alt: `${r.title} — image coming soon` };
  const options: ProductOption[] = (r.options ?? [])
    .filter((o) => o.name && o.values?.length)
    .map((o) => ({ name: o.name, values: o.values.filter((v) => v.name).map((v) => ({ name: v.name, swatch: v.color || v.image ? { color: v.color, image: v.image } : undefined })) }));
  const combos = options.reduce<{ name: string; value: string }[][]>((acc, o) => acc.flatMap((c) => o.values.map((v) => [...c, { name: o.name, value: v.name }])), [[]]);
  const variants: Variant[] = combos.map((sel, i) => {
    // a value's own price overrides the base price (first matching option wins)
    let price = Number(r.price) || 0;
    for (const s of sel) {
      const v = r.options.find((o) => o.name === s.name)?.values.find((x) => x.name === s.value);
      if (v?.price != null && v.price !== undefined && !Number.isNaN(Number(v.price))) {
        price = Number(v.price);
        break;
      }
    }
    return {
      id: `${r.id}:${i}`,
      title: sel.length ? sel.map((x) => x.value).join(' / ') : 'Default Title',
      availableForSale: r.available,
      selectedOptions: sel,
      price: money(price, cur),
      image: featured,
    };
  });
  const amounts = variants.map((v) => v.price.amount);
  return {
    id: r.id,
    handle: r.handle,
    title: r.title,
    subtitle: r.subtitle ?? undefined,
    vendor: r.brand,
    brandHandle: r.brand_handle,
    productType: r.product_type,
    collections: r.categories ?? [],
    departments: [r.department],
    description: r.description ?? '',
    priceRange: { min: money(Math.min(...amounts), cur), max: money(Math.max(...amounts), cur) },
    priceFrom: r.price_from,
    featuredImage: featured,
    hoverImage: r.hover_image?.url ? { url: r.hover_image.url, alt: `${r.title} — in use` } : null,
    images: images.length ? images : [featured],
    options,
    variants,
    available: r.available,
    specs: r.specs ?? [],
    story: r.story ?? undefined,
  };
}

let cache: { at: number; list: Product[] } | null = null;
async function published(): Promise<Product[]> {
  if (cache && Date.now() - cache.at < 30_000) return cache.list;
  const rows = await db.select<CmsProduct>('products', 'select=*&status=eq.published&order=sort_order.asc,title.asc');
  cache = { at: Date.now(), list: rows.map(rowToProduct) };
  return cache.list;
}
export const invalidateCms = () => {
  cache = null;
};

export const cmsCatalog: CatalogService = {
  mode: 'cms',
  async getProducts(q) {
    return queryProducts(await published(), q);
  },
  async getProduct(handle) {
    return (await published()).find((p) => p.handle === handle) ?? null;
  },
  async getRecommendations(handle, limit) {
    const all = await published();
    const me = all.find((p) => p.handle === handle);
    const same = all.filter((p) => p.handle !== handle && me && p.departments[0] === me.departments[0]);
    const rest = all.filter((p) => p.handle !== handle && !same.includes(p));
    return [...same, ...rest].slice(0, limit);
  },
};
