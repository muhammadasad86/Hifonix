import { type DragEvent, type FormEvent, type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { CMS_CONFIGURED, SUPABASE } from '../../commerce/config';
import { invalidateCms, rowToProduct, type CmsImage, type CmsOptionValue, type CmsProduct } from '../../commerce/cms';
import { formatMoney } from '../../commerce/money';
import { auth, db, storage } from '../../commerce/supabase';
import { BRANDS, DEPARTMENTS, slugify } from '../../config/shop';
import { href, Link, navigate, usePath } from '../../router';
import { ProductCard } from '../../ui/shop/ProductCard';
import { ProductView } from '../shop/ProductPage';
import './admin.css';

/**
 * Hifonix demo CMS — /admin (not linked from the site, noindex).
 * Supabase Auth login → product list → editor with image uploads, live card
 * preview and a full product-page preview. Data lives in Supabase (Postgres +
 * Storage); row-level security makes every write admin-only.
 */
type Draft = Omit<CmsProduct, 'id' | 'updated_at'> & { id?: string; updated_at?: string };

const EMPTY: Draft = {
  handle: '',
  title: '',
  subtitle: '',
  brand: '',
  brand_handle: '',
  department: 'head-fi',
  categories: [],
  product_type: '',
  description: '',
  price: 0,
  price_from: false,
  currency: 'GBP',
  available: true,
  status: 'draft',
  images: [],
  hover_image: null,
  options: [],
  specs: [],
  story: null,
  sort_order: 100,
};

export default function AdminPage() {
  const path = usePath();
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.append(meta);
    const prev = document.title;
    document.title = 'Hifonix CMS';
    return () => {
      meta.remove();
      document.title = prev;
    };
  }, []);
  useEffect(() => {
    if (!CMS_CONFIGURED) return;
    auth.token().then(setToken);
  }, []);
  useEffect(() => {
    if (!token) return;
    db.rpc<boolean>('is_admin', token).then(setIsAdmin, () => setIsAdmin(false));
  }, [token]);

  if (!CMS_CONFIGURED) return <Setup />;
  if (token === undefined) return <Shell>{null}</Shell>;
  if (!token) return <Login onIn={setToken} />;

  const signOut = async () => {
    await auth.signOut();
    setToken(null);
    setIsAdmin(null);
  };
  const id = path.split('/')[2];
  return (
    <Shell email={auth.read()?.user.email} onSignOut={signOut}>
      {isAdmin === false && (
        <p className="ad-warn">
          You’re signed in, but <b>{auth.read()?.user.email}</b> isn’t listed in <code>public.admins</code>, so changes can’t be saved. Add the email in
          Supabase (see <code>supabase/schema.sql</code>).
        </p>
      )}
      {id ? <Editor key={id} id={id === 'new' ? null : id} /> : <List />}
    </Shell>
  );
}

function Shell({ children, email, onSignOut }: { children: ReactNode; email?: string; onSignOut?: () => void }) {
  return (
    <div className="ad">
      <header className="ad-top">
        <Link to="/admin" className="ad-brand">
          <img src="/shop/ui/logo-mark-dark.svg" alt="" />
          <span>CMS</span>
        </Link>
        <nav>
          <Link to="/admin">Products</Link>
          <a href={href('/splash')} target="_blank" rel="noreferrer">
            View site ↗
          </a>
        </nav>
        {email && (
          <div className="ad-user">
            <span>{email}</span>
            <button type="button" onClick={onSignOut}>
              Sign out
            </button>
          </div>
        )}
      </header>
      <main className="ad-main">{children}</main>
    </div>
  );
}

function Setup() {
  return (
    <Shell>
      <div className="ad-card ad-narrow">
        <h1>Connect the CMS</h1>
        <p>The CMS stores products and images in Supabase. It isn’t configured for this build yet, so the site is showing its sample catalogue.</p>
        <ol>
          <li>Create a free project at supabase.com.</li>
          <li>
            Open <b>SQL Editor</b>, paste <code>supabase/schema.sql</code> (replace <code>you@example.com</code> with your admin email first) and run it.
          </li>
          <li>
            <b>Authentication → Users → Add user</b> with that email and a password (tick “Auto confirm”).
          </li>
          <li>
            Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> (Settings → API) in <code>.env.local</code> and in the hosting
            provider, then rebuild.
          </li>
        </ol>
      </div>
    </Shell>
  );
}

