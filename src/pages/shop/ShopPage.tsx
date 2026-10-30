import { lazy } from 'react';
import type { RouteMatch } from '../../config/shop';

const ListingPage = lazy(() => import('./ListingPage'));
const BrandsPage = lazy(() => import('./BrandsPage'));
const ProductPage = lazy(() => import('./ProductPage'));
const CartPage = lazy(() => import('./CartPage'));
const CheckoutPage = lazy(() => import('./CheckoutPage'));
const ConfirmationPage = lazy(() => import('./CheckoutPage').then((m) => ({ default: m.ConfirmationPage })));

/** Shop route switch (see config/shop.ts for the route table). */
export default function ShopPage({ match }: { match: RouteMatch }) {
  switch (match.page) {
    case 'department':
      return <ListingPage kind="department" handle={match.id} />;
    case 'collection':
      return <ListingPage kind="collection" handle={match.handle} />;
    case 'brand':
      return <ListingPage kind="brand" handle={match.handle} />;
    case 'brands':
      return <BrandsPage />;
    case 'product':
      return <ProductPage handle={match.handle} />;
    case 'cart':
      return <CartPage />;
    case 'checkout':
      return <CheckoutPage />;
    case 'confirmation':
      return <ConfirmationPage />;
  }
}
