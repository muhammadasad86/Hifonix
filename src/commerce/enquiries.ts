import { CMS_CONFIGURED, SUPABASE } from './config';

/**
 * Contact / newsletter / job-application submissions.
 *
 * Integration point: with Supabase configured, rows go to `public.enquiries`
 * (insert-only for visitors, readable by admins — see supabase/schema.sql).
 * Without it nothing is sent from the site: `submitEnquiry` returns
 * `{ sent: false, mailto }` and the form offers to open the visitor's email app.
 */
export type EnquiryKind = 'contact' | 'newsletter' | 'careers';
export interface Enquiry {
  kind: EnquiryKind;
  name?: string;
  email: string;
  phone?: string;
  subject?: string;
  message?: string;
}
export const ENQUIRY_EMAIL = 'sales@hifonix.co.uk';

export async function submitEnquiry(e: Enquiry): Promise<{ sent: true } | { sent: false; mailto: string }> {
  if (!CMS_CONFIGURED) {
    const body = [e.message, '', e.name, e.email, e.phone].filter((x) => x !== undefined).join('\n');
    return { sent: false, mailto: `mailto:${ENQUIRY_EMAIL}?subject=${encodeURIComponent(e.subject || `Hifonix ${e.kind}`)}&body=${encodeURIComponent(body)}` };
  }
  const res = await fetch(`${SUPABASE.url}/rest/v1/enquiries`, {
    method: 'POST',
    headers: { apikey: SUPABASE.anonKey, Authorization: `Bearer ${SUPABASE.anonKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ kind: e.kind, name: e.name ?? null, email: e.email, phone: e.phone ?? null, subject: e.subject ?? null, message: e.message ?? null }),
  });
  if (!res.ok) throw new Error('Sorry — your message could not be sent. Please try again or email us directly.');
  return { sent: true };
}
