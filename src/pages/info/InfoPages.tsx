import { type CSSProperties, type ReactNode, useMemo, useState } from 'react';
import { PAGES, ROUTES } from '../../config/navigation';
import { SHOP_ROUTES } from '../../config/shop';
import { Link } from '../../router';
import { useReveal } from '../../ui/chrome/scroll';
import { Breadcrumb } from '../../ui/shop/parts';
import { ShopLayout } from '../../ui/shop/ShopLayout';
import { ShopHero } from '../shop/Hero';
import '../shop/shop-pages.css';
import { email, Field, FormStatus, PrivacyNote, req, useEnquiryForm } from './forms';
import { type Block, type LegalDoc, PRIVACY, TERMS } from './legal';
import './info.css';

/**
 * Company pages — About (Figma 2155:85074), Contact (3304:25899),
 * Careers (3305:31526), Privacy (2155:85343), Terms (2155:85588).
 * Built on the shop shell (header, footer, cart drawer) and its tokens.
 */
const I = '/info';
const STORE = {
  address: 'Hifonix, 396 Birmingham Road, Sutton Coldfield, B72 1YJ',
  phone: '0121 382 5444',
  phoneHref: 'tel:+441213825444',
  email: 'sales@hifonix.co.uk',
  whatsapp: 'https://wa.me/971502402947',
  maps: 'https://www.google.com/maps/search/?api=1&query=396+Birmingham+Road+Sutton+Coldfield+B72+1YJ',
};

function Reveal({ as: Tag = 'div', className = '', style, children }: { as?: 'div' | 'section' | 'p' | 'figure'; className?: string; style?: CSSProperties; children: ReactNode }) {
  const [ref, inView] = useReveal<HTMLElement>(0.15);
  return (
    <Tag ref={ref as never} className={`hi-rv ${className}`} data-in={inView || undefined} style={style}>
      {children}
    </Tag>
  );
}

function Crumbs({ label }: { label: string }) {
  return (
    <div className="hi-crumbbar">
      <Breadcrumb items={[{ label: 'Home', to: ROUTES.splash }, { label }]} />
    </div>
  );
}

/** Store map (static image) — opens Google Maps. */
function StoreMap() {
  return (
    <a className="hi-map" href={STORE.maps} target="_blank" rel="noreferrer" aria-label="Open the store location in Google Maps">
      <img src={`${I}/map.webp`} alt="Map showing the Hifonix store location" loading="lazy" decoding="async" />
      <span className="hi-map__cta">Open in Maps ↗</span>
    </a>
  );
}

/* ================================================================= about */
const VALUES = [
  { k: 'Kindness', t: 'We treat every listener the way we would want to be treated — patiently, honestly and without pressure.' },
  { k: 'Trust', t: 'We recommend only what we would put in our own homes, and we stand behind every system we set up.' },
  { k: 'Quality', t: 'Every product we carry is auditioned in our rooms first; if it doesn’t move us, it doesn’t make the shelf.' },
  { k: 'Simplicity', t: 'Great sound shouldn’t be complicated. We make choosing, installing and living with it effortless.' },
  { k: 'Safety & Security', t: 'Your data, your payments and your equipment are handled with the same care we give our own.' },
  { k: 'Evaluation', t: 'We rely on internal signals and user feedback to continuously refine our service and our selection.' },
];
const LOCATIONS = [
  { k: 'United Kingdom', t: '396 Birmingham Rd, Wylde Green, Sutton Coldfield B72 1YJ, United Kingdom' },
  { k: 'United States', t: 'Partner showrooms — by appointment. Contact us to arrange a demonstration.' },
  { k: 'United Arab Emirates', t: 'Hifonix Studios UAE — hello@hifonixstudios.ae · 050 240 2947' },
];

