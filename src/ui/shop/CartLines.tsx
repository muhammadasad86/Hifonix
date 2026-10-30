import { formatMoney, type CartLine } from '../../commerce';
import { useCart } from '../../commerce/cart';
import { SHOP_ROUTES } from '../../config/shop';
import { Link } from '../../router';
import { QtyStepper } from './parts';

/** Cart line (Figma View-Cart 2155:44760): image · title · variant · qty stepper · Remove · price. */
export function CartLineRow({ line, onNavigate }: { line: CartLine; onNavigate?: () => void }) {
  const busy = useCart((s) => !!s.busy[line.id]);
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const m = line.merchandise;
  const variant = m.selectedOptions
    .filter((o) => o.value !== 'Default Title')
    .map((o) => o.value)
    .join(' · ');
  const to = SHOP_ROUTES.product(m.product.handle);
  return (
    <li className="hs-line" data-busy={busy || undefined}>
      <Link to={to} className="hs-line__img" onClick={onNavigate} tabIndex={-1} aria-hidden="true">
        {m.image && <img src={m.image.url} alt="" loading="lazy" />}
      </Link>
      <div className="hs-line__info">
        <div className="hs-line__text">
          <Link to={to} className="hs-line__title" onClick={onNavigate}>
            {m.product.title}
          </Link>
          {variant && <p className="hs-line__variant">{variant}</p>}
        </div>
        <div className="hs-line__ctrl">
          <QtyStepper value={line.quantity} onChange={(n) => setQuantity(line.id, n)} busy={busy} size="sm" label={`Quantity for ${m.product.title}`} />
          <button type="button" className="hs-link" onClick={() => remove(line.id)} disabled={busy}>
            Remove
          </button>
        </div>
      </div>
      <p className="hs-line__price">
        {formatMoney(line.cost.total)}
        {line.quantity > 1 && <span>{formatMoney(m.price)} each</span>}
      </p>
    </li>
  );
}
