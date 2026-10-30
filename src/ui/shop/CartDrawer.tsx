import { useEffect, useRef, useState } from 'react';
import { catalog, formatMoney, type Product } from '../../commerce';
import { useCart } from '../../commerce/cart';
import { SHOP_ROUTES } from '../../config/shop';
import { Link, usePath } from '../../router';
import { CartLineRow } from './CartLines';
import { CheckoutButton, StateNote, TermsCheck } from './parts';

/** Dispatch estimate shown in the cart (T&C: in-stock items typically dispatch within 1–3 days). */
export const DISPATCH_NOTE = 'Within 1 – 3 working days';

/**
 * Quick cart — Figma View-Cart.v5-1 (2155:44871): slides in from the right over
 * a dimmed page. Opens from the header Cart button and after Add to Cart.
 */
export function CartDrawer() {
  const open = useCart((s) => s.drawerOpen);
  const setOpen = useCart((s) => s.openDrawer);
  const cart = useCart((s) => s.cart);
  const status = useCart((s) => s.status);
  const error = useCart((s) => s.error);
  const added = useCart((s) => s.added);
  const clearNotice = useCart((s) => s.clearNotice);
  const path = usePath();
  const panel = useRef<HTMLDivElement>(null);
  const [agreed, setAgreed] = useState(false);
  const [flash, setFlash] = useState(0);
  const [recs, setRecs] = useState<Product[]>([]);
  const lines = cart?.lines ?? [];

  useEffect(() => setOpen(false), [path, setOpen]);
  useEffect(() => {
    panel.current?.toggleAttribute('inert', !open);
    if (!open) {
      clearNotice();
      return;
    }
    panel.current?.querySelector<HTMLElement>('.hs-drawer__close')?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setOpen, clearNotice]);
  useEffect(() => {
    if (!open) return;
    const inCart = new Set(lines.map((l) => l.merchandise.product.handle));
    catalog.getRecommendations(lines[0]?.merchandise.product.handle ?? null, 6).then(
      (r) => setRecs(r.filter((p) => !inCart.has(p.handle)).slice(0, 4)),
      () => setRecs([]),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, cart?.totalQuantity]);

  const n = cart?.totalQuantity ?? 0;
  return (
    <>
      <div className="hs-drawer-scrim" data-open={open || undefined} onClick={() => setOpen(false)} aria-hidden="true" />
      <div ref={panel} className="hs-drawer" data-open={open || undefined} role="dialog" aria-modal="true" aria-label="Your cart">
        <header className="hs-drawer__head">
          <div>
            <h2>Your cart</h2>
            <p>
              {n} item{n === 1 ? '' : 's'}
            </p>
          </div>
          <button type="button" className="hs-drawer__close" onClick={() => setOpen(false)}>
            Close
          </button>
        </header>
        {added && (
          <p className="hs-drawer__added" key={added.key} role="status">
            <span className="hs-drawer__tick" aria-hidden="true" />
            Added to your cart: <b>{added.title}</b>
            {added.variant && added.variant !== 'Default Title' ? ` — ${added.variant}` : ''}
          </p>
        )}
        <div className="hs-drawer__body">
          {status === 'loading' && !cart && <p className="hs-drawer__loading">Loading your cart…</p>}
          {status !== 'loading' && lines.length === 0 && (
            <StateNote kind="empty" title="Your cart is empty">
              Explore our headphones and Hi-Fi to find your next upgrade.
            </StateNote>
          )}
          {lines.length > 0 && (
            <ul className="hs-lines">
              {lines.map((l) => (
                <CartLineRow key={l.id} line={l} onNavigate={() => setOpen(false)} />
              ))}
            </ul>
          )}
          {error && (
            <p className="hs-error" role="alert">
              {error}
            </p>
          )}
          {recs.length > 0 && (
            <section className="hs-drawer__recs" aria-label="Maybe you would like">
              <h3>Maybe you would like</h3>
              <ul>
                {recs.map((p) => (
                  <RecItem key={p.id} p={p} />
                ))}
              </ul>
            </section>
          )}
        </div>
        <footer className="hs-drawer__foot">
          <div className="hs-drawer__dispatch">
            <span>Dispatch</span>
            <b>{DISPATCH_NOTE}</b>
          </div>
          <TermsCheck checked={agreed} onChange={setAgreed} flash={flash} />
          <div className="hs-drawer__actions">
            <Link to={SHOP_ROUTES.cart} className="hs-link hs-link--lg">
              View cart
            </Link>
            <CheckoutButton agreed={agreed} onNeedAgree={() => setFlash((f) => f + 1)} />
          </div>
        </footer>
      </div>
    </>
  );
}

function RecItem({ p }: { p: Product }) {
  const add = useCart((s) => s.add);
  const [state, setState] = useState<'idle' | 'adding' | 'done'>('idle');
  const single = p.variants.length === 1 ? p.variants[0] : null;
  const variantLabel = p.options[0]?.values[0]?.name;
  const onAdd = async () => {
    if (!single) return;
    setState('adding');
    const ok = await add(p, single, 1);
    setState(ok ? 'done' : 'idle');
  };
  return (
    <li className="hs-rec">
      <Link to={SHOP_ROUTES.product(p.handle)} className="hs-rec__img" tabIndex={-1} aria-hidden="true">
        <img src={p.featuredImage.url} alt="" loading="lazy" />
      </Link>
      <div className="hs-rec__info">
        <Link to={SHOP_ROUTES.product(p.handle)} className="hs-rec__title">
          {p.title}
        </Link>
        <span className="hs-rec__price">{formatMoney(p.priceRange.min)}</span>
        {variantLabel && <span className="hs-rec__var">{variantLabel}</span>}
      </div>
      {single ? (
        <button type="button" className="hs-rec__add" onClick={onAdd} disabled={state !== 'idle'} data-state={state}>
          {state === 'done' ? 'Added' : state === 'adding' ? 'Adding…' : 'Add'}
        </button>
      ) : (
        <Link to={SHOP_ROUTES.product(p.handle)} className="hs-rec__add">
          View
        </Link>
      )}
    </li>
  );
}
