import { cmsCatalog } from './cms';
import { CMS_CONFIGURED } from './config';
import { demoCatalog } from './demo/service';
import { localCart } from './localCart';
import type { CartService, CatalogService } from './types';

/**
 * Active data layer. Catalogue: Supabase CMS when configured, else the demo
 * catalogue. Cart: the browser-local demo cart. Pages only use `catalog` /
 * `cart`, so a Shopify adapter can replace either one later.
 */
export const catalog: CatalogService = CMS_CONFIGURED ? cmsCatalog : demoCatalog;
export const cartService: CartService = localCart;
export const DATA_MODE = catalog.mode;
export * from './types';
export { formatMoney, priceLabel } from './money';
