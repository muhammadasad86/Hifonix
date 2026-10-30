import { type ReactNode, useEffect, useRef } from 'react';
import { useCart } from '../../commerce/cart';
import { ScrollRoot, useReducedMotion, useSmoothWheel } from '../chrome/scroll';
import { SiteFooter } from '../chrome/SiteFooter';
import { CartDrawer } from './CartDrawer';
import { DemoNotice } from './parts';
import { ShopHeader } from './ShopHeader';
import '../../pages/hifi/hifi.css';
import './shop.css';

/**
 * Shell shared by every shopping page: scroll root (same smooth-wheel
 * behaviour as the landing pages), shop header with mega menus, the quick
 * cart drawer and the site footer.
 */
export function ShopLayout({ tone, title, children }: { tone: 'overlay' | 'solid'; title: string; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const init = useCart((s) => s.init);
  useSmoothWheel(root, !reduced);
  useEffect(() => {
    init();
  }, [init]);
  useEffect(() => {
    const prev = document.title;
    document.title = `${title} — Hifonix Studios`;
    return () => {
      document.title = prev;
    };
  }, [title]);
  return (
    <ScrollRoot.Provider value={root}>
      <div ref={root} className="hf hs" data-tone={tone}>
        <ShopHeader tone={tone} />
        <main className="hs-main">{children}</main>
        <SiteFooter />
        <CartDrawer />
        <DemoNotice />
      </div>
    </ScrollRoot.Provider>
  );
}
