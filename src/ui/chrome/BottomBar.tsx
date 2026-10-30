import { type FormEvent, useState } from 'react';
import { CONTACT, SOCIAL } from '../../config/navigation';
import { Icon, Rule } from './icons';

/**
 * Figma "bottom" bar (instance 629:3066): copyright · socials | contacts · email sign-up.
 * `glass` = translucent overlay (hero / menu); `solid` = footer variant.
 * The sign-up is a UI placeholder — no newsletter backend is connected.
 */
export function BottomBar({ variant = 'glass', className = '' }: { variant?: 'glass' | 'solid'; className?: string }) {
  const [note, setNote] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setNote(true);
    window.setTimeout(() => setNote(false), 3200);
  };
  return (
    <div className={`hf-bar hf-bar--${variant} ${className}`}>
      <div className="hf-bar__start">
        <p className="hf-bar__copy">© 2026 Hifonix Studio. All rights reserved.</p>
        <Rule />
        <ul className="hf-bar__social">
          {SOCIAL.map((s) => (
            <li key={s.id}>
              {s.href ? (
                <a href={s.href} target="_blank" rel="noreferrer" aria-label={s.label}>
                  <Icon name={s.id} />
                </a>
              ) : (
                <span title={`${s.label} — link to be added`}>
                  <Icon name={s.id} />
                  <span className="sr-only">{s.label}</span>
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
      <div className="hf-bar__end">
        <ul className="hf-bar__contact">
          <li>
            <a href={`mailto:${CONTACT.email}`}>
              <Icon name="email" />
              {CONTACT.email}
            </a>
          </li>
          <li>
            <a href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}>
              <Icon name="phone" />
              {CONTACT.phone}
            </a>
          </li>
          <li>
            <span>
              <Icon name="whatsapp" />
              {CONTACT.whatsappLabel}
            </span>
          </li>
        </ul>
        <Rule />
        <form className="hf-bar__form" onSubmit={submit} noValidate>
          <label className="sr-only" htmlFor={`hf-bar-email-${variant}`}>
            Email
          </label>
          <input id={`hf-bar-email-${variant}`} type="email" name="email" placeholder="Email" autoComplete="email" />
          <button type="submit">Subscribe</button>
          <span className="hf-bar__note" role="status" data-show={note || undefined}>
            Sign-up isn&rsquo;t connected yet
          </span>
        </form>
      </div>
    </div>
  );
}
