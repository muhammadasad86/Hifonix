import { type FormEvent, type ReactNode, useState } from 'react';
import { type Enquiry, type EnquiryKind, submitEnquiry } from '../../commerce/enquiries';
import { PAGES } from '../../config/navigation';
import { Link } from '../../router';

/** Underlined field (Figma "label" rows: 18px Poppins Medium, #cbcbcb rule, 24px padding). */
export function Field({
  name,
  label,
  required,
  type = 'text',
  multiline,
  value,
  onChange,
  error,
  autoComplete,
}: {
  name: string;
  label: string;
  required?: boolean;
  type?: string;
  multiline?: boolean;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  autoComplete?: string;
}) {
  const id = `hi-${name}`;
  const common = {
    id,
    name,
    value,
    placeholder: ' ',
    required,
    autoComplete,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${id}-err` : undefined,
    onChange: (e: { target: { value: string } }) => onChange(e.target.value),
  };
  return (
    <div className="hi-field" data-multi={multiline || undefined} data-err={error ? '' : undefined}>
      {multiline ? <textarea rows={4} {...common} /> : <input type={type} {...common} />}
      <label htmlFor={id}>
        {label} {required && <span>(required)</span>}
      </label>
      {error && (
        <small id={`${id}-err`} role="alert">
          {error}
        </small>
      )}
    </div>
  );
}

type Values = Record<string, string>;
type Rules = Record<string, (v: string, all: Values) => string | undefined>;
const EMAIL = /^\S+@\S+\.\S+$/;
export const req = (msg: string) => (v: string) => (v.trim() ? undefined : msg);
export const email = (v: string) => (EMAIL.test(v.trim()) ? undefined : 'Enter a valid email address');

/**
 * Form state + submission via submitEnquiry (Supabase `enquiries` table when
 * configured; otherwise an honest "open your email app" fallback — nothing is
 * pretended to be sent).
 */
export function useEnquiryForm(kind: EnquiryKind, initial: Values, rules: Rules, toEnquiry: (v: Values) => Omit<Enquiry, 'kind'>) {
  const [v, setV] = useState<Values>(initial);
  const [tried, setTried] = useState(false);
  const [state, setState] = useState<{ s: 'idle' | 'busy' | 'sent' | 'mailto' | 'error'; msg?: string; href?: string }>({ s: 'idle' });
  const errors = Object.fromEntries(Object.entries(rules).map(([k, r]) => [k, r(v[k] ?? '', v)]).filter(([, e]) => e)) as Record<string, string>;
  const field = (k: string) => ({ value: v[k] ?? '', onChange: (x: string) => setV((p) => ({ ...p, [k]: x })), error: tried ? errors[k] : undefined });
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (Object.keys(errors).length) return;
    setState({ s: 'busy' });
    try {
      const r = await submitEnquiry({ kind, ...toEnquiry(v) });
      if (r.sent) {
        setState({ s: 'sent' });
        setV(initial);
        setTried(false);
      } else setState({ s: 'mailto', href: r.mailto });
    } catch (x) {
      setState({ s: 'error', msg: x instanceof Error ? x.message : 'Something went wrong.' });
    }
  };
  return { field, submit, state };
}

export function FormStatus({ state, sent }: { state: ReturnType<typeof useEnquiryForm>['state']; sent: ReactNode }) {
  if (state.s === 'sent')
    return (
      <p className="hi-status hi-status--ok" role="status">
        {sent}
      </p>
    );
  if (state.s === 'error')
    return (
      <p className="hi-status hi-status--err" role="alert">
        {state.msg}
      </p>
    );
  if (state.s === 'mailto')
    return (
      <p className="hi-status" role="status">
        Online form submissions aren’t connected in this demo yet.{' '}
        <a href={state.href}>Open your email app with this message</a> instead.
      </p>
    );
  return null;
}

export const PrivacyNote = () => (
  <p className="hi-fine">
    Details on how personal data is processed: <Link to={PAGES.privacy.route}>privacy policy</Link>.
  </p>
);
