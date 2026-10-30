import { CONTACT, FOOTER_COLUMNS, ROUTES } from '../../config/navigation';
import { Link } from '../../router';
import { BottomBar } from './BottomBar';
import { Icon } from './icons';
import { useReveal } from './scroll';

const A = '/hifi';

/** Figma footer (1-419): brand + contact · link columns · locale + reviews, then the bottom bar. */
export function SiteFooter() {
  const [ref, inView] = useReveal<HTMLElement>(0.15);
  return (
    <footer ref={ref} className="hf-footer" data-in={inView || undefined}>
      <div className="hf-footer__main">
        <div className="hf-footer__grid">
          <div className="hf-footer__brand">
            <Link to={ROUTES.splash} className="hf-footer__home" aria-label="Hifonix Studios — start">
              <img className="hf-footer__logo" src={`${A}/footer-logo.svg`} alt="Hifonix Studios" width={146.41} height={55} />
            </Link>
            <address>
              <p>
                {CONTACT.store.address[0]}
                <br />
                {CONTACT.store.address[1]}
              </p>
              <p className="hf-footer__lines">
                <a href={`tel:${CONTACT.store.phone.replace(/\s/g, '')}`}>{CONTACT.store.phone}</a>
                <a href={`mailto:${CONTACT.store.email}`}>{CONTACT.store.email}</a>
              </p>
            </address>
          </div>
          <div className="hf-footer__cols">
            {FOOTER_COLUMNS.map((c) => (
              <nav key={c.title} className="hf-footer__col" aria-label={c.title}>
                <h2>{c.title}</h2>
                <ul>
                  {c.links.map((l) => (
                    <li key={l.label}>
                      <Link to={l.to}>{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <div className="hf-footer__aside">
          <div className="hf-locale" title="Region & language selection — coming later">
            <span className="hf-locale__icon">
              <Icon name="globe" />
            </span>
            <span className="hf-locale__text">
              <span className="hf-locale__region">
                International
                <img src={`${A}/fa-chevron-down.svg`} alt="" />
              </span>
              <span className="hf-locale__lang">English</span>
            </span>
          </div>
          <div className="hf-reviews">
            <p>{CONTACT.reviews}</p>
            <span className="hf-trustpilot" role="img" aria-label="Trustpilot">
              <span className="hf-trustpilot__img">
                <img src={`${A}/trustpilot.png`} alt="" />
              </span>
              <span className="hf-trustpilot__mask" style={{ maskImage: `url(${A}/trustpilot-mask.png)`, WebkitMaskImage: `url(${A}/trustpilot-mask.png)` }} />
            </span>
          </div>
        </div>
      </div>
      <BottomBar variant="solid" />
    </footer>
  );
}
