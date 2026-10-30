import { CURRENCY } from './config';
import type { Money, Product } from './types';

const fmt = new Map<string, Intl.NumberFormat>();
export function formatMoney(m: Money | number, currencyCode = CURRENCY.code) {
  const amount = typeof m === 'number' ? m : m.amount;
  const code = typeof m === 'number' ? currencyCode : m.currencyCode;
  const cents = Math.round(amount * 100) % 100 !== 0;
  const key = `${code}${cents}`;
  if (!fmt.has(key))
    fmt.set(key, new Intl.NumberFormat(CURRENCY.locale, { style: 'currency', currency: code, minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: 2 }));
  return fmt.get(key)!.format(amount);
}

/** Card price line: "£4,700", "£3,795 – £3,945" or "FROM £8,595" (Figma). */
export function priceLabel(p: Product) {
  const { min, max } = p.priceRange;
  if (p.priceFrom) return `FROM ${formatMoney(min)}`;
  return min.amount === max.amount ? formatMoney(min) : `${formatMoney(min)} – ${formatMoney(max)}`;
}

export const money = (amount: number, currencyCode = CURRENCY.code): Money => ({ amount, currencyCode });
