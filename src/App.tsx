import { lazy, Suspense, useEffect } from 'react';
import { PAGES, ROUTE_ALIASES, ROUTES } from './config/navigation';
import { matchShopRoute } from './config/shop';
import { useSyncReducedMotion } from './hooks/usePrefersReducedMotion';
import { navigate, usePath } from './router';

const Home = lazy(() => import('./home/Home'));
const Studio = lazy(() => import('./pages/Studio'));
const HiFiLanding = lazy(() => import('./pages/hifi/HiFiLanding'));
const HeadphonesLanding = lazy(() => import('./pages/headphones/HeadphonesLanding'));
const Landing = lazy(() => import('./pages/Landing'));
const Splash = lazy(() => import('./pages/splash/Splash'));
const ShopPage = lazy(() => import('./pages/shop/ShopPage'));
const AdminPage = lazy(() => import('./pages/admin/AdminPage'));
const InfoPage = lazy(() => import('./pages/info/InfoPages'));
const INFO_ROUTES = new Set([PAGES.about.route, PAGES.contact.route, PAGES.storeLocation.route, PAGES.careers.route, PAGES.privacy.route, PAGES.terms.route]);

/** Route table. Landing pages resolve through config/navigation.ts. */
export default function App() {
  useSyncReducedMotion();
  const raw = usePath();
  const alias = ROUTE_ALIASES[raw];
  useEffect(() => {
    if (alias) navigate(alias, { replace: true });
  }, [alias]);
  const path = alias ?? raw;
  const shop = matchShopRoute(path);
  let page;
  if (path === ROUTES.home) page = <Home />;
  else if (path === ROUTES.studio) page = <Studio />;
  else if (path === ROUTES.splash) page = <Splash />;
  else if (path === ROUTES.hiFi) page = <HiFiLanding />;
  else if (path === ROUTES.headphones) page = <HeadphonesLanding />;
  else if (path === '/admin' || path.startsWith('/admin/')) page = <AdminPage />;
  else if (INFO_ROUTES.has(path)) page = <InfoPage path={path} />;
  else if (shop) page = <ShopPage match={shop} />;
  else page = <Landing path={path} />;
  return <Suspense fallback={null}>{page}</Suspense>;
}
