/**
 * Storefront domain types. Pages depend only on these, never on where the data
 * came from (demo catalogue, the Supabase CMS today, Shopify later). The shapes
 * deliberately mirror the Shopify Storefront API (products → options/variants,
 * carts → lines/merchandise) so a Shopify adapter can be added without touching
 * the UI.
 */
export interface Money {
  amount: number;
  currencyCode: string;
}

export interface Img {
  url: string;
  alt: string;
}

export interface OptionValue {
  name: string;
  /** colour swatch (hex) or texture image, when the option is visual */
  swatch?: { color?: string; image?: string };
}

export interface ProductOption {
  name: string;
  values: OptionValue[];
}

export interface SelectedOption {
  name: string;
  value: string;
}

export interface Variant {
  id: string;
  title: string;
  availableForSale: boolean;
  selectedOptions: SelectedOption[];
  price: Money;
  compareAtPrice?: Money | null;
  image?: Img | null;
}

/** Editorial blocks of the product detail page (Shopify metafields / metaobjects later). */
export interface ProductStory {
  /** dark statement band (Figma "Backed by a 10-year warranty…") */
  lead?: { title: string; body: string };
  specs?: { label: string; value: string }[];
  specsImage?: Img;
  /** large statement: first part dark, second part muted */
  statement?: [string, string];
  storyImages?: { pair?: [Img, Img]; wide?: Img };
  colourShowcase?: { option: string; images: Record<string, Img> };
  features?: { heading: [string, string]; images: Img[]; items: { title: string; body: string }[] };
  faq?: { intro: string; items: { q: string; a: string | null }[] };
}

export interface Product {
  id: string;
  handle: string;
  title: string;
  /** second title line on the product page */
  subtitle?: string;
  vendor: string;
  brandHandle: string;
  productType: string;
  /** collection handles this product belongs to */
  collections: string[];
  /** department ids (Hi-Fi, Head-Fi …) */
  departments: string[];
  description: string;
  priceRange: { min: Money; max: Money };
  /** card shows "FROM £x" instead of a range */
  priceFrom?: boolean;
  featuredImage: Img;
  hoverImage?: Img | null;
  images: Img[];
  options: ProductOption[];
  variants: Variant[];
  /** demo availability flag shown in the UI (no stock system yet) */
  available?: boolean;
  /** department (hi-fi, head-fi …) — also listed in `departments` */
  badges?: { demo?: boolean; warranty?: string };
  /** CMS: specifications shown when there is no full editorial story */
  specs?: { label: string; value: string }[];
  story?: ProductStory;
}

export interface CollectionInfo {
  handle: string;
  title: string;
  description?: string;
  /** hero photograph + gallery strip (category / brand pages) */
  hero?: Img | null;
  heroLogo?: Img | null;
  strip?: Img[];
}

export interface CartLine {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    selectedOptions: SelectedOption[];
    price: Money;
    image?: Img | null;
    product: { handle: string; title: string; vendor: string };
  };
  cost: { total: Money };
}

export interface Cart {
  id: string;
  totalQuantity: number;
  lines: CartLine[];
  cost: { subtotal: Money; total: Money };
}

export type SortKey = 'best-selling' | 'price-asc' | 'price-desc' | 'title-asc';

export interface ProductQuery {
  collection?: string;
  department?: string;
  brand?: string;
  sort?: SortKey;
  price?: [number, number] | null;
}

export type CartMerchandise = CartLine['merchandise'];

/** Product data source (demo catalogue · Supabase CMS · Shopify later). */
export interface CatalogService {
  readonly mode: 'demo' | 'cms';
  getProducts(q: ProductQuery): Promise<Product[]>;
  getProduct(handle: string): Promise<Product | null>;
  getRecommendations(handle: string | null, limit: number): Promise<Product[]>;
}

/** Cart backend (browser-local demo cart today; a Shopify cart adapter later). */
export interface CartService {
  createCart(): Promise<Cart>;
  getCart(id: string): Promise<Cart | null>;
  addLines(cartId: string, lines: { merchandise: CartMerchandise; quantity: number }[]): Promise<Cart>;
  updateLines(cartId: string, lines: { id: string; quantity: number }[]): Promise<Cart>;
  removeLines(cartId: string, lineIds: string[]): Promise<Cart>;
  clear(cartId: string): Promise<Cart>;
}