function Login({ onIn }: { onIn: (t: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const s = await auth.signIn(email.trim(), password);
      onIn(s.access_token);
    } catch (x) {
      setErr(x instanceof Error ? x.message : 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Shell>
      <form className="ad-card ad-login" onSubmit={submit}>
        <h1>Sign in</h1>
        <p className="ad-muted">Hifonix product CMS</p>
        <label>
          Email
          <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Password
          <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {err && <p className="ad-err">{err}</p>}
        <button type="submit" className="ad-btn ad-btn--primary" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </Shell>
  );
}

/* ---------------------------------------------------------------- list */
function List() {
  const [rows, setRows] = useState<CmsProduct[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [dept, setDept] = useState('all');
  useEffect(() => {
    auth.token().then((t) =>
      db.select<CmsProduct>('products', 'select=*&order=sort_order.asc,title.asc', t ?? undefined).then(setRows, (e: Error) => setErr(e.message)),
    );
  }, []);
  const shown = useMemo(
    () =>
      (rows ?? []).filter(
        (r) => (dept === 'all' || r.department === dept) && `${r.title} ${r.brand} ${r.handle}`.toLowerCase().includes(q.trim().toLowerCase()),
      ),
    [rows, q, dept],
  );
  return (
    <>
      <div className="ad-head">
        <div>
          <h1>Products</h1>
          <p className="ad-muted">{rows ? `${rows.length} products · ${rows.filter((r) => r.status === 'published').length} published` : 'Loading…'}</p>
        </div>
        <Link to="/admin/new" className="ad-btn ad-btn--primary">
          + New product
        </Link>
      </div>
      <div className="ad-filters">
        <input type="search" placeholder="Search title, brand or handle" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={dept} onChange={(e) => setDept(e.target.value)}>
          <option value="all">All departments</option>
          {DEPARTMENTS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
      </div>
      {err && <p className="ad-err">{err}</p>}
      <ul className="ad-list">
        {shown.map((r) => (
          <li key={r.id}>
            <Link to={`/admin/${r.id}`} className="ad-row">
              <span className="ad-thumb">{r.images[0]?.url ? <img src={r.images[0].url} alt="" /> : <span>No image</span>}</span>
              <span className="ad-row__t">
                <b>{r.title}</b>
                <small>
                  {r.brand || '—'} · {DEPARTMENTS.find((d) => d.id === r.department)?.label ?? r.department}
                </small>
              </span>
              <span className="ad-row__p">{formatMoney(Number(r.price))}</span>
              <span className={`ad-pill ad-pill--${r.status}`}>{r.status === 'published' ? 'Published' : 'Draft'}</span>
              <span className={`ad-pill ${r.available ? 'ad-pill--ok' : 'ad-pill--off'}`}>{r.available ? 'Available' : 'Unavailable'}</span>
            </Link>
          </li>
        ))}
        {rows && shown.length === 0 && <li className="ad-muted ad-empty">No products match.</li>}
      </ul>
    </>
  );
}

/* -------------------------------------------------------------- editor */
async function toWebp(file: File, max = 2000): Promise<Blob> {
  const bm = await createImageBitmap(file);
  const s = Math.min(1, max / Math.max(bm.width, bm.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bm.width * s);
  c.height = Math.round(bm.height * s);
  c.getContext('2d')!.drawImage(bm, 0, 0, c.width, c.height);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Could not process image'))), 'image/webp', 0.86));
}

/** message carried across the new → /admin/:id remount */
let flash: string | null = null;

function Editor({ id }: { id: string | null }) {
  const [d, setD] = useState<Draft | null>(id ? null : { ...EMPTY });
  const [saved, setSaved] = useState<string>('');
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(() => {
    const f = flash;
    flash = null;
    return f;
  });
  const [preview, setPreview] = useState(false);
  const [handleTouched, setHandleTouched] = useState(Boolean(id));
  const [removed, setRemoved] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;
    auth.token().then((t) =>
      db.select<CmsProduct>('products', `select=*&id=eq.${id}`, t ?? undefined).then(
        (r) => {
          if (!r[0]) return setErr('Product not found.');
          setD(r[0]);
          setSaved(JSON.stringify(r[0]));
        },
        (e: Error) => setErr(e.message),
      ),
    );
  }, [id]);

  const set = useCallback(<K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => (x ? { ...x, [k]: v } : x)), []);
  const dirty = d ? JSON.stringify(d) !== saved : false;
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  if (err && !d) return <p className="ad-err">{err}</p>;
  if (!d) return <p className="ad-muted">Loading…</p>;

  const dept = DEPARTMENTS.find((x) => x.id === d.department);
  const previewProduct = rowToProduct({ ...d, id: d.id ?? 'preview', subtitle: d.subtitle || null } as CmsProduct);

  const upload = async (files: FileList | File[], target: 'images' | 'hover') => {
    const t = await auth.token();
    if (!t) return setErr('Your session expired — sign in again.');
    if (!d.handle) return setErr('Give the product a title (or handle) before uploading images.');
    setBusy(target === 'hover' ? 'Uploading hover image…' : 'Uploading images…');
    setErr(null);
    try {
      const added: CmsImage[] = [];
      for (const [i, f] of [...files].entries()) {
        if (!f.type.startsWith('image/')) continue;
        const blob = await toWebp(f);
        const path = `products/${d.handle}/${Date.now()}-${i}.webp`;
        const url = await storage.upload(path, blob, t);
        added.push({ url, path, alt: d.title });
      }
      if (target === 'hover') set('hover_image', added[0] ?? d.hover_image);
      else set('images', [...d.images, ...added]);
      setNote(`${added.length} image${added.length === 1 ? '' : 's'} uploaded — save to keep them on the product.`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(null);
    }
  };
  const removeImage = (i: number) => {
    const im = d.images[i];
    if (im.path) setRemoved((r) => [...r, im.path!]);
    set(
      'images',
      d.images.filter((_, x) => x !== i),
    );
  };
  const move = (from: number, to: number) => {
    if (to < 0 || to >= d.images.length) return;
    const next = [...d.images];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    set('images', next);
  };

  const save = async (status?: Draft['status']) => {
    const t = await auth.token();
    if (!t) return setErr('Your session expired — sign in again.');
    if (!d.title.trim()) return setErr('Title is required.');
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(d.handle)) return setErr('Handle must be lower-case words separated by hyphens.');
    setBusy('Saving…');
    setErr(null);
    try {
      const row = { ...d, status: status ?? d.status, price: Number(d.price) || 0, sort_order: Number(d.sort_order) || 0 };
      delete (row as { updated_at?: string }).updated_at;
      const out = d.id ? await db.update<CmsProduct>('products', d.id, row, t) : await db.insert<CmsProduct>('products', row, t);
      if (removed.length) await storage.remove(removed, t).catch(() => {});
      setRemoved([]);
      setD(out);
      setSaved(JSON.stringify(out));
      invalidateCms();
      const msg = out.status === 'published' ? 'Saved and published — it’s live on the storefront.' : 'Saved as draft (not visible on the storefront).';
      setNote(msg);
      if (!d.id) {
        flash = msg;
        navigate(`/admin/${out.id}`, { replace: true });
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setBusy(null);
    }
  };
  const destroy = async () => {
    if (!d.id || !window.confirm(`Delete “${d.title}”? This can’t be undone.`)) return;
    const t = await auth.token();
    if (!t) return;
    setBusy('Deleting…');
    try {
      await db.remove('products', d.id, t);
      const paths = [...d.images, d.hover_image].map((i) => i?.path).filter(Boolean) as string[];
      await storage.remove(paths, t).catch(() => {});
      invalidateCms();
      navigate('/admin');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Delete failed');
      setBusy(null);
    }
  };

  if (preview) return <ProductView p={previewProduct} preview onClosePreview={() => setPreview(false)} />;

  return (
    <div className="ad-edit">
      <div className="ad-head">
        <div>
          <Link to="/admin" className="ad-back">
            ← All products
          </Link>
          <h1>{d.title || 'New product'}</h1>
          <p className="ad-muted">
            {d.status === 'published' ? 'Published' : 'Draft'}
            {dirty && ' · unsaved changes'}
            {d.status === 'published' && d.id && (
              <>
                {' · '}
                <a href={href(`/products/${d.handle}`)} target="_blank" rel="noreferrer">
                  View on site ↗
                </a>
              </>
            )}
          </p>
        </div>
        <div className="ad-actions">
          <button type="button" className="ad-btn" onClick={() => setPreview(true)}>
            Preview page
          </button>
          <button type="button" className="ad-btn" onClick={() => save('draft')} disabled={!!busy}>
            Save draft
          </button>
          <button type="button" className="ad-btn ad-btn--primary" onClick={() => save('published')} disabled={!!busy}>
            {d.status === 'published' ? 'Save & publish' : 'Publish'}
          </button>
        </div>
      </div>
      {(busy || err || note) && (
        <p className={err ? 'ad-err' : 'ad-note'} role="status">
          {busy ?? err ?? note}
        </p>
      )}

      <div className="ad-grid">
        <div className="ad-form">
          <section className="ad-card">
            <h2>Basics</h2>
            <label>
              Title
              <input
                value={d.title}
                onChange={(e) => {
                  set('title', e.target.value);
                  if (!handleTouched) set('handle', slugify(e.target.value));
                }}
                placeholder="e.g. Abyss DIANA DZ"
              />
            </label>
            <div className="ad-2">
              <label>
                Subtitle <small>(optional, second title line)</small>
                <input value={d.subtitle ?? ''} onChange={(e) => set('subtitle', e.target.value)} />
              </label>
              <label>
                URL handle
                <input
                  value={d.handle}
                  onChange={(e) => {
                    setHandleTouched(true);
                    set('handle', slugify(e.target.value));
                  }}
                />
                <small>/products/{d.handle || '…'}</small>
              </label>
            </div>
            <label>
              Description
              <textarea rows={6} value={d.description} onChange={(e) => set('description', e.target.value)} />
            </label>
          </section>

          <section className="ad-card">
            <h2>Organisation</h2>
            <div className="ad-2">
              <label>
                Department
                <select value={d.department} onChange={(e) => (set('department', e.target.value), set('categories', []))}>
                  {DEPARTMENTS.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Brand
                <input
                  list="ad-brands"
                  value={d.brand}
                  onChange={(e) => {
                    const name = e.target.value;
                    const known = BRANDS.find((b) => b.name.toLowerCase() === name.toLowerCase());
                    setD((x) => (x ? { ...x, brand: name, brand_handle: known?.handle ?? slugify(name) } : x));
                  }}
                  placeholder="Choose or type"
                />
                <datalist id="ad-brands">
                  {BRANDS.map((b) => (
                    <option key={b.handle} value={b.name} />
                  ))}
                </datalist>
              </label>
            </div>
            <fieldset className="ad-cats">
              <legend>Categories</legend>
              {dept?.categories.map((c) => (
                <label key={c.handle} className="ad-check">
                  <input
                    type="checkbox"
                    checked={d.categories.includes(c.handle)}
                    onChange={(e) => set('categories', e.target.checked ? [...d.categories, c.handle] : d.categories.filter((x) => x !== c.handle))}
                  />
                  {c.title}
                </label>
              ))}
            </fieldset>
            <div className="ad-2">
              <label>
                Product type <small>(filter “Shop by Product”)</small>
                <input value={d.product_type} onChange={(e) => set('product_type', e.target.value)} placeholder="e.g. Headphones" />
              </label>
              <label>
                Sort order <small>(lower first)</small>
                <input type="number" value={d.sort_order} onChange={(e) => set('sort_order', Number(e.target.value))} />
              </label>
            </div>
          </section>

          <section className="ad-card">
            <h2>Price &amp; availability</h2>
            <div className="ad-2">
              <label>
                Price (GBP)
                <input type="number" min={0} step={1} value={d.price} onChange={(e) => set('price', Number(e.target.value))} />
              </label>
              <div className="ad-toggles">
                <label className="ad-check">
                  <input type="checkbox" checked={d.price_from} onChange={(e) => set('price_from', e.target.checked)} /> Show as “FROM £…”
                </label>
                <label className="ad-check">
                  <input type="checkbox" checked={d.available} onChange={(e) => set('available', e.target.checked)} /> Available to add to cart
                </label>
              </div>
            </div>
          </section>

          <section className="ad-card">
            <h2>Images</h2>
            <p className="ad-muted">First image is the main product shot (cut-out on light grey works best). Drag to reorder.</p>
            <ImageGrid images={d.images} onMove={move} onRemove={removeImage} onAlt={(i, alt) => set('images', d.images.map((im, x) => (x === i ? { ...im, alt } : im)))} />
            <Drop label="Drop images here or click to upload" multiple onFiles={(f) => upload(f, 'images')} />
            <h3>Card hover photo</h3>
            <div className="ad-hover">
              {d.hover_image?.url ? (
                <span className="ad-thumb ad-thumb--lg">
                  <img src={d.hover_image.url} alt="" />
                  <button type="button" onClick={() => (d.hover_image?.path && setRemoved((r) => [...r, d.hover_image!.path!]), set('hover_image', null))}>
                    Remove
                  </button>
                </span>
              ) : (
                <Drop label="Lifestyle photo shown on hover" onFiles={(f) => upload(f, 'hover')} />
              )}
            </div>
          </section>

          <section className="ad-card">
            <h2>Options</h2>
            <p className="ad-muted">e.g. Colour, Finish, Cable Length. A value can override the price. Colours show as swatches.</p>
            <OptionsEditor options={d.options} onChange={(o) => set('options', o)} />
          </section>

          <section className="ad-card">
            <h2>Specifications</h2>
            <SpecsEditor specs={d.specs} onChange={(s) => set('specs', s)} />
          </section>

          {d.id && (
            <section className="ad-card ad-danger">
              <h2>Delete product</h2>
              <button type="button" className="ad-btn ad-btn--danger" onClick={destroy} disabled={!!busy}>
                Delete permanently
              </button>
            </section>
          )}
        </div>

        <aside className="ad-preview">
          <p className="ad-muted">Card preview</p>
          <div className="ad-preview__card hs">
            <ProductCard p={previewProduct} />
          </div>
          <button type="button" className="ad-btn ad-btn--wide" onClick={() => setPreview(true)}>
            Preview full product page
          </button>
        </aside>
      </div>
    </div>
  );
}

function Drop({ label, onFiles, multiple }: { label: string; onFiles: (f: FileList) => void; multiple?: boolean }) {
  const [over, setOver] = useState(false);
  const drop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
  };
  return (
    <label className="ad-drop" data-over={over || undefined} onDragOver={(e) => (e.preventDefault(), setOver(true))} onDragLeave={() => setOver(false)} onDrop={drop}>
      <input type="file" accept="image/*" multiple={multiple} onChange={(e) => e.target.files?.length && onFiles(e.target.files)} />
      <span>{label}</span>
      <small>JPG, PNG or WebP — resized to 2000px WebP on upload</small>
    </label>
  );
}

function ImageGrid({ images, onMove, onRemove, onAlt }: { images: CmsImage[]; onMove: (a: number, b: number) => void; onRemove: (i: number) => void; onAlt: (i: number, alt: string) => void }) {
  const [drag, setDrag] = useState<number | null>(null);
  if (!images.length) return <p className="ad-muted ad-empty">No images yet — the storefront shows a styled placeholder.</p>;
  return (
    <ul className="ad-images">
      {images.map((im, i) => (
        <li
          key={im.url + i}
          draggable
          onDragStart={() => setDrag(i)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => (drag !== null && onMove(drag, i), setDrag(null))}
          data-drag={drag === i || undefined}
        >
          <span className="ad-thumb ad-thumb--lg">
            <img src={im.url} alt="" />
            {i === 0 && <em>Main</em>}
          </span>
          <input value={im.alt ?? ''} placeholder="Alt text" onChange={(e) => onAlt(i, e.target.value)} />
          <div className="ad-imgbtns">
            <button type="button" onClick={() => onMove(i, i - 1)} disabled={i === 0} aria-label="Move earlier">
              ←
            </button>
            <button type="button" onClick={() => onMove(i, i + 1)} disabled={i === images.length - 1} aria-label="Move later">
              →
            </button>
            <button type="button" onClick={() => onRemove(i)} className="ad-x">
              Remove
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function OptionsEditor({ options, onChange }: { options: CmsProduct['options']; onChange: (o: CmsProduct['options']) => void }) {
  const upd = (i: number, o: CmsProduct['options'][number]) => onChange(options.map((x, k) => (k === i ? o : x)));
  const updV = (i: number, j: number, v: Partial<CmsOptionValue>) => upd(i, { ...options[i], values: options[i].values.map((x, k) => (k === j ? { ...x, ...v } : x)) });
  return (
    <div className="ad-opts">
      {options.map((o, i) => (
        <div key={i} className="ad-opt">
          <div className="ad-opt__head">
            <input value={o.name} placeholder="Option name (e.g. Colour)" onChange={(e) => upd(i, { ...o, name: e.target.value })} />
            <button type="button" className="ad-x" onClick={() => onChange(options.filter((_, k) => k !== i))}>
              Remove option
            </button>
          </div>
          {o.values.map((v, j) => (
            <div key={j} className="ad-val">
              <input value={v.name} placeholder="Value (e.g. Black)" onChange={(e) => updV(i, j, { name: e.target.value })} />
              <label className="ad-color" title="Swatch colour">
                <input type="color" value={v.color || '#cccccc'} onChange={(e) => updV(i, j, { color: e.target.value })} />
                <input type="checkbox" checked={!!v.color} onChange={(e) => updV(i, j, { color: e.target.checked ? v.color || '#333333' : undefined })} aria-label="Use swatch" />
              </label>
              <input type="number" placeholder="Price override" value={v.price ?? ''} onChange={(e) => updV(i, j, { price: e.target.value === '' ? null : Number(e.target.value) })} />
              <button type="button" className="ad-x" onClick={() => upd(i, { ...o, values: o.values.filter((_, k) => k !== j) })} aria-label="Remove value">
                ×
              </button>
            </div>
          ))}
          <button type="button" className="ad-link" onClick={() => upd(i, { ...o, values: [...o.values, { name: '' }] })}>
            + Add value
          </button>
        </div>
      ))}
      <button type="button" className="ad-btn" onClick={() => onChange([...options, { name: '', values: [{ name: '' }] }])}>
        + Add option
      </button>
    </div>
  );
}

function SpecsEditor({ specs, onChange }: { specs: CmsProduct['specs']; onChange: (s: CmsProduct['specs']) => void }) {
  return (
    <div className="ad-specs">
      {specs.map((s, i) => (
        <div key={i} className="ad-spec">
          <input value={s.label} placeholder="Label (e.g. Impedance)" onChange={(e) => onChange(specs.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} />
          <textarea rows={1} value={s.value} placeholder="Value" onChange={(e) => onChange(specs.map((x, k) => (k === i ? { ...x, value: e.target.value } : x)))} />
          <button type="button" className="ad-x" onClick={() => onChange(specs.filter((_, k) => k !== i))} aria-label="Remove specification">
            ×
          </button>
        </div>
      ))}
      <button type="button" className="ad-btn" onClick={() => onChange([...specs, { label: '', value: '' }])}>
        + Add specification
      </button>
      <p className="ad-muted">
        Images are stored in Supabase Storage (<code>{SUPABASE.bucket}</code>); product data in the <code>products</code> table.
      </p>
    </div>
  );
}
