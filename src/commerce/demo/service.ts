import type { CatalogService, Product, ProductQuery } from '../types';
import { DEMO_PRODUCTS } from './catalog';

/** Demo catalogue adapter — used when the Supabase CMS is not configured. */
const wait = (ms = 220) => new Promise((r) => setTimeout(r, ms));

export function queryProducts(all: Product[], q: ProductQuery) {
  let list = all;
  if (q.collection && q.collection !== 'all') list = list.filter((p) => p.collections.includes(q.collection!));
  if (q.department) list = list.filter((p) => p.departments.includes(q.department!));
  if (q.brand) list = list.filter((p) => p.brandHandle === q.brand);
  if (q.price) list = list.filter((p) => p.priceRange.min.amount <= q.price![1] && p.priceRange.max.amount >= q.price![0]);
  const s = [...list];
  switch (q.sort) {
    case 'price-asc':
      return s.sort((a, b) => a.priceRange.min.amount - b.priceRange.min.amount);
    case 'price-desc':
      return s.sort((a, b) => b.priceRange.min.amount - a.priceRange.min.amount);
    case 'title-asc':
      return s.sort((a, b) => a.title.localeCompare(b.title));
    default:
      return s;
  }
}

export const demoCatalog: CatalogService = {
  mode: 'demo',
  async getProducts(q) {
    await wait();
    return queryProducts(DEMO_PRODUCTS, q);
  },
  async getProduct(handle) {
    await wait(160);
    return DEMO_PRODUCTS.find((p) => p.handle === handle) ?? null;
  },
  async getRecommendations(handle, limit) {
    await wait(120);
    return DEMO_PRODUCTS.filter((p) => p.handle !== handle).slice(0, limit);
  },
};
