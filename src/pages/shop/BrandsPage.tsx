import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { BRAND_GROUPS, BRANDS, BRANDS_INTRO, type BrandGroup, SHOP_ROUTES } from '../../config/shop';
import { Link } from '../../router';
import { Loader } from '../../ui/shop/parts';
import { ShopLayout } from '../../ui/shop/ShopLayout';
import { ShopHero } from './Hero';
import './shop-pages.css';

const LETTERS = ['All', '#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
const PAGE = 12;

const readGroup = (): BrandGroup => {
  try {
    return new URLSearchParams(window.location.search).get('group') === 'headphones' ? 'headphones' : 'artisan';
  } catch {
    return 'artisan';
  }
};

/**
 * Brands A–Z — Figma 3673:38327 ("Artisan Audio Brands" 3388:19910 /
 * "Headphone Brands" 3389:24342): hero, Artisan Audio | Headphones switch +
 * alphabet filter, and the brand wall. `?group=headphones` deep-links the tab. Hovering a tile darkens the photograph
 * and reveals the brand's logo (Figma hidden logo layer). The wall loads in
 * pages as you scroll ("Loading more brands…").
 */
export default function BrandsPage() {
  const [group, setGroupState] = useState<BrandGroup>(readGroup);
  const [letter, setLetter] = useState('All');
  const setGroup = (g: BrandGroup) => {
    setGroupState(g);
    setLetter('All');
    try {
      const u = new URL(window.location.href);
      if (g === 'artisan') u.searchParams.delete('group');
      else u.searchParams.set('group', g);
      window.history.replaceState(window.history.state, '', u);
    } catch {
      /* ignore */
    }
  };
  const inGroup = useMemo(() => BRANDS.filter((b) => b.group === group), [group]);
  const meta = BRAND_GROUPS.find((g) => g.id === group)!;
  const [shown, setShown] = useState(PAGE);
  const sentinel = useRef<HTMLDivElement>(null);
  const list = useMemo(
    () =>
      inGroup.filter((b) => {
        if (letter === 'All') return true;
        const c = b.name[0].toUpperCase();
        return letter === '#' ? /[0-9]/.test(c) : c === letter;
      }),
    [letter, inGroup],
  );
  const available = useMemo(() => new Set(inGroup.map((b) => (/[0-9]/.test(b.name[0]) ? '#' : b.name[0].toUpperCase()))), [inGroup]);
  useEffect(() => setShown(PAGE), [letter, group]);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || shown >= list.length) return;
    let t = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      t = window.setTimeout(() => setShown((n) => n + PAGE), 420);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(t);
    };
  }, [shown, list.length]);

  return (
    <ShopLayout tone="overlay" title="Brands">
      <ShopHero key={group} image={meta.hero} title={BRANDS_INTRO.title} target="hs-brand-wall" variant="serif" cue="Scroll to view brands">
        <p>{BRANDS_INTRO.body}</p>
      </ShopHero>
      <section id="hs-brand-wall" className="hs-brands" aria-label={`${meta.label} brands`}>
        <div className="hs-brands__bar">
          <div className="hs-brands__groups" role="tablist" aria-label="Brand family">
            {BRAND_GROUPS.map((g) => (
              <button key={g.id} type="button" role="tab" aria-selected={group === g.id} onClick={() => setGroup(g.id)}>
                {g.label}
              </button>
            ))}
          </div>
        <nav className="hs-alpha" aria-label="Filter brands by letter">
          {LETTERS.map((l) => (
            <button
              key={l}
              type="button"
              aria-pressed={letter === l}
              disabled={l !== 'All' && !available.has(l)}
              onClick={() => setLetter(l)}
            >
              {l}
            </button>
          ))}
        </nav>
        </div>
        {list.length === 0 ? (
          <p className="hs-brands__none">No brands under “{letter}” yet.</p>
        ) : (
          <ul className="hs-brands__grid">
            {list.slice(0, shown).map((b, i) => (
              <li key={b.handle} style={{ '--i': i % PAGE } as CSSProperties}>
                <Link to={SHOP_ROUTES.brand(b.handle)} className="hs-tile">
                  <span className="hs-tile__media">
                    {b.tile && <img src={b.tile} alt="" loading="lazy" decoding="async" />}
                    {b.logo && <span className="hs-tile__logo" style={{ '--logo': `url(${b.logo})` } as CSSProperties} />}
                  </span>
                  <span className="hs-tile__name">{b.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {shown < list.length && (
          <div ref={sentinel}>
            <Loader label="Loading more brands..." />
          </div>
        )}
      </section>
    </ShopLayout>
  );
}