function Picker({ items, className }: { items: { k: string; t: string }[]; className: string }) {
  const [on, setOn] = useState(0);
  return (
    <div className={`hi-picker ${className}`}>
      <ul role="tablist" aria-orientation="vertical">
        {items.map((v, i) => (
          <li key={v.k}>
            <button type="button" role="tab" aria-selected={i === on} onClick={() => setOn(i)} onMouseEnter={() => setOn(i)} onFocus={() => setOn(i)}>
              {v.k}
            </button>
          </li>
        ))}
      </ul>
      <p key={on} className="hi-picker__t" role="tabpanel" aria-live="polite">
        {items[on].t}
      </p>
    </div>
  );
}

export function AboutPage() {
  const news = useEnquiryForm('newsletter', { email: '', first: '', last: '', ok: '' }, { email, first: req('Enter your first name'), last: req('Enter your last name'), ok: req('Please accept to subscribe') }, (v) => ({
    email: v.email,
    name: `${v.first} ${v.last}`.trim(),
    subject: 'Newsletter sign-up',
  }));
  const okField = news.field('ok');
  return (
    <ShopLayout tone="overlay" title="About Us">
      <section className="hi-about-hero">
        <img className="hi-about-hero__bg" src={`${I}/about/hero.webp`} alt="" fetchPriority="high" />
        <Reveal className="hi-about-hero__copy">
          <h1 className="hi-script">When you live for music</h1>
          <div className="hi-about-hero__text">
            <p className="hi-display">
              <span className="hi-indent" />
              Welcome to Hifonix. With nearly 20 years of hi-fi experience, we provide expert guidance and premium sound for every listener.
            </p>
            <p>
              Our love for exceptional sound has driven us for almost two decades. Ten years ago, we decided to turn this passion into a reality by opening Hifonix. Our store is more than just a place to buy
              gear; it’s a haven for music lovers who appreciate the art and science of great sound.
            </p>
          </div>
        </Reveal>
      </section>

      <section className="hi-statement">
        <Reveal as="p">
          Experience pure, authentic sound with Hifonix. <span>High-fidelity audio built to bridge the gap between you and the artist for a lifetime.</span>
        </Reveal>
      </section>

      <section className="hi-values" aria-labelledby="hi-values-t">
        <h2 id="hi-values-t" className="hi-script">
          Our Values
        </h2>
        <Picker items={VALUES} className="hi-picker--values" />
      </section>

      <section className="hi-rooms" aria-label="Our listening rooms">
        <Reveal as="figure" className="hi-rooms__a">
          <img src={`${I}/about/room.webp`} alt="Hifonix listening room with turntable and speakers" loading="lazy" />
        </Reveal>
        <Reveal as="figure" className="hi-rooms__b">
          <img src={`${I}/about/lounge.webp`} alt="The Hifonix lounge" loading="lazy" />
        </Reveal>
      </section>

      <section className="hi-story">
        <Reveal className="hi-story__intro">
          <p className="hi-display">
            <span className="hi-indent" />
            At Hifonix, we are proud to be recognised worldwide as one of the finest destinations for high-end headphone experiences.
          </p>
          <p>
            Our dedication to excellence and our passion for exceptional sound quality have earned us a stellar reputation among audiophiles and music enthusiasts nationwide. From our meticulously curated
            selection of premium headphones to our expert advice and personalised service, we ensure that every customer experiences the pinnacle of audio performance.
          </p>
        </Reveal>
        <dl className="hi-story__meta">
          <div>
            <dt>Type</dt>
            <dd>Commercial Workplace</dd>
          </div>
          <div>
            <dt>Location</dt>
            <dd>United Kingdom</dd>
          </div>
        </dl>
        <div className="hi-story__grid">
          <Reveal as="figure" className="hi-story__team">
            <img src={`${I}/about/team.webp`} alt="The Hifonix team" loading="lazy" />
          </Reveal>
          <div className="hi-story__side">
            <Reveal as="figure" className="hi-story__bar">
              <img src={`${I}/about/bar.webp`} alt="The Hifonix headphone bar" loading="lazy" />
            </Reveal>
            <Reveal as="p">
              At Hifonix, we don’t just sell headphones; we provide an unparalleled auditory journey that redefines the way you listen to music — with listening stations, expert set-up and aftercare
              from people who live for sound.
            </Reveal>
          </div>
        </div>
      </section>

      <section className="hi-world" aria-labelledby="hi-world-t">
        <h2 id="hi-world-t" className="sr-only">
          Where to find us
        </h2>
        <Picker items={LOCATIONS} className="hi-picker--world" />
        <img className="hi-world__globe" src={`${I}/about/world.webp`} alt="" loading="lazy" />
      </section>

      <section className="hi-statement">
        <Reveal as="p">
          Discover the Hifonix Lounge, where Head-Fi experts provide <span>personalized service and a world-class selection to help you find your perfect sound.</span>
        </Reveal>
      </section>

      <section className="hi-join">
        <form className="hi-form" onSubmit={news.submit} noValidate>
          <p className="hi-join__eyebrow">
            The house of <b>Hifonix Studio</b>
          </p>
          <h2 className="hi-display">Join our global community for exclusive benefits and news about</h2>
          <ul className="hi-checks">
            {['New & limited products', 'Exclusive events', 'Personalised content', 'Special offers', 'Behind the scenes'].map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <Field name="news-email" label="Email" required type="email" autoComplete="email" {...news.field('email')} />
          <div className="hi-2">
            <Field name="news-first" label="First name" required autoComplete="given-name" {...news.field('first')} />
            <Field name="news-last" label="Last name" required autoComplete="family-name" {...news.field('last')} />
          </div>
          <label className="hi-consent" data-err={okField.error ? '' : undefined}>
            <input type="checkbox" checked={okField.value === 'y'} onChange={(e) => okField.onChange(e.target.checked ? 'y' : '')} />
            <span>
              I accept that Hifonix Studio can contact me via digital communication, including email with personalised marketing of our products and events. Unsubscribing is possible at any time.
            </span>
          </label>
          {okField.error && <small className="hi-err">{okField.error}</small>}
          <PrivacyNote />
          <button type="submit" className="hi-pill" disabled={news.state.s === 'busy'}>
            {news.state.s === 'busy' ? 'Subscribing…' : 'Subscribe'}
          </button>
          <FormStatus state={news.state} sent="Thank you — you’re on the list." />
        </form>
        <StoreMap />
      </section>
    </ShopLayout>
  );
}

/* =============================================================== contact */
export function ContactPage() {
  const f = useEnquiryForm(
    'contact',
    { first: '', last: '', phone: '', subject: '', message: '', email: '' },
    { first: req('Enter your first name'), last: req('Enter your last name'), email, phone: req('Enter a contact number'), subject: req('Enter a subject'), message: req('Write a message') },
    (v) => ({ name: `${v.first} ${v.last}`.trim(), email: v.email, phone: v.phone, subject: v.subject, message: v.message }),
  );
  return (
    <ShopLayout tone="overlay" title="Contact Us">
      <ShopHero image={{ url: `${I}/contact/hero.webp`, alt: 'Hifonix listening room' }} title="Contact Us" target="hi-main" cue="Scroll to learn more">
        <p>Visit the studio, call or message us — our specialists are here to help you find your sound.</p>
      </ShopHero>
      <Crumbs label="Contact Us" />
      <div id="hi-main">
        <section className="hi-visit">
          <StoreMap />
          <Reveal className="hi-visit__copy">
            <h2 className="hi-h">Visit our store</h2>
            <p className="hi-visit__addr">{STORE.address}</p>
            <dl>
              <div>
                <dt>Monday to Saturday</dt>
                <dd>10:00 am – 5:00 pm</dd>
              </div>
              <div>
                <dt>Working days</dt>
                <dd>5 pm – 6 pm by appointment only</dd>
              </div>
              <div>
                <dt>Sundays &amp; Bank Holidays</dt>
                <dd>Closed</dd>
              </div>
            </dl>
          </Reveal>
        </section>

        <section className="hi-ways" aria-label="Ways to reach us">
          {[
            { icon: 'call', h: 'Call us', big: STORE.phone, href: STORE.phoneHref, t: 'Please call to speak to our dedicated sales & support team.' },
            { icon: 'message', h: 'Send message', big: STORE.email, href: `mailto:${STORE.email}`, t: 'Send us a message below or reach out via email.' },
            { icon: 'whatsapp', h: 'Whatsapp', big: 'Reach out anytime', href: STORE.whatsapp, t: 'Message our team on WhatsApp — we usually reply within the hour.' },
          ].map((w, i) => (
            <Reveal key={w.h} className="hi-way" style={{ '--d': i } as CSSProperties}>
              <img src={`${I}/icons/${w.icon}.svg`} alt="" width={56} height={56} />
              <h3 className="hi-display">{w.h}</h3>
              <a href={w.href} target={w.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                {w.big}
              </a>
              <p>{w.t}</p>
            </Reveal>
          ))}
        </section>

        <section className="hi-talk">
          <form className="hi-form" onSubmit={f.submit} noValidate>
            <h2 className="hi-display hi-rule">Let’s talk about</h2>
            <p className="hi-lead">Do you have any questions, requests or ideas? Or maybe you simply want to get to know us better? Whatever the reason, this is everything you need to contact us.</p>
            <div className="hi-2">
              <Field name="c-first" label="First name" required autoComplete="given-name" {...f.field('first')} />
              <Field name="c-last" label="Last name" required autoComplete="family-name" {...f.field('last')} />
            </div>
            <div className="hi-2">
              <Field name="c-email" label="Email" required type="email" autoComplete="email" {...f.field('email')} />
              <Field name="c-phone" label="Contact Number" required type="tel" autoComplete="tel" {...f.field('phone')} />
            </div>
            <Field name="c-subject" label="Subject" required {...f.field('subject')} />
            <Field name="c-message" label="Message" required multiline {...f.field('message')} />
            <PrivacyNote />
            <button type="submit" className="hi-pill hi-pill--solid" disabled={f.state.s === 'busy'}>
              {f.state.s === 'busy' ? 'Sending…' : 'Send'}
            </button>
            <FormStatus state={f.state} sent="Thank you — your message has been received. We’ll be in touch shortly." />
          </form>
        </section>

        <section className="hi-access" aria-label="Facilities">
          {[
            { icon: 'parking', h: 'Parking Facilities', t: 'Accessible parking spaces are available to accommodate the needs of all visitors.' },
            { icon: 'access', h: 'Accessibility Services', t: 'Accessible facilities for disabled individuals are provided to ensure inclusivity and equal opportunities.' },
          ].map((a) => (
            <Reveal key={a.h} className="hi-access__item">
              <img src={`${I}/icons/${a.icon}.svg`} alt="" height={56} />
              <h3 className="hi-display">{a.h}</h3>
              <p>{a.t}</p>
            </Reveal>
          ))}
        </section>
      </div>
    </ShopLayout>
  );
}

/* =============================================================== careers */
const JOBS = [
  { title: 'Associate Producer (Production, Videographer, Content)', region: 'Middle East', team: 'Associate Producer', discipline: 'Content' },
  { title: 'Head of Narrative & Storytelling for an International Consulting Firm', region: 'Middle East', team: 'Head of Narrative', discipline: 'Marketing' },
  { title: 'Audio Video Support Engineer', region: 'Middle East', team: 'UC Engineer', discipline: 'Engineering' },
];
const BENEFITS = [
  { h: ['Paid', 'Days Off'], t: '2 sick days, 3 personal days, December 25 to January 1, your birthday, and all other leave provided by labour laws.' },
  { h: ['Various', 'Benefits'], t: 'Flexible, hybrid or compressed schedule (depending on the position), free coffee on site, casual dress code, an activity incentive programme and an employee discount.' },
  { h: ['Collective', 'Insurances'], t: 'Medical expenses and care coverage, long-term disability, employee assistance programme, life insurance, accidental death and dismemberment.' },
  { h: ['Investment', 'For Your Future'], t: 'Retirement savings plan with employer contribution up to 3%, and training programmes.' },
];

function Split({ title, children, image, alt, side, reverse }: { title: ReactNode; children: ReactNode; image: string; alt: string; side: string; reverse?: boolean }) {
  return (
    <section className="hi-split" data-reverse={reverse || undefined}>
      <Reveal className="hi-split__copy">
        <h2 className="hi-h">{title}</h2>
        <span className="hi-split__rule" aria-hidden="true" />
        {children}
      </Reveal>
      <div className="hi-split__media">
        <Reveal as="figure">
          <img src={image} alt={alt} loading="lazy" />
        </Reveal>
        <p className="hi-split__side" aria-hidden="true">
          <span />
          {side}
        </p>
      </div>
    </section>
  );
}

export function CareersPage() {
  const [q, setQ] = useState('');
  const [disc, setDisc] = useState('');
  const [team, setTeam] = useState('');
  const [region, setRegion] = useState('');
  const jobs = useMemo(
    () => JOBS.filter((j) => (!disc || j.discipline === disc) && (!team || j.team === team) && (!region || j.region === region) && j.title.toLowerCase().includes(q.trim().toLowerCase())),
    [q, disc, team, region],
  );
  const opts = (k: 'discipline' | 'team' | 'region') => [...new Set(JOBS.map((j) => j[k]))];
  return (
    <ShopLayout tone="overlay" title="Careers">
      <ShopHero image={{ url: `${I}/careers/hero.webp`, alt: 'Hifonix listening studio' }} title="Career" target="hi-main" cue="Scroll to learn more">
        <p>Join the team that defines the state of the art!</p>
      </ShopHero>
      <Crumbs label="Careers" />
      <div id="hi-main">
        <Split title="Let’s build the future of music together" image={`${I}/careers/studio.webp`} alt="Speaker and turntable in the Hifonix studio" side="Let’s build the future of music together">
          <p className="hi-lead">
            We are an independent company specialising in <b>high-fidelity music systems</b>, with the mission of exalting the essence and emotion of music. <b>Hifonix</b> has garnered{' '}
            <b>numerous awards</b> and is highly acclaimed by customers and media alike, which makes our team of experts very proud. We want to share our passion for sound purity with you.
          </p>
        </Split>
        <Split title={<>Hifonix A Family Story</>} image={`${I}/careers/family.webp`} alt="Members of the Hifonix team" side="Hifonix a Family Story" reverse>
          <p className="hi-lead">
            For us, music is an emotional experience that cannot be described with words. We continue to believe that the exploration of better sound is an adventure to experience together. If you are
            looking for a long-term career, do not hesitate to contact us — we gladly accept spontaneous applications.
          </p>
          <p className="hi-lead">Would you like to be the next talent to join the Hifonix adventure?</p>
        </Split>

        <section className="hi-benefits">
          <Reveal className="hi-benefits__head">
            <h2 className="hi-h">Benefits for you</h2>
            <p>Our benefits are designed to help you and your family live well so you can enjoy your journey at Hifonix. There may be some variance in specific benefits across regions.</p>
          </Reveal>
          <div className="hi-benefits__grid">
            {BENEFITS.map((b, i) => (
              <Reveal key={b.h[0]} style={{ '--d': i } as CSSProperties}>
                <h3>
                  {b.h[0]}
                  <br />
                  {b.h[1]}
                </h3>
                <p>{b.t}</p>
              </Reveal>
            ))}
          </div>
        </section>

        <Split title="Recipient of a second Excellence Award" image={`${I}/careers/award.webp`} alt="The Hifonix headphone bar" side="Recipient of a second Excellence Award">
          <p className="hi-lead">
            Hifonix proudly celebrates a major milestone — a second award for innovation and excellence in high-end audio, recognising our ongoing commitment to pushing the boundaries of how music is
            experienced.
          </p>
        </Split>

        <section className="hi-jobs" aria-labelledby="hi-jobs-t">
          <h2 id="hi-jobs-t" className="hi-h">
            Join the team
          </h2>
          <div className="hi-jobs__filters">
            <label className="hi-select">
              <span className="sr-only">Search roles</span>
              <input type="search" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
            </label>
            {(
              [
                ['Discipline', disc, setDisc, 'discipline'],
                ['Country / region', region, setRegion, 'region'],
                ['Team', team, setTeam, 'team'],
              ] as const
            ).map(([label, val, set, k]) => (
              <label key={k} className="hi-select">
                <span className="sr-only">{label}</span>
                <select value={val} onChange={(e) => set(e.target.value)}>
                  <option value="">{label}</option>
                  {opts(k).map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <p className="hi-jobs__count" aria-live="polite">
            {String(jobs.length).padStart(2, '0')} result{jobs.length === 1 ? '' : 's'}
          </p>
          <ul className="hi-jobs__list">
            {jobs.map((j) => (
              <li key={j.title}>
                <a href={`mailto:${STORE.email}?subject=${encodeURIComponent(`Application: ${j.title}`)}`}>
                  <span className="hi-jobs__title">{j.title}</span>
                  <span className="hi-jobs__region">{j.region}</span>
                  <span className="hi-jobs__tag">{j.team}</span>
                  <img src={`${I}/icons/arrow.svg`} alt="" width={45} height={45} />
                </a>
              </li>
            ))}
            {!jobs.length && <li className="hi-jobs__none">No roles match — send a spontaneous application to {STORE.email}.</li>}
          </ul>
        </section>
      </div>
    </ShopLayout>
  );
}

/* ================================================================= legal */
function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) =>
        'p' in b ? (
          <p key={i}>{b.p}</p>
        ) : 'ul' in b ? (
          <ul key={i} className="hi-dash">
            {b.ul.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        ) : (
          <ol key={i} className="hi-steps">
            {b.steps.map((s) => (
              <li key={s.label}>
                <b>{s.label}</b>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        ),
      )}
    </>
  );
}

function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <ShopLayout tone="overlay" title={doc.title}>
      <section className="hi-legal-hero">
        <Reveal className="hi-legal-hero__copy">
          {doc.eyebrow && <p className="hi-eyebrow">{doc.eyebrow}</p>}
          <h1 className="hi-h">{doc.title}</h1>
          <p>{doc.lead}</p>
        </Reveal>
      </section>
      <div className="hi-legal">
        <nav className="hi-legal__toc" aria-label="Sections">
          {doc.sections.map((s, i) => (
            <span key={s.id}>
              {i > 0 && <i aria-hidden="true"> – </i>}
              <a href={`#${s.id}`} onClick={(e) => (e.preventDefault(), document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))}>
                {s.title}
              </a>
            </span>
          ))}
        </nav>
        <p className="hi-draft" role="note">
          Draft — this copy is taken from the approved designs and is pending legal review.
        </p>
        {doc.sections.map((s, i) => (
          <section key={s.id} id={s.id} className="hi-legal__sec">
            <h2>
              {i + 1}– {s.title}
            </h2>
            {s.meta && (
              <p className="hi-legal__meta">
                {s.meta[0]} <span>{s.meta[1]}</span>
              </p>
            )}
            {s.intro && <Blocks blocks={s.intro} />}
            {s.clauses.map((c, j) => (
              <div key={j} className="hi-legal__clause">
                {c.title && <h3>{c.title}</h3>}
                <Blocks blocks={c.body} />
              </div>
            ))}
            {s.outro && <Blocks blocks={s.outro} />}
          </section>
        ))}
        <p className="hi-legal__more">
          Questions? <Link to={PAGES.contact.route}>Contact us</Link> · <Link to={SHOP_ROUTES.cart}>Back to your cart</Link>
        </p>
      </div>
    </ShopLayout>
  );
}
export const PrivacyPage = () => <LegalPage doc={PRIVACY} />;
export const TermsPage = () => <LegalPage doc={TERMS} />;

/** Route → page for the company pages (App.tsx). */
export default function InfoPage({ path }: { path: string }) {
  switch (path) {
    case PAGES.about.route:
      return <AboutPage />;
    case PAGES.contact.route:
    case PAGES.storeLocation.route:
      return <ContactPage />;
    case PAGES.careers.route:
      return <CareersPage />;
    case PAGES.privacy.route:
      return <PrivacyPage />;
    default:
      return <TermsPage />;
  }
}
