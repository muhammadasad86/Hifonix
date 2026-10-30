/**
 * Data-source configuration (Vite env, see .env.example).
 *
 *   VITE_SUPABASE_URL        https://<project>.supabase.co
 *   VITE_SUPABASE_ANON_KEY   the project's anon *public* key
 *
 * Both values are public by design: every write is protected by Supabase Auth
 * + row-level security (supabase/schema.sql). Never put the service_role key
 * (or any other secret) in a VITE_ variable — it would ship to browsers.
 * Without them the site runs on the bundled demo catalogue.
 */
const env: Record<string, string | undefined> = (import.meta as { env?: Record<string, string | undefined> }).env ?? {};

export const SUPABASE = {
  url: (env.VITE_SUPABASE_URL ?? '').trim().replace(/\/$/, ''),
  anonKey: (env.VITE_SUPABASE_ANON_KEY ?? '').trim(),
  bucket: 'product-images',
};
export const CMS_CONFIGURED = Boolean(SUPABASE.url && SUPABASE.anonKey);

/** localStorage key holding the cart between visits */
export const CART_KEY = 'hifonix.cart';
export const CURRENCY = { code: 'GBP', locale: 'en-GB' };
