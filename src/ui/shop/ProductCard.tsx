import { type CSSProperties, useState } from 'react';
import { priceLabel, type Product } from '../../commerce';
import { useCart } from '../../commerce/cart';
import { SHOP_ROUTES } from '../../config/shop';
import { Link, navigate } from '../../router';
import { SIcon } from './icons';
import { Swatch } from './parts';

/** Saved items (per browser) — the design shows a heart; no account/wishlist backend exists yet. */
const SAVED = 'hifonix.saved';
const readSaved = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(SAVED) ?? '[]') as string[];
  } catch {
    return [];
  }
};

/**
 * Product card — Figma component 1416:20612 (default) / 1416:20625 (hover):
 * product cut-out on #eee; on hover the lifestyle photograph fades in and the
 * three tool buttons slide in from the right (save · quick add · view).
 * The whole card links to the product page.
 */
export function ProductCard({ p, index = 0, compact }: { p: Product; index?: number; compact?: boolean }) {
  const add = useCart((s) => s.add);
  const openDrawer = useCart((s) => s.openDrawer);
  const [saved, setSaved] = useState(() => readSaved().includes(p.handle));
  const [adding, setAdding] = useState(false);
  const to = SHOP_ROUTES.product(p.handle);
  const visual = p.options.find((o) => o.values.some((v) => v.swatch));
  const firstAvailable = p.variants.find((v) => v.availableForSale);
  const singleVariant = p.variants.length === 1;

  const toggleSave = () => {
    const list = readSaved();
    const next = list.includes(p.handle) ? list.filter((h) => h !== p.handle) : [...list, p.handle];
    try {
      localStorage.setItem(SAVED, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setSaved(next.includes(p.handle));
  };
  // quick add: only when there is nothing to choose; otherwise open the product to pick options
  const quickAdd = async () => {
    if (!singleVariant || !firstAvailable) {
      navigate(to);
      return;
    }
    setAdding(true);
    const ok = await add(p, firstAvailable, 1);
    setAdding(false);
    if (ok) openDrawer(true);
  };

  return (
    <article className={`hs-card${compact ? ' hs-card--compact' : ''}`} style={{ '--i': index } as CSSProperties}>
      <div className="hs-card__media">
        <Link to={to} className="hs-card__link" aria-label={p.title} tabIndex={-1}>
          <img className="hs-card__img" src={p.featuredImage.url} alt={p.featuredImage.alt} loading="lazy" decoding="async" />
          {p.hoverImage && <img className="hs-card__hover" src={p.hoverImage.url} alt="" loading="lazy" decoding="async" />}
        </Link>
        <div className="hs-card__tools">
          <button type="button" className="hs-tool" onClick={toggleSave} aria-pressed={saved} aria-label={saved ? `Remove ${p.title} from saved` : `Save ${p.title}`}>
            <SIcon name="heart" size={20} stroke={1.8} />
          </button>
          <button type="button" className="hs-tool" onClick={quickAdd} data-loading={adding || undefined} aria-label={singleVariant ? `Add ${p.title} to cart` : `Choose options for ${p.title}`}>
            <SIcon name="bag" size={20} stroke={1.8} />
          </button>
          <Link to={to} className="hs-tool" aria-label={`View ${p.title}`}>
            <SIcon name="plus" size={16} stroke={2} />
          </Link>
        </div>
      </div>
      <div className="hs-card__body">
        <h3 className="hs-card__title">
          <Link to={to}>{p.title}</Link>
        </h3>
        <p className="hs-card__price">{priceLabel(p)}</p>
        {!compact && visual && visual.values.length > 0 && (
          <ul className="hs-card__swatches" aria-label={`${visual.name} options`}>
            {visual.values.map((v) => (
              <li key={v.name} title={v.name}>
                <Swatch v={v} />
                <span className="sr-only">{v.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

export function CardSkeleton({ n = 6 }: { n?: number }) {
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="hs-card hs-card--skeleton" aria-hidden="true">
          <div className="hs-card__media" />
          <div className="hs-card__body">
            <span />
            <span />
          </div>
        </div>
      ))}
    </>
  );
}
