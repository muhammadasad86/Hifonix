import type { ReactNode } from 'react';
import { ROUTES } from '../config/navigation';
import { Link } from '../router';
import { LOGO_SRC } from './brand';
import './site-header.css';

/** Shared header: logo top-left (home link), optional controls top-right. */
export function SiteHeader({ end, hidden = false }: { end?: ReactNode; hidden?: boolean }) {
  return (
    <header className="site-header" data-hidden={hidden || undefined}>
      <Link to={ROUTES.home} className="site-header__logo" aria-label="Hifonix — home">
        <img src={LOGO_SRC} alt="Hifonix" width={782} height={207} />
      </Link>
      <div className="site-header__end">{end}</div>
    </header>
  );
}
