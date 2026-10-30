// Generates supabase/seed.sql from the demo catalogue: `node scripts/cms/build-seed.mjs`
import { DEMO_PRODUCTS } from '../../src/commerce/demo/catalog';
const q = (v: unknown) => (v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g, "''")}'`);
const j = (v: unknown) => `${q(JSON.stringify(v ?? null))}::jsonb`;
const rows = DEMO_PRODUCTS.map((p, i) => {
  const base = p.priceRange.min.amount;
  const options = p.options.map((o, oi) => ({
    name: o.name,
    values: o.values.map((v) => {
      const variant = oi === 0 ? p.variants.find((x) => x.selectedOptions[0]?.value === v.name) : undefined;
      const price = variant && variant.price.amount !== base ? variant.price.amount : null;
      return { name: v.name, color: v.swatch?.color ?? null, image: v.swatch?.image ?? null, price };
    }),
  }));
  const dept = p.departments[0] ?? 'head-fi';
  return `(${[
    q(p.handle), q(p.title), q(p.subtitle ?? null), q(p.vendor), q(p.brandHandle), q(dept),
    `array[${p.collections.map(q).join(',')}]::text[]`, q(p.productType), q(p.description), base, p.priceFrom ? 'true' : 'false',
    `true`, `'published'`, j(p.images.map((im) => ({ url: im.url, alt: im.alt }))), j(p.hoverImage ? { url: p.hoverImage.url } : null),
    j(options), j(p.story?.specs ?? []), j(p.story ?? null), i * 10,
  ].join(', ')})`;
});
console.log(`-- Demo catalogue (generated). Safe to re-run: existing handles are left untouched.
insert into public.products (handle, title, subtitle, brand, brand_handle, department, categories, product_type, description, price, price_from, available, status, images, hover_image, options, specs, story, sort_order)
values
${rows.join(',\n')}
on conflict (handle) do nothing;`);
