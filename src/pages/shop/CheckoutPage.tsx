import { type FormEvent, type InputHTMLAttributes, type ReactNode, useEffect, useMemo, useState } from 'react';
import { formatMoney, type CartLine } from '../../commerce';
import { useCart } from '../../commerce/cart';
import { CURRENCY } from '../../commerce/config';
import { ROUTES } from '../../config/navigation';
import { SHOP_ROUTES } from '../../config/shop';
import { Link, navigate } from '../../router';
import './checkout.css';

/**
 * Demo checkout — Figma Checkout (2155:85851) and Thank-you (2172:44917).
 * Nothing is charged, stored or sent: the form only validates locally, the
 * cart is cleared and a demo confirmation is shown. When a real commerce
 * backend arrives, CheckoutButton hands off to its hosted checkout instead.
 */
const ORDER_KEY = 'hifonix.demoOrder';
const SHIPPING = [
  { id: 'standard', label: 'Standard UK delivery', note: '2–4 working days', price: 0 },
  { id: 'express', label: 'Express delivery', note: 'Next working day', price: 15 },
];
interface DemoOrder {
  ref: string;
  email: string;
  name: string;
  address: string;
  shipping: (typeof SHIPPING)[number];
  lines: CartLine[];
  subtotal: number;
  placedAt: string;
}

function Shell({ children, title }: { children: ReactNode; title: string }) {
  useEffect(() => {
    const prev = document.title;
    document.title = `${title} — Hifonix Studios`;
    return () => {
      document.title = prev;
    };
  }, [title]);
  return (
    <div className="hc">
      <header className="hc-top">
        <Link to={ROUTES.splash} className="hc-logo" aria-label="Hifonix Studios — start">
          <img src="/hifi/footer-logo.svg" alt="Hifonix Studios" />
        </Link>
        <Link to={SHOP_ROUTES.cart} className="hc-back">
          Back to cart
        </Link>
      </header>
      <p className="hc-banner" role="note">
        <b>Demonstration checkout.</b> No payment is taken and no order is placed. Details you enter stay in this browser and are not sent anywhere.
      </p>
      {children}
    </div>
  );
}

function Summary({ lines, subtotal, shipping }: { lines: CartLine[]; subtotal: number; shipping: number }) {
  return (
    <aside className="hc-sum" aria-label="Order summary">
      <ul>
        {lines.map((l) => (
          <li key={l.id}>
            <span className="hc-sum__img">
              {l.merchandise.image && <img src={l.merchandise.image.url} alt="" />}
              <em>{l.quantity}</em>
            </span>
            <span className="hc-sum__t">
              <b>{l.merchandise.product.title}</b>
              {l.merchandise.title !== 'Default' && <small>{l.merchandise.title}</small>}
            </span>
            <span>{formatMoney(l.cost.total)}</span>
          </li>
        ))}
      </ul>
      <dl>
        <div>
          <dt>Subtotal</dt>
          <dd>{formatMoney(subtotal)}</dd>
        </div>
        <div>
          <dt>Shipping</dt>
          <dd>{shipping ? formatMoney(shipping) : 'Free'}</dd>
        </div>
        <div className="hc-sum__total">
          <dt>Total</dt>
          <dd>
            <small>{CURRENCY.code}</small> {formatMoney(subtotal + shipping)}
          </dd>
        </div>
      </dl>
    </aside>
  );
}

