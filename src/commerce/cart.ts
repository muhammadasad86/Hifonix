import { create } from 'zustand';
import { cartService as commerce } from '.';
import { CART_KEY } from './config';
import type { Cart, Product, Variant } from './types';

/**
 * Cart state. Every mutation goes through the CartService and the UI renders
 * the cart it returns (quantities and totals are never patched locally), so
 * swapping the demo cart for a Shopify cart later changes no component.
 */
type Status = 'idle' | 'loading' | 'ready' | 'error';
export interface AddedNotice {
  key: number;
  title: string;
  variant: string;
  quantity: number;
  image?: string;
}
interface CartState {
  cart: Cart | null;
  status: Status;
  /** line ids with a pending mutation (quantity / remove feedback) */
  busy: Record<string, boolean>;
  error: string | null;
  drawerOpen: boolean;
  added: AddedNotice | null;
  init: () => Promise<void>;
  add: (product: Product, variant: Variant, quantity: number) => Promise<boolean>;
  checkoutDone: () => Promise<void>;
  setQuantity: (lineId: string, quantity: number) => Promise<void>;
  remove: (lineId: string) => Promise<void>;
  openDrawer: (open: boolean) => void;
  clearNotice: () => void;
}

const ID_KEY = `${CART_KEY}.id`;
const storeId = (id: string | null) => {
  try {
    if (id) localStorage.setItem(ID_KEY, id);
    else localStorage.removeItem(ID_KEY);
  } catch {
    /* ignore */
  }
};
const storedId = () => {
  try {
    return localStorage.getItem(ID_KEY);
  } catch {
    return null;
  }
};
const message = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong. Please try again.');

let initPromise: Promise<void> | null = null;

export const useCart = create<CartState>((set, get) => {
  const ensure = async () => {
    await get().init();
    let cart = get().cart;
    if (!cart) {
      cart = await commerce.createCart();
      storeId(cart.id);
      set({ cart });
    }
    return cart;
  };
  const mutate = async (lineId: string, run: (cartId: string) => Promise<Cart>) => {
    const cart = await ensure();
    set((s) => ({ busy: { ...s.busy, [lineId]: true }, error: null }));
    try {
      set({ cart: await run(cart.id) });
    } catch (e) {
      set({ error: message(e) });
    } finally {
      set((s) => {
        const busy = { ...s.busy };
        delete busy[lineId];
        return { busy };
      });
    }
  };

  return {
    cart: null,
    status: 'idle',
    busy: {},
    error: null,
    drawerOpen: false,
    added: null,
    init: () => {
      if (initPromise) return initPromise;
      set({ status: 'loading' });
      initPromise = (async () => {
        try {
          const id = storedId();
          const cart = id ? await commerce.getCart(id) : null;
          if (id && !cart) storeId(null); // expired / completed checkout
          set({ cart, status: 'ready' });
        } catch (e) {
          set({ status: 'error', error: message(e) });
        }
      })();
      return initPromise;
    },
    add: async (product, variant, quantity) => {
      if (!variant || !Number.isInteger(quantity) || quantity < 1) {
        set({ error: 'Please choose an option and a quantity.' });
        return false;
      }
      if (!variant.availableForSale || product.available === false) {
        set({ error: 'This item is currently unavailable.' });
        return false;
      }
      set({ error: null });
      try {
        const cart = await ensure();
        const image = variant.image ?? product.featuredImage;
        const next = await commerce.addLines(cart.id, [
          {
            quantity,
            merchandise: {
              id: variant.id,
              title: variant.title,
              selectedOptions: variant.selectedOptions,
              price: variant.price,
              image,
              product: { handle: product.handle, title: product.title, vendor: product.vendor },
            },
          },
        ]);
        set({ cart: next, added: { title: product.title, variant: variant.title, image: image.url, quantity, key: Date.now() } });
        return true;
      } catch (e) {
        set({ error: message(e) });
        return false;
      }
    },
    setQuantity: (lineId, quantity) =>
      mutate(lineId, (id) => (quantity < 1 ? commerce.removeLines(id, [lineId]) : commerce.updateLines(id, [{ id: lineId, quantity }]))),
    remove: (lineId) => mutate(lineId, (id) => commerce.removeLines(id, [lineId])),
    checkoutDone: async () => {
      const c = get().cart;
      if (c) set({ cart: await commerce.clear(c.id) });
    },
    openDrawer: (open) => set({ drawerOpen: open }),
    clearNotice: () => set({ added: null }),
  };
});

export const cartCount = (c: Cart | null) => c?.totalQuantity ?? 0;
