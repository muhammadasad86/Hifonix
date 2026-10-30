import { type ReactNode, useEffect, useState } from 'react';
import { DATA_MODE, formatMoney, type OptionValue } from '../../commerce';
import { useCart } from '../../commerce/cart';
import { SHOP_ROUTES } from '../../config/shop';
import { Link, navigate } from '../../router';
import { SIcon } from './icons';

/** Quantity stepper (Figma 160 × 61 / 160 × 80 box: − value +). */
export function QtyStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  busy,
  size = 'md',
  label = 'Quantity',
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  busy?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}) {
  const [bump, setBump] = useState(0);
  const set = (n: number) => {
    const v = Math.max(min, Math.min(max, n));
    if (v !== value) {
      setBump((b) => b + 1);
      onChange(v);
    }
  };
  return (
    <div className={`hs-qty hs-qty--${size}`} data-busy={busy || undefined} role="group" aria-label={label}>
      <button type="button" onClick={() => set(value - 1)} disabled={busy || value <= min} aria-label="Decrease quantity">
        <SIcon name="minus" size={24} />
      </button>
      <output key={bump} aria-live="polite">
        {value}
      </output>
      <button type="button" onClick={() => set(value + 1)} disabled={busy || value >= max} aria-label="Increase quantity">
        <SIcon name="plus" size={24} />
      </button>
    </div>
  );
}

/** Colour / texture swatch dot (Figma 30px card swatches, 32px PDP swatches). */
export function Swatch({ v, size = 30 }: { v: OptionValue; size?: number }) {
  const s = v.swatch;
  return (
    <span
      className="hs-swatch"
      style={{ width: size, height: size, background: s?.image ? `center / cover url(${s.image})` : (s?.color ?? '#ddd') }}
      aria-hidden="true"
    />
  );
}

export function Breadcrumb({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav className="hs-crumbs" aria-label="Breadcrumb">
      <ol>
        {items.map((it, i) => (
          <li key={`${it.label}-${i}`}>
            {it.to && i < items.length - 1 ? <Link to={it.to}>{it.label}</Link> : <span aria-current={i === items.length - 1 ? 'page' : undefined}>{it.label}</span>}
            {i < items.length - 1 && <SIcon name="chevron-right" size={16} stroke={1.4} />}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function StateNote({ kind, title, children, action }: { kind: 'empty' | 'error'; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className={`hs-note hs-note--${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      <p className="hs-note__t">{title}</p>
      {children && <p className="hs-note__b">{children}</p>}
      {action}
    </div>
  );
}

/** "Loading more…" mark (Figma 70px rotating diamond animation). */
export function Loader({ label }: { label: string }) {
  return (
    <div className="hs-loader" role="status">
      <span className="hs-loader__mark" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span>{label}</span>
    </div>
  );
}

/** Demonstration ribbon — the checkout takes no payment and places no real order. */
export function DemoNotice() {
  const [hide, setHide] = useState(() => {
    try {
      return sessionStorage.getItem('hifonix.demoNotice') === 'hidden';
    } catch {
      return false;
    }
  });
  if (hide) return null;
  const close = () => {
    setHide(true);
    try {
      sessionStorage.setItem('hifonix.demoNotice', 'hidden');
    } catch {
      /* ignore */
    }
  };
  return (
    <div className="hs-demo" role="note">
      <span>
        <b>Demo store</b>
        <span className="hs-demo__long">
          {DATA_MODE === 'demo' ? ' — sample products; ' : ' — '}checkout is a demonstration: no payment is taken and no order is placed.
        </span>
        <span className="hs-demo__short"> · demonstration checkout</span>
      </span>
      <button type="button" onClick={close} aria-label="Dismiss demo notice">
        <SIcon name="x" size={16} />
      </button>
    </div>
  );
}

/** Checkout button → the demonstration checkout (requires the Terms checkbox, as in Figma). */
export function CheckoutButton({ agreed, onNeedAgree, className = '' }: { agreed: boolean; onNeedAgree: () => void; className?: string }) {
  const cart = useCart((s) => s.cart);
  const openDrawer = useCart((s) => s.openDrawer);
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => setNote(null), [agreed]);
  const total = cart?.cost.total;
  const empty = !cart || cart.totalQuantity === 0;
  const go = () => {
    if (empty) return;
    if (!agreed) {
      onNeedAgree();
      setNote('Please agree to the Terms and Conditions to continue.');
      return;
    }
    openDrawer(false);
    navigate(SHOP_ROUTES.checkout);
  };
  return (
    <div className={`hs-checkout ${className}`}>
      <button type="button" className="hs-btn hs-btn--accent hs-checkout__btn" onClick={go} disabled={empty}>
        <span>Checkout</span>
        {total && <span className="hs-checkout__amt">{formatMoney(total)}</span>}
      </button>
      {note && (
        <p className="hs-checkout__note" role="alert">
          {note}
        </p>
      )}
    </div>
  );
}

export function TermsCheck({ checked, onChange, flash }: { checked: boolean; onChange: (v: boolean) => void; flash?: number }) {
  return (
    <label className="hs-terms" data-flash={flash || undefined} key={flash}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="hs-terms__box" aria-hidden="true" />
      <span>
        I agree with the <Link to="/pages/terms-and-conditions">Terms and Conditions</Link>
      </span>
    </label>
  );
}
