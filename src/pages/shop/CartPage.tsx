import { useEffect, useState } from 'react';
import { catalog, formatMoney, type Product } from '../../commerce';
import { useCart } from '../../commerce/cart';
import { SHOP_ROUTES } from '../../config/shop';
import { Link } from '../../router';
import { DISPATCH_NOTE } from '../../ui/shop/CartDrawer';
import { CartLineRow } from '../../ui/shop/CartLines';
import { CardSkeleton, ProductCard } from '../../ui/shop/ProductCard';
import { CheckoutButton, StateNote, TermsCheck } from '../../ui/shop/parts';
import { ShopLayout } from '../../ui/shop/ShopLayout';
import './shop-pages.css';

/** View cart — Figma View-Cart.v5-2 (2155:44752). All figures come from the backend cart. */
export default function CartPage() {
  const cart = useCart((s) => s.cart);
  const status = useCart((s) => s.status);
  const error = useCart((s) => s.error);
  const [agreed, setAgreed] = useState(false);
  const [flash, setFlash] = useState(0);
  const [recs, setRecs] = useState<Product[] | null>(null);
  const lines = cart?.lines ?? [];
  const n = cart?.totalQuantity ?? 0;

  useEffect(() => {
    catalog.getRecommendations(lines[0]?.merchandise.product.handle ?? null, 8).then(
      (r) => {
        const inCart = new Set(lines.map((l) => l.merchandise.product.handle));
        setRecs(r.filter((p) => !inCart.has(p.handle)).slice(0, 4));
      },
      () => setRecs([]),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart?.id, lines.length]);

  const loading = status === 'idle' || (status === 'loading' && !cart);
  return (
    <ShopLayout tone="solid" title="Your cart">
      <section className="hs-cart" aria-label="Your cart">
        <div className="hs-cart__summary">
          <h1>Your cart</h1>
          <p>{loading ? 'Loading…' : `${n} item${n === 1 ? '' : 's'}`}</p>
          <Link to={SHOP_ROUTES.department('head-fi')} className="hs-link hs-cart__continue">
            Continue shopping
          </Link>
        </div>
        <div className="hs-cart__main">
          {loading && <p className="hs-drawer__loading">Loading your cart…</p>}
          {!loading && lines.length === 0 && (
            <StateNote
              kind="empty"
              title="Your cart is empty"
              action={
                <Link to={SHOP_ROUTES.department('head-fi')} className="hs-btn hs-btn--ghost">
                  Continue shopping
                </Link>
              }
            >
              Add something you love and it will appear here.
            </StateNote>
          )}
          {lines.length > 0 && (
            <ul className="hs-lines hs-lines--page">
              {lines.map((l) => (
                <CartLineRow key={l.id} line={l} />
              ))}
            </ul>
          )}
          {error && (
            <p className="hs-error" role="alert">
              {error}
            </p>
          )}
          <div className="hs-cart__foot">
            <div className="hs-cart__meta">
              {lines.length > 0 && (
                <dl className="hs-cart__totals">
                  <div>
                    <dt>Subtotal</dt>
                    <dd>{cart && formatMoney(cart.cost.subtotal)}</dd>
                  </div>
                  <div className="hs-cart__hint">
                    <dt>Shipping &amp; taxes</dt>
                    <dd>Calculated at checkout</dd>
                  </div>
                </dl>
              )}
              <div className="hs-drawer__dispatch hs-drawer__dispatch--stack">
                <span>Dispatch</span>
                <b>{DISPATCH_NOTE}</b>
              </div>
              <TermsCheck checked={agreed} onChange={setAgreed} flash={flash} />
            </div>
            <CheckoutButton agreed={agreed} onNeedAgree={() => setFlash((f) => f + 1)} className="hs-cart__checkout" />
          </div>
        </div>
      </section>
      <section className="hs-maybe" aria-label="Maybe you would like">
        <h2>Maybe you would like</h2>
        <div className="hs-maybe__grid">
          {recs === null ? <CardSkeleton n={4} /> : recs.map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}
        </div>
      </section>
    </ShopLayout>
  );
}
