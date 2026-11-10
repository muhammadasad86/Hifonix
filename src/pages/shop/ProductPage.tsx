import { type CSSProperties, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { catalog, formatMoney, type Product, type Variant } from '../../commerce';
import { useCart } from '../../commerce/cart';
import { useResource } from '../../commerce/useResource';
import { PAGES, ROUTES } from '../../config/navigation';
import { BRAND_EDITORIAL, brandName, collectionTitle, departmentOf, SERVICE_PROMISES, SHOP_ROUTES } from '../../config/shop';
import { Link } from '../../router';
import { useMediaQuery, useReveal } from '../../ui/chrome/scroll';
import { SIcon } from '../../ui/shop/icons';
import { Breadcrumb, QtyStepper, StateNote, Swatch } from '../../ui/shop/parts';
import { ShopLayout } from '../../ui/shop/ShopLayout';
import './shop-pages.css';

/**
 * Product detail — Figma Product-Detail-Page v5-3-2 (2155:42589 / 2155:84544):
 * gallery grid + sticky buy box, then a compact buy bar once the box scrolls
 * away; editorial sections below (lead, specifications, statement, story
 * photography with colour showcase, features, FAQ).
 */
export default function ProductPage({ handle }: { handle: string }) {
  const res = useResource(handle, () => catalog.getProduct(handle));
  const p = res.data;
  if (res.loading)
    return (
      <ShopLayout tone="solid" title="Product">
        <div className="hs-pdp hs-pdp--loading" aria-busy="true">
          <div className="hs-pdp__gallery">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="hs-pdp__ph" />
            ))}
          </div>
          <div className="hs-pdp__buy">
            <span className="hs-pdp__ph hs-pdp__ph--line" />
            <span className="hs-pdp__ph hs-pdp__ph--line" />
          </div>
        </div>
      </ShopLayout>
    );
  if (!p)
    return (
      <ShopLayout tone="solid" title="Product not found">
        <div className="hs-pad">
          <StateNote
            kind={res.error ? 'error' : 'empty'}
            title={res.error ? 'We couldn’t load this product.' : 'This product isn’t available.'}
            action={
              res.error ? (
                <button type="button" className="hs-btn hs-btn--ghost" onClick={res.retry}>
                  Try again
                </button>
              ) : (
                <Link to={SHOP_ROUTES.department('head-fi')} className="hs-btn hs-btn--ghost">
                  Continue shopping
                </Link>
              )
            }
          >
            {res.error ?? 'It may have been removed or the link is out of date.'}
          </StateNote>
        </div>
      </ShopLayout>
    );
  return <ProductView p={p} />;
}

function useSelection(p: Product) {
  const initial = p.variants.find((v) => v.availableForSale) ?? p.variants[0];
  const [sel, setSel] = useState<Record<string, string>>(() => Object.fromEntries(initial.selectedOptions.map((o) => [o.name, o.value])));
  const variant: Variant | undefined = useMemo(
    () => p.variants.find((v) => v.selectedOptions.every((o) => sel[o.name] === o.value)),
    [p.variants, sel],
  );
  const choose = useCallback((name: string, value: string) => setSel((s) => ({ ...s, [name]: value })), []);
  return { sel, variant, choose };
}

