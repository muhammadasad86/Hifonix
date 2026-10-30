import { SUPABASE } from './config';

/**
 * Minimal Supabase client over the public REST endpoints (Auth · PostgREST ·
 * Storage) — no SDK dependency. Reads use the anon key and only ever see
 * published rows (row-level security). Writes need an admin session.
 */
export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number; // epoch seconds
  user: { id: string; email?: string };
}
const SESSION_KEY = 'hifonix.cms.session';

const base = (path: string) => `${SUPABASE.url}${path}`;
const headers = (token?: string, extra: Record<string, string> = {}) => ({
  apikey: SUPABASE.anonKey,
  Authorization: `Bearer ${token ?? SUPABASE.anonKey}`,
  ...extra,
});

async function ok<T>(res: Response): Promise<T> {
  if (res.ok) return (res.status === 204 ? null : await res.json()) as T;
  let msg = `${res.status} ${res.statusText}`;
  try {
    const j = (await res.json()) as { message?: string; msg?: string; error_description?: string; error?: string };
    msg = j.message ?? j.msg ?? j.error_description ?? j.error ?? msg;
  } catch {
    /* keep status text */
  }
  throw new Error(msg);
}

/* ---------------------------------------------------------------- auth */
export const auth = {
  read(): Session | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      return null;
    }
  },
  write(s: Session | null) {
    try {
      if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
      else localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  },
  async signIn(email: string, password: string) {
    const s = await ok<Omit<Session, 'expires_at'> & { expires_in: number }>(
      await fetch(base('/auth/v1/token?grant_type=password'), {
        method: 'POST',
        headers: headers(undefined, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ email, password }),
      }),
    );
    const session = { ...s, expires_at: Math.floor(Date.now() / 1000) + s.expires_in };
    auth.write(session);
    return session;
  },
  /** valid access token, refreshed when close to expiry; null when signed out */
  async token(): Promise<string | null> {
    const s = auth.read();
    if (!s) return null;
    if (s.expires_at - 60 > Date.now() / 1000) return s.access_token;
    try {
      const r = await ok<Omit<Session, 'expires_at'> & { expires_in: number }>(
        await fetch(base('/auth/v1/token?grant_type=refresh_token'), {
          method: 'POST',
          headers: headers(undefined, { 'Content-Type': 'application/json' }),
          body: JSON.stringify({ refresh_token: s.refresh_token }),
        }),
      );
      const next = { ...r, expires_at: Math.floor(Date.now() / 1000) + r.expires_in };
      auth.write(next);
      return next.access_token;
    } catch {
      auth.write(null);
      return null;
    }
  },
  async signOut() {
    const t = auth.read()?.access_token;
    auth.write(null);
    if (t) await fetch(base('/auth/v1/logout'), { method: 'POST', headers: headers(t) }).catch(() => {});
  },
};

/* ----------------------------------------------------------- PostgREST */
export const db = {
  async select<T>(table: string, query: string, token?: string): Promise<T[]> {
    return ok<T[]>(await fetch(base(`/rest/v1/${table}?${query}`), { headers: headers(token) }));
  },
  async insert<T>(table: string, row: Partial<T>, token: string): Promise<T> {
    const r = await ok<T[]>(
      await fetch(base(`/rest/v1/${table}`), {
        method: 'POST',
        headers: headers(token, { 'Content-Type': 'application/json', Prefer: 'return=representation' }),
        body: JSON.stringify(row),
      }),
    );
    return r[0];
  },
  async update<T>(table: string, id: string, patch: Partial<T>, token: string): Promise<T> {
    const r = await ok<T[]>(
      await fetch(base(`/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`), {
        method: 'PATCH',
        headers: headers(token, { 'Content-Type': 'application/json', Prefer: 'return=representation' }),
        body: JSON.stringify(patch),
      }),
    );
    if (!r.length) throw new Error('Not saved — your account may not have admin rights (see supabase/schema.sql → admins).');
    return r[0];
  },
  async rpc<T>(fn: string, token?: string, args: Record<string, unknown> = {}): Promise<T> {
    return ok<T>(
      await fetch(base(`/rest/v1/rpc/${fn}`), {
        method: 'POST',
        headers: headers(token, { 'Content-Type': 'application/json' }),
        body: JSON.stringify(args),
      }),
    );
  },
  async remove(table: string, id: string, token: string) {
    await ok(await fetch(base(`/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`), { method: 'DELETE', headers: headers(token) }));
  },
};

/* -------------------------------------------------------------- storage */
export const storage = {
  publicUrl: (path: string) => base(`/storage/v1/object/public/${SUPABASE.bucket}/${path}`),
  async upload(path: string, file: Blob, token: string) {
    await ok(
      await fetch(base(`/storage/v1/object/${SUPABASE.bucket}/${path}`), {
        method: 'POST',
        headers: headers(token, { 'Content-Type': file.type || 'application/octet-stream', 'x-upsert': 'true', 'cache-control': '31536000' }),
        body: file,
      }),
    );
    return storage.publicUrl(path);
  },
  async remove(paths: string[], token: string) {
    if (!paths.length) return;
    await ok(
      await fetch(base(`/storage/v1/object/${SUPABASE.bucket}`), {
        method: 'DELETE',
        headers: headers(token, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ prefixes: paths }),
      }),
    );
  },
};
