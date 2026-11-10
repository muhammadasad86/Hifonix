import { CART_KEY } from './config';
import { money } from './money';
import type { Cart, CartLine, CartService } from './types';

/**
 * Demo cart — kept in this browser (localStorage), so it survives navigation
 * and refreshes. Each line stores a snapshot of what was added (title, option
 * values, unit price, image). Nothing is sold online: the cart is an enquiry
 * list and its call-to-action requests a quote (ui/shop/parts EnquireButton).
 * A Shopify cart adapter can replace this file behind the same CartService.
 */
interface Stored {
  id: string;
  lines: { id: string; quantity: number; merchandise: CartLine['merchandise'] }[];
}
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
let memory: Stored | null = null;
const read = (): Stored | null => {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as Stored) : memory;
  } catch {
    return memory;
  }
};
const save = (s: Stored) => {
  memory = s;
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(s));
  } catch {
    /* private mode: kept in memory for this tab */
  }
};
const load = (id: string) => {
  const s = read();
  return s && s.id === id ? s : null;
};

function toCart(s: Stored): Cart {
  const lines: CartLine[] = s.lines.map((l) => ({
    id: l.id,
    quantity: l.quantity,
    merchandise: l.merchandise,
    cost: { total: money(l.merchandise.price.amount * l.quantity, l.merchandise.price.currencyCode) },
  }));
  const subtotal = lines.reduce((a, l) => a + l.cost.total.amount, 0);
  return {
    id: s.id,
    totalQuantity: lines.reduce((a, l) => a + l.quantity, 0),
    lines,
    cost: { subtotal: money(subtotal), total: money(subtotal) },
  };
}

export const localCart: CartService = {
  async createCart() {
    const s: Stored = { id: `local-cart-${Date.now().toString(36)}`, lines: [] };
    save(s);
    return toCart(s);
  },
  async getCart(id) {
    const s = load(id);
    return s ? toCart(s) : null;
  },
  async addLines(cartId, lines) {
    await wait(380); // a beat of feedback, like a network round trip
    const s = load(cartId) ?? { id: cartId, lines: [] };
    for (const l of lines) {
      const hit = s.lines.find((x) => x.merchandise.id === l.merchandise.id);
      if (hit) {
        hit.quantity += l.quantity;
        hit.merchandise = l.merchandise; // refresh snapshot (price / image)
      } else s.lines.push({ id: `line-${Math.random().toString(36).slice(2, 9)}`, quantity: l.quantity, merchandise: l.merchandise });
    }
    save(s);
    return toCart(s);
  },
  async updateLines(cartId, lines) {
    await wait(160);
    const s = load(cartId);
    if (!s) throw new Error('Your cart has expired — please add the item again.');
    for (const l of lines) {
      const hit = s.lines.find((x) => x.id === l.id);
      if (hit) hit.quantity = Math.max(0, Math.min(99, l.quantity));
    }
    s.lines = s.lines.filter((l) => l.quantity > 0);
    save(s);
    return toCart(s);
  },
  async removeLines(cartId, ids) {
    await wait(160);
    const s = load(cartId);
    if (!s) throw new Error('Your cart has expired.');
    s.lines = s.lines.filter((l) => !ids.includes(l.id));
    save(s);
    return toCart(s);
  },
  async clear(cartId) {
    const s: Stored = { id: cartId, lines: [] };
    save(s);
    return toCart(s);
  },
};
