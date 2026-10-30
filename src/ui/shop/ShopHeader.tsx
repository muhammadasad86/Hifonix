import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import { cartCount, useCart } from '../../commerce/cart';
import { MENU_CATEGORIES, ROUTES } from '../../config/navigation';
import { brandHandle, DEPARTMENTS, SHOP_ROUTES } from '../../config/shop';
import { Link, usePath } from '../../router';
import { SiteMenu } from '../chrome/SiteMenu';
import { useMediaQuery, useScrollFrame, useScrollRootEl } from '../chrome/scroll';
import { SIcon } from './icons';
import { SearchPanel } from './SearchPanel';

const A = '/hifi';
type MegaId = (typeof MENU_CATEGORIES)[number]['id'];

/**
 * Shop header — Figma Header.v4(Hi-Fi) shop variant (2155:81818): logo · six
 * mega-menu triggers · search · Cart (count). Over a hero it is transparent
 * with white type (tone "overlay"); on white pages it is white with ink type.
 * Scrolling: turns to the glass treatment and tucks away while scrolling down.
 * Below 1024px: logo · search · Cart · menu button (opens the site Menu).
 */
export function ShopHeader({ tone }: { tone: 'overlay' | 'solid' }) {
  const path = usePath();
  const root = useScrollRootEl();
  const desktop = useMediaQuery('(min-width: 1024px)');
  const count = useCart((s) => cartCount(s.cart));
  const openDrawer = useCart((s) => s.openDrawer);
  const [mega, setMega] = useState<MegaId | null>(null);
  const [search, setSearch] = useState(false);
  const [menu, setMenu] = useState(false);
  const [solid, setSolid] = useState(false);
  const [tucked, setTucked] = useState(false);
  const last = useRef(0);
  const leave = useRef(0);
  const nav = useRef<HTMLElement>(null);
  const menuPanel = useRef<HTMLDivElement>(null);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<Partial<Record<MegaId, number>>>({});

  useScrollFrame((y) => {
    setSolid(y > 24);
    const dy = y - last.current;
    if (Math.abs(dy) > 6) setTucked(dy > 0 && y > 480);
    last.current = y;
  });

  const close = useCallback(() => {
    setMega(null);
    setSearch(false);
    setMenu(false);
  }, []);
  useEffect(close, [path, close]);

  // Escape closes whatever is open; menu overlay locks page scroll like the landing pages
  useEffect(() => {
    const el = root?.current;
    if (el) el.dataset.locked = menu ? 'true' : '';
    menuPanel.current?.toggleAttribute('inert', !menu);
    if (!mega && !search && !menu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (menu) menuBtn.current?.focus();
      close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mega, search, menu, root, close]);

  // mega panels align to their trigger (Figma), kept inside the viewport
  useEffect(() => {
    const el = nav.current;
    if (!el || !desktop) return;
    const measure = () => {
      const next: Partial<Record<MegaId, number>> = {};
      el.querySelectorAll<HTMLElement>('[data-mega]').forEach((b) => {
        next[b.dataset.mega as MegaId] = b.getBoundingClientRect().left;
      });
      setPos(next);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [desktop]);

  const hoverOpen = (id: MegaId) => () => {
    window.clearTimeout(leave.current);
    if (matchMedia('(hover: hover)').matches) setMega(id);
  };
  const hoverClose = () => {
    window.clearTimeout(leave.current);
    leave.current = window.setTimeout(() => setMega(null), 160);
  };
  const keep = () => window.clearTimeout(leave.current);

  const lit = tone === 'solid' || solid || mega !== null || search;
  const active = MENU_CATEGORIES.find((c) => c.id === mega);
  const dept = DEPARTMENTS.find((d) => d.id === mega);

  return (
    <>
      <header
        className="hf-header hs-header"
        data-tone={lit ? 'light' : 'dark'}
        data-solid={(solid && !mega && !menu) || undefined}
        data-tucked={(tucked && !mega && !search && !menu) || undefined}
        data-mega={mega ?? undefined}
      >
        <Link to={ROUTES.splash} className="hf-logo hs-logo" aria-label="Hifonix Studios — start">
          <img className="hf-logo__mark" src={lit ? '/shop/ui/logo-mark-dark.svg' : `${A}/logo-mark.svg`} alt="" />
          <img className="hf-logo__word" src={lit ? '/shop/ui/logo-word-dark.svg' : `${A}/logo-word.svg`} alt="" />
        </Link>
        {desktop && (
          <nav ref={nav} className="hs-nav" aria-label="Shop">
            {MENU_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                className="hs-nav__btn"
                data-mega={c.id}
                aria-expanded={mega === c.id}
                aria-controls="hs-mega"
                onPointerEnter={hoverOpen(c.id)}
                onPointerLeave={hoverClose}
                onClick={() => setMega((m) => (m === c.id ? null : c.id))}
              >
                <span>{c.label}</span>
                <SIcon name="plus" size={14} stroke={2.2} className="hs-nav__plus" />
              </button>
            ))}
          </nav>
        )}
        <div className="hs-header__end">
          <button type="button" className="hs-icon-btn" aria-label="Search" aria-expanded={search} onClick={() => setSearch((s) => !s)}>
            <SIcon name="search" size={19} />
          </button>
          <button type="button" className="hs-cart-btn" onClick={() => openDrawer(true)} aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}>
            Cart <sup key={count}>{String(count).padStart(2, '0')}</sup>
          </button>
          {!desktop && (
            <button ref={menuBtn} type="button" className="hs-icon-btn" aria-label={menu ? 'Close menu' : 'Open menu'} aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
              <SIcon name={menu ? 'x' : 'menu'} size={22} />
            </button>
          )}
        </div>
      </header>

      {/* mega menu panel (Figma 1934:37988 Hi-Fi … 1934:38015 Brands) */}
      <div
        id="hs-mega"
        className={`hs-mega${active?.brands ? ' hs-mega--brands' : ''}`}
        data-open={(desktop && mega !== null) || undefined}
        onPointerEnter={keep}
        onPointerLeave={hoverClose}
        style={{ '--x': `${pos[mega ?? 'hi-fi'] ?? 0}px` } as CSSProperties}
      >
        {dept && (
          <div className="hs-mega__cols" key={dept.id}>
            <ul>
              <li>
                <Link to={SHOP_ROUTES.department(dept.id)}>{active?.columns?.[0][0]}</Link>
              </li>
              {dept.categories.map((c) => (
                <li key={c.handle}>
                  <Link to={SHOP_ROUTES.collection(c.handle)}>{c.title}</Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        {active?.brands && (
          <ul className="hs-mega__brands" key="brands">
            {active.brands.map((b, i) => (
              <li key={`${b.label}-${i}`} style={{ '--w': b.w } as CSSProperties}>
                <Link to={SHOP_ROUTES.brand(brandHandle(b.label))} aria-label={b.label}>
                  <img src={b.logo} alt="" loading="lazy" />
                </Link>
              </li>
            ))}
            <li className="hs-mega__more">
              <Link to={SHOP_ROUTES.brands}>100+ more</Link>
            </li>
          </ul>
        )}
      </div>
      <div className="hs-scrim" data-open={(desktop && mega !== null) || search || undefined} onClick={close} aria-hidden="true" />
      <SearchPanel open={search} onClose={() => setSearch(false)} />
      {!desktop && <SiteMenu open={menu} path={path} onNavigate={close} panelRef={menuPanel} />}
    </>
  );
}