/** The product page template — also used by the CMS preview (`preview` shows a banner and skips routing chrome). */
export function ProductView({ p, preview, onClosePreview }: { p: Product; preview?: boolean; onClosePreview?: () => void }) {
  const desktop = useMediaQuery('(min-width: 1024px)');
  const { sel, variant, choose } = useSelection(p);
  const [qty, setQty] = useState(1);
  const [viewer, setViewer] = useState<number | null>(null);
  const [compact, setCompact] = useState(false);
  const buyRef = useRef<HTMLDivElement>(null);
  const dept = departmentOf(p.collections[0]);
  const brandEd = BRAND_EDITORIAL[p.brandHandle];
  const s = p.story;

  // bottom info bar: available once the main Buy Now button has scrolled away;
  // it slides away while scrolling down and returns as soon as you scroll up
  const [past, setPast] = useState(false);
  const lastY = useRef(0);
  const [dir, setDir] = useState<'up' | 'down'>('down');
  useEffect(() => {
    const el = buyRef.current?.querySelector('.hs-buy__cta');
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setPast(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  // (ProductView renders the ShopLayout scroll root itself, so listen on it directly)
  useEffect(() => {
    const root = buyRef.current?.closest('.hf');
    if (!root) return;
    lastY.current = root.scrollTop;
    const on = () => {
      const dy = root.scrollTop - lastY.current;
      if (Math.abs(dy) < 8) return;
      setDir(dy > 0 ? 'down' : 'up');
      lastY.current = root.scrollTop;
    };
    root.addEventListener('scroll', on, { passive: true });
    return () => root.removeEventListener('scroll', on);
  }, []);
  useEffect(() => setCompact(past && dir === 'up'), [past, dir]);

  const crumbs = [
    { label: 'Home', to: ROUTES.splash },
    ...(dept ? [{ label: dept.label, to: SHOP_ROUTES.department(dept.id) }] : []),
    ...(p.collections[0] ? [{ label: collectionTitle(p.collections[0]), to: SHOP_ROUTES.collection(p.collections[0]) }] : []),
    { label: `${p.title}${p.subtitle ? ` ${p.subtitle}` : ''}` },
  ];

  const buy = { p, sel, variant, choose, qty, setQty, badge: brandEd?.badge };
  const specs = s?.specs ?? (p.specs?.length ? p.specs : undefined);
  const specsImage = s?.specsImage ?? p.images[1] ?? p.featuredImage;
  return (
    <ShopLayout tone="solid" title={preview ? `Preview — ${p.title}` : p.title}>
      {preview && (
        <div className="hs-preview-bar" role="note">
          <span>
            <b>Preview</b> — this is how the product page will look. Nothing is saved or published from here.
          </span>
          <button type="button" className="hs-btn hs-btn--accent" onClick={onClosePreview}>
            Back to editor
          </button>
        </div>
      )}
      <div className="hs-crumbbar">
        <Breadcrumb items={crumbs} />
      </div>
      <section className="hs-pdp" aria-label={p.title}>
        <Gallery images={p.images} title={p.title} onOpen={setViewer} desktop={desktop} />
        <div ref={buyRef} className="hs-pdp__buy">
          <BuyBox {...buy} />
        </div>
      </section>
      <CompactBar {...buy} show={compact} desktop={desktop} />
      {viewer !== null && <Viewer images={p.images.filter((im) => !im.url.endsWith('placeholder.svg'))} start={viewer} onClose={() => setViewer(null)} />}

      {(s?.lead || p.description) && (
        <Reveal as="section" className="hs-lead">
          {s?.lead?.title && <p className="hs-lead__t">{s.lead.title}</p>}
          <p className="hs-lead__b">{s?.lead?.body ?? p.description}</p>
        </Reveal>
      )}
      {specs && (
        <section className="hs-specs" aria-label="Specifications">
          <div className="hs-specs__media">
            <img src={specsImage.url} alt={specsImage.alt} loading="lazy" />
          </div>
          <Reveal className="hs-specs__body">
            <h2 className="hs-specs__title">Specifications</h2>
            <dl>
              {specs.map((r, i) => (
                <div key={`${r.label}-${i}`} style={{ '--i': i } as CSSProperties}>
                  <dt>{r.label}</dt>
                  <dd>{r.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </section>
      )}
      {s?.statement && (
        <Reveal as="section" className="hs-statement">
          <p>
            {s.statement[0]}
            <span>{s.statement[1]}</span>
          </p>
        </Reveal>
      )}
      {s?.storyImages && (
        <section className="hs-story" aria-label={`${p.title} in pictures`}>
          {s.storyImages.pair && (
            <div className="hs-story__pair">
              {s.storyImages.pair.map((im) => (
                <ParallaxImg key={im.url} img={im} />
              ))}
            </div>
          )}
          {s.colourShowcase && <Showcase p={p} sel={sel} choose={choose} />}
          {s.storyImages.wide && (
            <div className="hs-story__wide">
              <ParallaxImg img={s.storyImages.wide} />
            </div>
          )}
        </section>
      )}
      {s?.features && (
        <section className="hs-features" aria-label="Features">
          <div className="hs-features__head">
            <h2>Features</h2>
            <Reveal as="p" className="hs-features__lede">
              {s.features.heading[0]}
              <span>{s.features.heading[1]}</span>
            </Reveal>
          </div>
          <div className="hs-features__imgs">
            {s.features.images.map((im, i) => (
              <Reveal key={im.url + i} className="hs-features__img" style={{ '--i': i } as CSSProperties}>
                <img src={im.url} alt={im.alt} loading="lazy" />
              </Reveal>
            ))}
          </div>
          <ul className="hs-features__list">
            {s.features.items.map((f) => (
              <li key={f.title}>
                <b>{f.title}</b> {f.body}
              </li>
            ))}
          </ul>
        </section>
      )}
      {s?.faq && <Faq faq={s.faq} />}

    </ShopLayout>
  );
}

/* ------------------------------------------------------------- gallery */
function Gallery({ images, title, onOpen, desktop }: { images: Product['images']; title: string; onOpen: (i: number) => void; desktop: boolean }) {
  const track = useRef<HTMLDivElement>(null);
  const real = images.filter((im) => !im.url.endsWith('placeholder.svg'));
  const fill = desktop ? Math.max(0, 4 - Math.max(real.length, 1)) : 0;
  const [cur, setCur] = useState(0);
  const onScroll = () => {
    const el = track.current;
    if (el) setCur(Math.round(el.scrollLeft / el.clientWidth));
  };
  return (
    <div className="hs-pdp__gallery-wrap">
      <div ref={track} className="hs-pdp__gallery" onScroll={desktop ? undefined : onScroll}>
        {images.map((im, i) =>
          im.url.endsWith('placeholder.svg') ? (
            <div key={im.url + i} className="hs-pdp__shot hs-pdp__shot--ph" style={{ '--i': i } as CSSProperties}>
              <span>Image coming soon</span>
            </div>
          ) : (
            <button key={im.url} type="button" className="hs-pdp__shot" onClick={() => onOpen(real.indexOf(im))} aria-label={`Open image ${real.indexOf(im) + 1} of ${real.length}`} style={{ '--i': i } as CSSProperties}>
              <img src={im.url} alt={i === 0 ? title : im.alt} loading={i < 2 ? 'eager' : 'lazy'} decoding="async" />
            </button>
          ),
        )}
        {Array.from({ length: fill }, (_, i) => (
          <div key={`ph-${i}`} className="hs-pdp__shot hs-pdp__shot--ph" aria-hidden="true" style={{ '--i': images.length + i } as CSSProperties}>
            <span>Image coming soon</span>
          </div>
        ))}
      </div>
      {!desktop && images.length > 1 && (
        <div className="hs-dots" aria-hidden="true">
          {images.map((im, i) => (
            <span key={im.url} data-on={i === cur || undefined} />
          ))}
        </div>
      )}
    </div>
  );
}

function Viewer({ images, start, onClose }: { images: Product['images']; start: number; onClose: () => void }) {
  const [i, setI] = useState(start);
  const n = images.length;
  const go = useCallback((d: number) => setI((x) => (x + d + n) % n), [n]);
  const ref = useRef<HTMLDivElement>(null);
  const touch = useRef(0);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('.hs-viewer__close')?.focus();
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [go, onClose]);
  return (
    <div
      ref={ref}
      className="hs-viewer"
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
      }}
    >
      <button type="button" className="hs-viewer__close" onClick={onClose}>
        Close
      </button>
      <figure className="hs-viewer__stage" key={i}>
        <img src={images[i].url} alt={images[i].alt} />
        <figcaption>
          {i + 1} / {n}
        </figcaption>
      </figure>
      {n > 1 && (
        <>
          <button type="button" className="hs-viewer__nav hs-viewer__nav--prev" onClick={() => go(-1)} aria-label="Previous image">
            <SIcon name="arrow-left" size={22} />
          </button>
          <button type="button" className="hs-viewer__nav hs-viewer__nav--next" onClick={() => go(1)} aria-label="Next image">
            <SIcon name="arrow-right" size={22} />
          </button>
          <div className="hs-viewer__thumbs">
            {images.map((im, x) => (
              <button key={im.url} type="button" aria-label={`Image ${x + 1}`} aria-current={x === i || undefined} onClick={() => setI(x)}>
                <img src={im.url} alt="" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------- buy box */
interface BuyProps {
  p: Product;
  sel: Record<string, string>;
  variant: Variant | undefined;
  choose: (name: string, value: string) => void;
  qty: number;
  setQty: (n: number) => void;
  badge?: string;
}

function useAdd({ p, variant, qty }: BuyProps) {
  const add = useCart((s) => s.add);
  const openDrawer = useCart((s) => s.openDrawer);
  const error = useCart((s) => s.error);
  const [state, setState] = useState<'idle' | 'adding' | 'added' | 'error'>('idle');
  const run = async () => {
    if (!variant || !variant.availableForSale || state === 'adding') return;
    setState('adding');
    const ok = await add(p, variant, qty);
    setState(ok ? 'added' : 'error');
    if (ok) {
      openDrawer(true);
      window.setTimeout(() => setState('idle'), 2200);
    }
  };
  const label = !variant ? 'Unavailable' : !variant.availableForSale ? 'Sold out' : state === 'adding' ? 'Adding…' : state === 'added' ? 'Added to cart' : 'Add to cart';
  return { run, state, label, error: state === 'error' ? error : null, disabled: !variant || !variant.availableForSale || state === 'adding' };
}

function OptionPickers({ p, sel, choose, compact }: Pick<BuyProps, 'p' | 'sel' | 'choose'> & { compact?: boolean }) {
  return (
    <>
      {p.options.map((o) => {
        const visual = o.values.some((v) => v.swatch);
        if (visual)
          return (
            <fieldset key={o.name} className={`hs-swatches${compact ? ' hs-swatches--compact' : ''}`}>
              <legend>{sel[o.name]}</legend>
              <div>
                {o.values.map((v) => (
                  <label key={v.name} className="hs-swatches__opt" title={v.name}>
                    <input type="radio" name={`opt-${o.name}`} checked={sel[o.name] === v.name} onChange={() => choose(o.name, v.name)} />
                    <span className="hs-swatches__pill" style={{ '--c': v.swatch?.color ?? '#ccc' } as CSSProperties}>
                      <Swatch v={{ name: v.name, swatch: { color: v.swatch?.color } }} size={32} />
                    </span>
                    <span className="sr-only">{v.name}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          );
        return (
          <label key={o.name} className="hs-select" data-single={o.values.length < 2 || undefined}>
            <span className="hs-select__label">
              {o.name}: <b>{sel[o.name]}</b>
            </span>
            <select value={sel[o.name]} onChange={(e) => choose(o.name, e.target.value)} disabled={o.values.length < 2} aria-label={o.name}>
              {o.values.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name}
                </option>
              ))}
            </select>
            <SIcon name="chevron-down" size={14} stroke={2} />
          </label>
        );
      })}
    </>
  );
}

function Trust({ small }: { small?: boolean }) {
  return (
    <div className={`hs-trust${small ? ' hs-trust--sm' : ''}`} aria-label="Rated Excellent on Trustpilot">
      <span>Excellent:</span>
      <img src="/shop/ui/trustpilot-stars.webp" alt="" />
      <img src="/shop/ui/trustpilot-logo.webp" alt="Trustpilot" />
    </div>
  );
}

function BuyBox(props: BuyProps) {
  const { p, sel, variant, choose, qty, setQty, badge } = props;
  const add = useAdd(props);
  return (
    <div className="hs-buy">
      <div className="hs-buy__head">
        <div>
          <h1 className="hs-buy__title">
            {p.title}
            {p.subtitle && <span>{p.subtitle}</span>}
          </h1>
          <Link to={PAGES.contact.route} className="hs-chip">
            Available for demonstration in store
            <img src="/shop/icons/pin.svg" alt="" />
          </Link>
        </div>
        {badge && (
          <Link to={SHOP_ROUTES.brand(p.brandHandle)} className="hs-badge" aria-label={`More from ${brandName(p.brandHandle)}`}>
            <img src={badge} alt="" />
          </Link>
        )}
      </div>
      <ul className="hs-promises">
        {SERVICE_PROMISES.map((s) => (
          <li key={s.label}>
            <img src={`/shop/icons/${s.icon}.svg`} alt="" />
            {s.label}
          </li>
        ))}
      </ul>
      <div className="hs-buy__opts">
        <OptionPickers p={p} sel={sel} choose={choose} />
      </div>
      <div className="hs-buy__row">
        <QtyStepper value={qty} onChange={setQty} size="lg" />
        <p className="hs-buy__price" aria-live="polite">
          {variant ? formatMoney(variant.price) : '—'}
          {variant?.compareAtPrice && variant.compareAtPrice.amount > variant.price.amount && <s>{formatMoney(variant.compareAtPrice)}</s>}
        </p>
        <button type="button" className="hs-btn hs-btn--accent hs-buy__cta" onClick={add.run} disabled={add.disabled} data-state={add.state}>
          <span>{add.label}</span>
          <span className="hs-buy__bag" aria-hidden="true">
            {add.state === 'adding' ? <i className="hs-spin" /> : add.state === 'added' ? <SIcon name="chevron-right" size={28} stroke={2.4} /> : <SIcon name="bag" size={30} stroke={2} />}
          </span>
        </button>
      </div>
      {add.error && (
        <p className="hs-error" role="alert">
          {add.error}
        </p>
      )}
      <Trust />
    </div>
  );
}

function CompactBar(props: BuyProps & { show: boolean; desktop: boolean }) {
  const { p, sel, variant, choose, qty, setQty, badge, show, desktop } = props;
  const add = useAdd(props);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.toggleAttribute('inert', !show);
  }, [show]);
  if (!desktop)
    return (
      <div ref={ref} className="hs-mbar" data-show={show || undefined} aria-hidden={!show}>
        <div>
          <p className="hs-mbar__t">{p.title}</p>
          <p className="hs-mbar__p">{variant ? formatMoney(variant.price) : '—'}</p>
        </div>
        <button type="button" className="hs-btn hs-btn--accent" onClick={add.run} disabled={add.disabled}>
          {add.label}
        </button>
      </div>
    );
  return (
    <div ref={ref} className="hs-cbar" data-show={show || undefined} aria-hidden={!show}>
      <div className="hs-cbar__main">
        <div className="hs-cbar__top">
          {badge && (
            <span className="hs-badge hs-badge--sm">
              <img src={badge} alt="" />
            </span>
          )}
          <p className="hs-cbar__title">
            {p.title} {p.subtitle}
          </p>
          <Trust small />
          {p.badges?.demo && <span className="hs-tag">demo</span>}
        </div>
        <div className="hs-cbar__row">
          <OptionPickers p={p} sel={sel} choose={choose} compact />
          <QtyStepper value={qty} onChange={setQty} size="md" />
          <p className="hs-cbar__price">{variant ? formatMoney(variant.price) : '—'}</p>
          <button type="button" className="hs-btn hs-btn--accent hs-cbar__cta" onClick={add.run} disabled={add.disabled} data-state={add.state}>
            <span>{add.label}</span>
            {add.state === 'adding' ? <i className="hs-spin" /> : <SIcon name="bag" size={26} stroke={2} />}
          </button>
        </div>
      </div>
      <ul className="hs-promises hs-promises--bar">
        {SERVICE_PROMISES.map((s) => (
          <li key={s.label}>
            <img src={`/shop/icons/${s.icon}.svg`} alt="" />
            {s.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* --------------------------------------------------------- story parts */
function Reveal({ as: Tag = 'div', className = '', style, children }: { as?: 'div' | 'section' | 'p'; className?: string; style?: CSSProperties; children: ReactNode }) {
  const [ref, inView] = useReveal<HTMLElement>(0.15);
  return (
    <Tag ref={ref as never} className={`hs-rv ${className}`} data-in={inView || undefined} style={style}>
      {children}
    </Tag>
  );
}

function ParallaxImg({ img }: { img: { url: string; alt: string } }) {
  const [ref, inView] = useReveal<HTMLDivElement>(0.1);
  return (
    <div ref={ref} className="hs-px" data-in={inView || undefined}>
      <img src={img.url} alt={img.alt} loading="lazy" decoding="async" />
    </div>
  );
}

function Showcase({ p, sel, choose }: { p: Product; sel: Record<string, string>; choose: (n: string, v: string) => void }) {
  const sc = p.story!.colourShowcase!;
  const opt = p.options.find((o) => o.name === sc.option);
  if (!opt) return null;
  const current = sel[sc.option];
  const img = sc.images[current] ?? Object.values(sc.images)[0];
  return (
    <div className="hs-showcase">
      <div className="hs-showcase__picker" role="radiogroup" aria-label={sc.option}>
        {opt.values.map((v) => (
          <button
            key={v.name}
            type="button"
            role="radio"
            aria-checked={current === v.name}
            aria-label={v.name}
            title={v.name}
            onClick={() => choose(sc.option, v.name)}
            style={{ '--c': v.swatch?.color ?? '#999' } as CSSProperties}
          />
        ))}
      </div>
      <figure className="hs-showcase__img" key={current}>
        <img src={img.url} alt={`${p.title} — ${current}`} loading="lazy" />
        <figcaption>{current}</figcaption>
      </figure>
    </div>
  );
}

function Faq({ faq }: { faq: NonNullable<Product['story']>['faq'] & object }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="hs-faq" aria-label="Frequently asked questions">
      <Reveal as="p" className="hs-faq__intro">
        {faq.intro}
      </Reveal>
      <div className="hs-faq__body">
        <ul className="hs-faq__list">
          {faq.items.map((f, i) => (
            <li key={f.q} data-open={open === i || undefined}>
              <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
                <span>{f.q}</span>
                <SIcon name={open === i ? 'minus' : 'plus'} size={24} />
              </button>
              <div className="hs-faq__a" role="region">
                <div>
                  <p>{f.a ?? 'Answer to be supplied by Hifonix — contact our team in the meantime and we’ll be happy to help.'}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <p className="hs-faq__more">
          <b>NEED MORE INFO</b> If you’re still
          <br />
          looking for answers, our detailed
          <br />
          <Link to={PAGES.faq.route} className="hs-more">
            FAQ might be helpful
          </Link>
        </p>
      </div>
    </section>
  );
}
