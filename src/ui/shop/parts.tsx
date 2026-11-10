import { type ReactNode, useState } from 'react';
import { DATA_MODE, type OptionValue } from '../../commerce';
import { useCart } from '../../commerce/cart';
import { PAGES } from '../../config/navigation';
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

/** Demonstration ribbon — nothing can be bought online; the cart is an enquiry list. */
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
          {DATA_MODE === 'demo' ? ' — sample products. ' : ' — '}Nothing is sold online: your cart is an enquiry list our team can quote on.
        </span>
        <span className="hs-demo__short"> · nothing is sold online</span>
      </span>
      <button type="button" onClick={close} aria-label="Dismiss demo notice">
        <SIcon name="x" size={16} />
      </button>
    </div>
  );
}

/**
 * Cart call-to-action. There is no online payment: the cart is an enquiry
 * list and this sends the visitor to the Contact page to request a quote.
 */
export function EnquireButton({ className = '' }: { className?: string }) {
  const cart = useCart((s) => s.cart);
  const openDrawer = useCart((s) => s.openDrawer);
  const empty = !cart || cart.totalQuantity === 0;
  const go = () => {
    if (empty) return;
    openDrawer(false);
    navigate(PAGES.contact.route);
  };
  return (
    <div className={`hs-enquire ${className}`}>
      <button type="button" className="hs-btn hs-btn--accent hs-enquire__btn" onClick={go} disabled={empty}>
        <span>Request a quote</span>
      </button>
      <p className="hs-enquire__info">Our specialists will confirm price, availability and delivery with you.</p>
    </div>
  );
}

