import { type CSSProperties, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { catalog, type Product, type ProductQuery, type SortKey } from '../../commerce';
import { useResource } from '../../commerce/useResource';
import {
  BRAND_EDITORIAL,
  brandName,
  CATEGORY_EDITORIAL,
  collectionTitle,
  DEPARTMENTS,
  departmentOf,
  HEADPHONE_CATEGORIES,
  SHOP_ROUTES,
} from '../../config/shop';
import { ROUTES } from '../../config/navigation';
import { Link } from '../../router';
import { useMediaQuery } from '../../ui/chrome/scroll';
import { SIcon } from '../../ui/shop/icons';
import { CardSkeleton, ProductCard } from '../../ui/shop/ProductCard';
import { Breadcrumb, StateNote } from '../../ui/shop/parts';
import { ShopLayout } from '../../ui/shop/ShopLayout';
import { GalleryStrip, ShopHero } from './Hero';
import './shop-pages.css';

type Kind = 'department' | 'collection' | 'brand';
const SORTS: { key: SortKey; label: string }[] = [
  { key: 'best-selling', label: 'Best Selling' },
  { key: 'price-asc', label: 'Price, low to high' },
  { key: 'price-desc', label: 'Price, high to low' },
  { key: 'title-asc', label: 'Alphabetically, A–Z' },
];
const PRICES: { label: string; range: [number, number] }[] = [
  { label: 'Under £1,000', range: [0, 999.99] },
  { label: '£1,000 – £3,000', range: [1000, 3000] },
  { label: '£3,000 – £5,000', range: [3000, 5000] },
  { label: 'Over £5,000', range: [5000, 1e9] },
];

/**
 * Product listing — one template for the three Figma listing frames:
 *  · department  (/shop/:id)          Product-listing-Page v5-2: toolbar + filters + grid
 *  · collection  (/collections/:h)    Category-listing-Page v5-3: hero + gallery strip + listing
 *  · brand       (/brands/:h)         Brands-listing-Page v5-3: brand hero + strip + listing
 */
export default function ListingPage({ kind, handle }: { kind: Kind; handle: string }) {
  const desktop = useMediaQuery('(min-width: 1024px)');
  const [sort, setSort] = useState<SortKey>('best-selling');
  const [price, setPrice] = useState<[number, number] | null>(null);
  const [types, setTypes] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const dept = kind === 'department' ? DEPARTMENTS.find((d) => d.id === handle) : kind === 'collection' ? departmentOf(handle) : null;
  const catEd = kind === 'collection' ? CATEGORY_EDITORIAL[handle] : undefined;
  const brandEd = kind === 'brand' ? BRAND_EDITORIAL[handle] : undefined;
  const title = kind === 'department' ? (dept?.label ?? collectionTitle(handle)) : kind === 'collection' ? (catEd?.title ?? collectionTitle(handle)) : brandName(handle);
  const hero = catEd?.hero ?? brandEd?.hero;
  const strip = catEd?.strip ?? brandEd?.strip;

  const query: ProductQuery = { [kind === 'department' ? 'department' : kind]: handle, sort, price };
  const res = useResource(JSON.stringify(query), () => catalog.getProducts(query));
  const all = res.data ?? [];
  const productTypes = useMemo(() => [...new Set(all.map((p) => p.productType).filter(Boolean))], [all]);
  const brands = useMemo(() => [...new Map(all.map((p) => [p.brandHandle, p.vendor])).entries()], [all]);
  const list = types.length ? all.filter((p) => types.includes(p.productType)) : all;

  useEffect(() => {
    setTypes([]);
    setPrice(null);
  }, [kind, handle]);
  useEffect(() => {
    if (desktop) setFiltersOpen(false);
  }, [desktop]);

  const crumbs = [
    { label: 'Home', to: ROUTES.splash },
    ...(dept && kind !== 'department' ? [{ label: dept.label, to: SHOP_ROUTES.department(dept.id) }] : []),
    ...(kind === 'brand' ? [{ label: 'Brands', to: SHOP_ROUTES.brands }] : []),
    { label: title },
  ];
  const categories = dept?.id === 'head-fi' || !dept ? HEADPHONE_CATEGORIES : dept.categories;
  const defaultOpen = kind === 'brand' ? 'brands' : kind === 'collection' ? 'category' : 'product';

  return (
    <ShopLayout tone={hero ? 'overlay' : 'solid'} title={title}>
      {hero ? (
        <ShopHero image={hero} title={title} logo={brandEd?.logo} target="hs-products" variant={kind === 'brand' ? 'serif' : 'script'}>
          {(catEd?.intro ?? brandEd?.intro) && <p>{catEd?.intro ?? brandEd?.intro}</p>}
        </ShopHero>
      ) : (
        <h1 className="sr-only">{title}</h1>
      )}
      {strip && <GalleryStrip images={strip} label={`${title} gallery`} />}

      <div id="hs-products" className="hs-listing" data-hero={hero ? '' : undefined}>
        <div className="hs-toolbar">
          {!desktop && (
            <button type="button" className="hs-icon-btn hs-icon-btn--box" onClick={() => setFiltersOpen(true)} aria-label="Filters" aria-expanded={filtersOpen}>
              <SIcon name="filter" size={20} />
            </button>
          )}
          {desktop && <Breadcrumb items={crumbs} />}
          <p className="hs-toolbar__count" aria-live="polite">
            {res.loading ? 'Loading…' : `${list.length} product${list.length === 1 ? '' : 's'}`}
          </p>
          <SortMenu value={sort} onChange={setSort} compact={!desktop} />
        </div>

        <div className="hs-listing__body">
          <aside className="hs-filters" data-open={filtersOpen || undefined} aria-label="Filters">
            {!desktop && (
              <div className="hs-filters__head">
                <p>Filters</p>
                <button type="button" onClick={() => setFiltersOpen(false)} className="hs-link">
                  Done
                </button>
              </div>
            )}
            <Accordion title="Shop by Category" open={defaultOpen === 'category'} active={kind === 'collection'}>
              <ul className="hs-cats">
                {categories.map((c) => (
                  <li key={c.handle}>
                    <Link to={SHOP_ROUTES.collection(c.handle)} aria-current={kind === 'collection' && c.handle === handle ? 'page' : undefined}>
                      {'thumb' in c && c.thumb && (
                        <span className="hs-cats__thumb">
                          <img src={c.thumb} alt="" loading="lazy" />
                        </span>
                      )}
                      <span>{c.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Accordion>
            <Accordion title="Shop by Brands" open={defaultOpen === 'brands'} active={kind === 'brand'}>
              <ul className="hs-flist">
                {(kind === 'brand' ? [[handle, brandName(handle)] as const] : brands).map(([h, name]) => (
                  <li key={h}>
                    <Link to={SHOP_ROUTES.brand(h)} aria-current={kind === 'brand' && h === handle ? 'page' : undefined}>
                      {name}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link to={SHOP_ROUTES.brands} className="hs-more">
                    All brands…
                  </Link>
                </li>
              </ul>
            </Accordion>
            <Accordion title="Shop by Product" open={defaultOpen === 'product'} active={types.length > 0}>
              <ul className="hs-flist">
                {productTypes.length === 0 && <li className="hs-flist__none">No product types yet</li>}
                {productTypes.map((t) => (
                  <li key={t}>
                    <label className="hs-check">
                      <input type="checkbox" checked={types.includes(t)} onChange={(e) => setTypes((s) => (e.target.checked ? [...s, t] : s.filter((x) => x !== t)))} />
                      <span>{t}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </Accordion>
            <Accordion title="Price Range" last active={price !== null}>
              <ul className="hs-flist">
                {PRICES.map((p) => {
                  const on = price?.[0] === p.range[0];
                  return (
                    <li key={p.label}>
                      <label className="hs-check">
                        <input type="radio" name="hs-price" checked={on} onChange={() => setPrice(p.range)} />
                        <span>{p.label}</span>
                      </label>
                    </li>
                  );
                })}
                {price && (
                  <li>
                    <button type="button" className="hs-more" onClick={() => setPrice(null)}>
                      Clear price
                    </button>
                  </li>
                )}
              </ul>
            </Accordion>
          </aside>
          {!desktop && <div className="hs-filters-scrim" data-open={filtersOpen || undefined} onClick={() => setFiltersOpen(false)} aria-hidden="true" />}

          <div className="hs-grid" aria-busy={res.loading}>
            {res.loading && <CardSkeleton n={6} />}
            {!res.loading && res.error && (
              <StateNote
                kind="error"
                title="We couldn’t load these products."
                action={
                  <button type="button" className="hs-btn hs-btn--ghost" onClick={res.retry}>
                    Try again
                  </button>
                }
              >
                {res.error}
              </StateNote>
            )}
            {!res.loading && !res.error && list.length === 0 && (
              <StateNote kind="empty" title="No products here yet">
                {all.length
                  ? 'No products match these filters.'
                  : 'Products for this range will appear here once the Shopify catalogue is connected.'}
              </StateNote>
            )}
            {!res.loading && list.map((p, i) => <RevealCard key={p.id} p={p} i={i} />)}
          </div>
        </div>
      </div>
    </ShopLayout>
  );
}

/** Cards rise in as they enter the viewport (staggered per row). */
function RevealCard({ p, i }: { p: Product; i: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setIn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setIn(true), io.disconnect()), { rootMargin: '0px 0px -6% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className="hs-reveal" data-in={inView || undefined} style={{ '--d': i % 3 } as CSSProperties}>
      <ProductCard p={p} index={i} />
    </div>
  );
}

function Accordion({ title, open: initial = false, active, last, children }: { title: string; open?: boolean; active?: boolean; last?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(initial);
  const id = `hs-acc-${title.toLowerCase().replace(/\W+/g, '-')}`;
  return (
    <div className={`hs-acc${last ? ' hs-acc--last' : ''}`} data-open={open || undefined} data-active={active || open || undefined}>
      <button type="button" className="hs-acc__btn" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        <span>{title}</span>
        <SIcon name={open ? 'minus' : 'plus'} size={24} stroke={2.5} />
      </button>
      <div id={id} className="hs-acc__panel" role="region">
        <div className="hs-acc__in">{children}</div>
      </div>
    </div>
  );
}

function SortMenu({ value, onChange, compact }: { value: SortKey; onChange: (k: SortKey) => void; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const off = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', off);
    window.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', off);
      window.removeEventListener('keydown', esc);
    };
  }, [open]);
  const current = SORTS.find((s) => s.key === value)!;
  return (
    <div ref={ref} className="hs-sort" data-open={open || undefined}>
      <button type="button" className={compact ? 'hs-icon-btn hs-icon-btn--box' : 'hs-sort__btn'} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((o) => !o)} aria-label={compact ? `Sort by: ${current.label}` : undefined}>
        {compact ? (
          <SIcon name="filter" size={20} className="hs-rot" />
        ) : (
          <>
            <b>Sort by:</b> {current.label}
            <SIcon name="chevron-down" size={14} stroke={2} />
          </>
        )}
      </button>
      <ul className="hs-sort__list" role="listbox" aria-label="Sort by">
        {SORTS.map((s) => (
          <li key={s.key} role="option" aria-selected={s.key === value}>
            <button
              type="button"
              tabIndex={open ? 0 : -1}
              onClick={() => {
                onChange(s.key);
                setOpen(false);
              }}
            >
              {s.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
