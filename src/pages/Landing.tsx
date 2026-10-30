import { COLLECTIONS, PAGES, ROUTES, SITE } from '../config/navigation';
import { Link } from '../router';
import { SiteHeader } from '../ui/SiteHeader';
import './landing.css';

/**
 * Placeholder landing route. Each collection resolves from config/navigation;
 * the full landing page is built in the next phase. Unknown paths → not found.
 */
export default function Landing({ path }: { path: string }) {
  const c = Object.values(COLLECTIONS).find((x) => x.route === path);
  const pg = Object.values(PAGES).find((x) => x.route === path);
  return (
    <div className="landing">
      <SiteHeader />
      <main className="landing__main">
        {c ? (
          <>
            <p className="landing__eyebrow">Landing page · placeholder route {c.route}</p>
            <h1 className="landing__title">{c.title}</h1>
            <p className="landing__lede">
              This collection page will be designed in the next phase. Until then, browse the live catalogue:
            </p>
            <ul className="landing__cats">
              {c.categories.map((k) => (
                <li key={k.href}>
                  <a href={k.href} target="_blank" rel="noreferrer">
                    {k.label} <span aria-hidden="true">↗</span>
                  </a>
                </li>
              ))}
            </ul>
            <a className="landing__live" href={c.live} target="_blank" rel="noreferrer">
              View all {c.title} on hifonix.co.uk <span aria-hidden="true">↗</span>
            </a>
          </>
        ) : pg ? (
          <>
            <p className="landing__eyebrow">Placeholder route {pg.route} · designed in a later phase</p>
            <h1 className="landing__title">{pg.title}</h1>
            <p className="landing__lede">This page hasn&rsquo;t been built yet.</p>
            {pg.live && (
              <a className="landing__live" href={pg.live} target="_blank" rel="noreferrer">
                View {pg.title} on hifonix.co.uk <span aria-hidden="true">↗</span>
              </a>
            )}
          </>
        ) : (
          <>
            <p className="landing__eyebrow">404</p>
            <h1 className="landing__title">Page not found</h1>
            <p className="landing__lede">
              Call us on {SITE.phone} or return to the homepage.
            </p>
          </>
        )}
        <Link to={ROUTES.home} className="landing__back">
          ← Back to the homepage
        </Link>
      </main>
    </div>
  );
}
