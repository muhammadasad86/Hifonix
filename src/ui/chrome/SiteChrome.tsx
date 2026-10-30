import { useCallback, useEffect, useRef, useState } from 'react';
import { HEADER_NAV, ROUTES } from '../../config/navigation';
import { Link, usePath } from '../../router';
import { SiteMenu } from './SiteMenu';
import { useScrollFrame, useScrollRootEl } from './scroll';
import './chrome.css';

const A = '/hifi';

function Logo({ variant }: { variant: 'header' | 'menu' }) {
  const p = variant === 'menu' ? 'menu-logo' : 'logo';
  return (
    <Link to={ROUTES.splash} className="hf-logo" aria-label="Hifonix Studios — start">
      <img className="hf-logo__mark" src={`${A}/${p}-mark.svg`} alt="" />
      <img className="hf-logo__word" src={`${A}/${p}-word.svg`} alt="" />
    </Link>
  );
}

/**
 * Shared content-page chrome: Figma Header.v4 (fixed) + Menu overlay (1125:16013).
 * Header is transparent over the hero, turns to the Figma glass treatment once
 * scrolled, and tucks away while scrolling down.
 */
export function SiteChrome() {
  const path = usePath();
  const root = useScrollRootEl();
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  const [tucked, setTucked] = useState(false);
  const last = useRef(0);
  const btn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useScrollFrame((y) => {
    setSolid(y > 24);
    const dy = y - last.current;
    if (Math.abs(dy) > 6) setTucked(dy > 0 && y > 480);
    last.current = y;
  });

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const el = root?.current;
    if (el) el.dataset.locked = open ? 'true' : '';
    // React 18 has no `inert` prop — set the attribute directly
    panel.current?.toggleAttribute('inert', !open);
    if (!open) return;
    const first = panel.current?.querySelector<HTMLElement>('button, a');
    first?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        btn.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, root]);

  // close the menu on route change
  useEffect(() => setOpen(false), [path]);

  return (
    <>
      <header
        className="hf-header"
        data-solid={(solid && !open) || undefined}
        data-tucked={(tucked && !open) || undefined}
        data-open={open || undefined}
      >
        <Logo variant={open ? 'menu' : 'header'} />
        <nav className="hf-nav" aria-label="Primary">
          {HEADER_NAV.map((n) => (
            <Link key={n.to} to={n.to} className="hf-uline" aria-current={path === n.to ? 'page' : undefined}>
              {n.label}
              <img className="hf-uline__bar" src={`${A}/nav-underline.svg`} alt="" />
            </Link>
          ))}
        </nav>
        <div className="hf-header__end">
          <button
            ref={btn}
            type="button"
            className="hf-menu-btn"
            aria-expanded={open}
            aria-controls="hf-menu"
            onClick={() => setOpen((o) => !o)}
          >
            <span>{open ? 'Close' : 'Menu'}</span>
            <img src={`${A}/menu-dot-a.svg`} alt="" />
          </button>
        </div>
      </header>

      <SiteMenu open={open} path={path} onNavigate={close} panelRef={panel} />
    </>
  );
}
