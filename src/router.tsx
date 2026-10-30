import { type AnchorHTMLAttributes, type MouseEvent, useSyncExternalStore } from 'react';

/**
 * Minimal History-API router (no dependency). Vite's dev server already falls
 * back to index.html for unknown paths, so deep links work locally.
 */
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  window.addEventListener('popstate', fn);
  return () => {
    listeners.delete(fn);
    window.removeEventListener('popstate', fn);
  };
};
const getPath = () => normalise(window.location.pathname);

function normalise(p: string) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  let path = base && p.startsWith(base) ? p.slice(base.length) : p;
  if (!path.startsWith('/')) path = `/${path}`;
  return path.length > 1 ? path.replace(/\/$/, '') : path;
}

export function usePath() {
  return useSyncExternalStore(subscribe, getPath, () => '/');
}

/** Full URL path for an app route (adds the deploy base, e.g. /Hifonix on GitHub Pages). */
export const href = (to: string) => {
  const base = import.meta.env.BASE_URL === './' ? '' : import.meta.env.BASE_URL.replace(/\/$/, '');
  return to.startsWith('/') ? `${base}${to}` : to;
};

export function navigate(to: string, { replace = false }: { replace?: boolean } = {}) {
  if (to === getPath()) return;
  window.history[replace ? 'replaceState' : 'pushState']({}, '', href(to));
  window.scrollTo(0, 0);
  listeners.forEach((l) => l());
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { to: string };

/** In-app link: real <a href> (accessible, new-tab friendly), client-side navigation on plain click. */
export function Link({ to, onClick, ...rest }: LinkProps) {
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(to);
  };
  return <a href={href(to)} onClick={handle} {...rest} />;
}
