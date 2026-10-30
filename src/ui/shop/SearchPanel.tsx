import { useEffect, useMemo, useRef, useState } from 'react';
import { catalog, formatMoney, type Product } from '../../commerce';
import { SHOP_ROUTES } from '../../config/shop';
import { Link } from '../../router';
import { SIcon } from './icons';

/**
 * Header search (the design shows only the search icon): a slim panel under
 * the header that filters the catalogue as you type. Live mode searches the
 * Shopify "all" collection; demo mode the temporary catalogue.
 */
export function SearchPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [all, setAll] = useState<Product[] | null>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!open) return;
    input.current?.focus({ preventScroll: true });
    if (!all) catalog.getProducts({ collection: 'all' }).then(setAll, () => setAll([]));
  }, [open, all]);
  const hits = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t || !all) return [];
    return all.filter((p) => `${p.title} ${p.vendor} ${p.productType}`.toLowerCase().includes(t)).slice(0, 6);
  }, [q, all]);
  return (
    <div className="hs-search" data-open={open || undefined} role="search" aria-hidden={!open}>
      <div className="hs-search__in">
        <SIcon name="search" size={20} />
        <input
          ref={input}
          type="search"
          placeholder="Search products and brands"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          tabIndex={open ? 0 : -1}
          aria-label="Search products"
        />
        <button type="button" onClick={onClose} tabIndex={open ? 0 : -1} className="hs-search__close">
          Close
        </button>
      </div>
      {q.trim() && (
        <ul className="hs-search__results">
          {all === null && <li className="hs-search__note">Searching…</li>}
          {all && hits.length === 0 && <li className="hs-search__note">No products match “{q.trim()}”.</li>}
          {hits.map((p) => (
            <li key={p.id}>
              <Link to={SHOP_ROUTES.product(p.handle)} onClick={onClose}>
                <span className="hs-search__img">
                  <img src={p.featuredImage.url} alt="" />
                </span>
                <span className="hs-search__t">{p.title}</span>
                <span className="hs-search__p">{formatMoney(p.priceRange.min)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
