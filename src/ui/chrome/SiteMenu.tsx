import {
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { MENU_CATEGORIES, MENU_LINKS, PAGES, type MenuCategory } from '../../config/navigation';
import { brandHandle, SHOP_ROUTES, slugify } from '../../config/shop';
import { Link } from '../../router';
import { BottomBar } from './BottomBar';
import { useMediaQuery } from './scroll';

const A = '/hifi';
type CatId = MenuCategory['id'];

/**
 * Figma component "Menu" (1125:16013), opened as an overlay from the header's
 * Menu button. Default state lists the six categories; hovering one (or
 * opening it with click / tap / Enter) switches to that category's variant:
 * the other categories blur (layer blur 11), its "+" turns into "×" and the
 * sub-menu dissolves in below it, left-aligned to the category — 0.3 s ease-out,
 * as the prototype's smart-animate. Leaving the category returns to Default.
 * Below 1024px the sub-menus open as an accordion.
 */
export function SiteMenu({
  open,
  path,
  onNavigate,
  panelRef,
}: {
  open: boolean;
  path: string;
  onNavigate: () => void;
  panelRef: RefObject<HTMLDivElement>;
}) {
  const desktop = useMediaQuery('(min-width: 1024px)');
  const hover = useMediaQuery('(hover: hover) and (pointer: fine)');
  const [active, setActive] = useState<CatId | null>(null);
  const [pos, setPos] = useState<Partial<Record<CatId, number>>>({});
  const nav = useRef<HTMLDivElement>(null);
  const leave = useRef(0);

  const cancelLeave = () => window.clearTimeout(leave.current);
  const show = useCallback((id: CatId | null) => {
    window.clearTimeout(leave.current);
    setActive(id);
  }, []);

  // back to the Default variant once the overlay has faded out
  useEffect(() => {
    if (open) return;
    const t = window.setTimeout(() => setActive(null), 320);
    return () => window.clearTimeout(t);
  }, [open]);
  useEffect(() => () => window.clearTimeout(leave.current), []);

  // sub-menus start at their category's left edge (Figma), kept inside the nav
  useLayoutEffect(() => {
    const el = nav.current;
    if (!el || !desktop) return;
    const measure = () => {
      const next: Partial<Record<CatId, number>> = {};
      el.querySelectorAll<HTMLElement>('[data-cat]').forEach((li) => {
        const id = li.dataset.cat as CatId;
        const btn = li.querySelector<HTMLElement>('.hf-menu__cat');
        const panel = li.querySelector<HTMLElement>('.hf-menu__sub');
        if (!btn || !panel) return;
        next[id] = Math.max(0, Math.min(btn.offsetLeft, el.clientWidth - panel.offsetWidth));
      });
      setPos(next);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => ro.disconnect();
  }, [desktop]);

  const enter = (id: CatId) => (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && hover && desktop) show(id);
  };
  const exit = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse' || !hover || !desktop) return;
    cancelLeave();
    leave.current = window.setTimeout(() => setActive(null), 140);
  };
  const click = (id: CatId) => (e: MouseEvent) => {
    // mouse on desktop: hover already opened it — a click keeps it open;
    // keyboard (detail 0) and touch toggle
    if (hover && desktop && e.detail > 0) show(id);
    else show(active === id ? null : id);
  };
  const blur = (id: CatId) => (e: FocusEvent<HTMLLIElement>) => {
    const to = e.relatedTarget as Node | null;
    if (active === id && to && !e.currentTarget.contains(to) && nav.current?.contains(to)) show(null);
  };
  const key = (e: KeyboardEvent) => {
    if (e.key !== 'Escape' || !active) return;
    e.stopPropagation(); // first Escape closes the sub-menu, the next one the overlay
    nav.current?.querySelector<HTMLElement>(`[data-cat='${active}'] .hf-menu__cat`)?.focus();
    show(null);
  };

  return (
    <div
      id="hf-menu"
      ref={panelRef}
      className="hf-menu"
      data-open={open || undefined}
      aria-hidden={!open}
      onKeyDown={key}
    >
      <div className="hf-menu__body">
        <nav ref={nav} className="hf-menu__nav" aria-label="Categories">
          <ul className="hf-menu__cats" data-active={active ?? undefined}>
            {MENU_CATEGORIES.map((c) => {
              const on = active === c.id;
              return (
                <li
                  key={c.id}
                  data-cat={c.id}
                  data-active={on || undefined}
                  onPointerEnter={enter(c.id)}
                  onPointerLeave={exit}
                  onBlur={blur(c.id)}
                  style={{ '--pl': `${pos[c.id] ?? 0}px` } as CSSProperties}
                >
                  <button
                    type="button"
                    className="hf-menu__cat"
                    aria-expanded={on}
                    aria-controls={`hf-menu-${c.id}`}
                    onClick={click(c.id)}
                  >
                    <span>{c.label}</span>
                    <img src={`${A}/menu-plus.svg`} alt="" />
                  </button>
                  <div
                    id={`hf-menu-${c.id}`}
                    className={`hf-menu__sub${c.brands ? ' hf-menu__sub--brands' : ''}`}
                    onPointerEnter={cancelLeave}
                  >
                    <div className="hf-menu__subin">
                      {c.columns && (
                        <div className="hf-menu__cols">
                          {c.columns.map((col, ci) => (
                            <ul key={ci} className="hf-menu__col">
                              {col.map((label, li) => (
                                <li key={`${label}-${li}`}>
                                  <Link
                                    to={ci === 0 && li === 0 ? SHOP_ROUTES.department(c.id) : SHOP_ROUTES.collection(slugify(label))}
                                    onClick={onNavigate}
                                    tabIndex={on ? 0 : -1}
                                    aria-current={(ci === 0 && li === 0 ? SHOP_ROUTES.department(c.id) : SHOP_ROUTES.collection(slugify(label))) === path ? 'page' : undefined}
                                  >
                                    {label}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          ))}
                        </div>
                      )}
                      {c.brands && (
                        <ul className="hf-menu__brands">
                          {c.brands.map((b, bi) => (
                            <li key={`${b.label}-${bi}`} style={{ '--w': b.w } as CSSProperties}>
                              <Link to={SHOP_ROUTES.brand(brandHandle(b.label))} onClick={onNavigate} tabIndex={on ? 0 : -1} aria-label={b.label}>
                                <img src={b.logo} alt="" loading="lazy" />
                              </Link>
                            </li>
                          ))}
                          <li className="hf-menu__more">
                            <Link to={PAGES.brands.route} onClick={onNavigate} tabIndex={on ? 0 : -1} className="hf-uline">
                              100+ more
                              <img className="hf-uline__bar" src={`${A}/nav-underline.svg`} alt="" />
                            </Link>
                          </li>
                        </ul>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </nav>
        <ul className="hf-menu__links">
          {MENU_LINKS.map((l) => (
            <li key={l.label}>
              <Link to={l.to} onClick={onNavigate} className="hf-uline">
                {l.label}
                <img className="hf-uline__bar" src={`${A}/menu-underline.svg`} alt="" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <BottomBar variant="glass" className="hf-menu__bar" />
    </div>
  );
}