export default function CheckoutPage() {
  const cart = useCart((s) => s.cart);
  const status = useCart((s) => s.status);
  const init = useCart((s) => s.init);
  const checkoutDone = useCart((s) => s.checkoutDone);
  const [ship, setShip] = useState(SHIPPING[0].id);
  const [f, setF] = useState({ email: '', first: '', last: '', address: '', city: '', postcode: '' });
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    init();
  }, [init]);

  const lines = cart?.lines ?? [];
  const subtotal = cart?.cost.subtotal.amount ?? 0;
  const shipping = SHIPPING.find((s) => s.id === ship)!;
  const errors = useMemo(() => {
    const e: Partial<Record<keyof typeof f, string>> = {};
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Enter an email address';
    if (!f.first.trim()) e.first = 'Enter a first name';
    if (!f.last.trim()) e.last = 'Enter a last name';
    if (!f.address.trim()) e.address = 'Enter an address';
    if (!f.city.trim()) e.city = 'Enter a city';
    if (!f.postcode.trim()) e.postcode = 'Enter a postcode';
    return e;
  }, [f]);

  if ((status === 'idle' || status === 'loading') && !cart) return <Shell title="Checkout">{<p className="hc-empty">Loading…</p>}</Shell>;
  if (!lines.length)
    return (
      <Shell title="Checkout">
        <div className="hc-empty">
          <h1>Your cart is empty</h1>
          <Link to={SHOP_ROUTES.department('head-fi')} className="hc-btn">
            Continue shopping
          </Link>
        </div>
      </Shell>
    );

  const field = (k: keyof typeof f, label: string, props: InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="hc-field" data-err={(tried && errors[k]) || undefined}>
      <input {...props} placeholder=" " value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} aria-invalid={tried && !!errors[k]} />
      <span>{label}</span>
      {tried && errors[k] && <small>{errors[k]}</small>}
    </label>
  );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (Object.keys(errors).length) return;
    setBusy(true);
    const order: DemoOrder = {
      ref: `DEMO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      email: f.email,
      name: `${f.first} ${f.last}`,
      address: `${f.address}, ${f.city} ${f.postcode}`,
      shipping,
      lines,
      subtotal,
      placedAt: new Date().toISOString(),
    };
    try {
      sessionStorage.setItem(ORDER_KEY, JSON.stringify(order));
    } catch {
      /* ignore */
    }
    await checkoutDone();
    navigate(SHOP_ROUTES.confirmation, { replace: true });
  };

  return (
    <Shell title="Checkout">
      <div className="hc-grid">
        <form className="hc-form" onSubmit={submit} noValidate>
          <section>
            <h2>Contact</h2>
            {field('email', 'Email', { type: 'email', autoComplete: 'email' })}
          </section>
          <section>
            <h2>Delivery</h2>
            <div className="hc-2">
              {field('first', 'First name', { autoComplete: 'given-name' })}
              {field('last', 'Last name', { autoComplete: 'family-name' })}
            </div>
            {field('address', 'Address', { autoComplete: 'address-line1' })}
            <div className="hc-2">
              {field('city', 'City', { autoComplete: 'address-level2' })}
              {field('postcode', 'Postcode', { autoComplete: 'postal-code' })}
            </div>
          </section>
          <section>
            <h2>Shipping method</h2>
            <div className="hc-radios">
              {SHIPPING.map((s) => (
                <label key={s.id} className="hc-radio" data-on={ship === s.id || undefined}>
                  <input type="radio" name="ship" checked={ship === s.id} onChange={() => setShip(s.id)} />
                  <span>
                    {s.label}
                    <small>{s.note}</small>
                  </span>
                  <b>{s.price ? formatMoney(s.price) : 'Free'}</b>
                </label>
              ))}
            </div>
          </section>
          <section>
            <h2>Payment</h2>
            <div className="hc-pay">
              <b>Payments are switched off in this demo</b>
              <p>No card details are requested. Placing a demo order clears your cart and shows a sample confirmation — nothing is charged or dispatched.</p>
            </div>
          </section>
          <button type="submit" className="hc-btn hc-btn--wide" disabled={busy}>
            {busy ? 'Placing demo order…' : 'Place demo order'}
          </button>
        </form>
        <Summary lines={lines} subtotal={subtotal} shipping={shipping.price} />
      </div>
    </Shell>
  );
}

export function ConfirmationPage() {
  const order = useMemo<DemoOrder | null>(() => {
    try {
      return JSON.parse(sessionStorage.getItem(ORDER_KEY) ?? 'null');
    } catch {
      return null;
    }
  }, []);
  if (!order)
    return (
      <Shell title="Order confirmation">
        <div className="hc-empty">
          <h1>No recent demo order</h1>
          <Link to={SHOP_ROUTES.department('head-fi')} className="hc-btn">
            Continue shopping
          </Link>
        </div>
      </Shell>
    );
  return (
    <Shell title="Thank you">
      <div className="hc-grid">
        <div className="hc-form hc-done">
          <p className="hc-ref">Confirmation #{order.ref}</p>
          <h1>Thank you, {order.name.split(' ')[0]}</h1>
          <section className="hc-box">
            <h2>Your demo order is complete</h2>
            <p>This was a demonstration — no payment was taken and no real order was placed. In the live store you would receive a confirmation email at {order.email}.</p>
          </section>
          <section className="hc-box">
            <h2>Order details</h2>
            <dl className="hc-details">
              <div>
                <dt>Contact</dt>
                <dd>{order.email}</dd>
              </div>
              <div>
                <dt>Shipping address</dt>
                <dd>
                  {order.name}
                  <br />
                  {order.address}
                </dd>
              </div>
              <div>
                <dt>Shipping method</dt>
                <dd>{order.shipping.label}</dd>
              </div>
              <div>
                <dt>Payment</dt>
                <dd>None — demonstration</dd>
              </div>
            </dl>
          </section>
          <Link to={SHOP_ROUTES.department('head-fi')} className="hc-btn">
            Continue shopping
          </Link>
        </div>
        <Summary lines={order.lines} subtotal={order.subtotal} shipping={order.shipping.price} />
      </div>
    </Shell>
  );
}
