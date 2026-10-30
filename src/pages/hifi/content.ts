import { PAGES } from '../../config/navigation';

/**
 * Hi-Fi landing page content (Figma node 1-4435).
 *
 * Presentation components read ONLY from this module, so each block can later
 * be sourced from Shopify (page metafields / metaobjects, collection handles)
 * without touching layout code. Copy is reproduced verbatim from Figma.
 * Shopify is NOT connected: there is no product, price or stock data here.
 */
const A = '/hifi';

export const HERO = {
  image: `${A}/hero-speaker.png`,
  /** Two text states from the Figma hero; `0` is the visible state in the frame. */
  slides: [
    {
      title: 'Hifonix - For the love of music',
      body: ['Where bold design meets unmatched sound —', 'a soundbar that demands attention.'],
      cta: { label: 'Learn More', target: 'hf-elevate' },
    },
    {
      title: 'Hi-Fi',
      body: ['Premium Hi-Fi crafted for clarity, power, and realism.', 'Experience music beyond ordinary listening.'],
      cta: { label: 'Start exploring', target: 'hf-brands' },
    },
  ],
} as const;

/** Brand logo strip — order as in Figma (05 and 03 repeat at the end). */
export const LOGO_STRIP = [
  { src: `${A}/brand-01.png`, w: 128.571, h: 67.286 },
  { src: `${A}/brand-02.png`, w: 96.857, h: 60.439 },
  { src: `${A}/brand-03.png`, w: 89.286, h: 55.714 },
  { src: `${A}/brand-04.png`, w: 129.429, h: 80.763 },
  { src: `${A}/brand-05.png`, w: 127.714, h: 79.694 },
  { src: `${A}/brand-06.png`, w: 97.714, h: 97.714 },
  { src: `${A}/brand-07.png`, w: 129.429, h: 80.763 },
  { src: `${A}/brand-08.png`, w: 108.857, h: 67.927 },
  { src: `${A}/brand-05.png`, w: 127.714, h: 79.694 },
  { src: `${A}/brand-03.png`, w: 89.286, h: 55.714 },
] as const;

const STORY =
  "Our love for exceptional sound has driven us for almost two decades. Ten years ago, we decided to turn this passion into a reality by opening Hifonix. Our store is more then just a place to buy gear; it's a heaven for music lover who appreciate the art and science of great sound.";

export const ELEVATE = {
  bg: `${A}/elevate-bg.png`,
  product: `${A}/elevate-headphone.png`,
  title: ['Elevate Your', 'Hi-Fi, Headphone', '& Portable Audio Experience'],
  body: STORY,
} as const;

export interface BrandSlide {
  id: string;
  title: string;
  body: string;
  to: string;
  image: string;
  /** optional looping video for the slide; `image` is its poster */
  video?: string;
}

export const BRAND_SLIDES: BrandSlide[] = [
  {
    id: 'aavik',
    title: 'Aavik',
    body: 'Aavik designs and manufactures high-end audio electronics built to deliver exceptional musical performance. Our product portfolio includes integrated amplifiers, power amplifiers, preamplifiers, digital-to-analog converters, phono stages, and streamers — each developed to set new standards for clarity, dynamics, and musical authenticity.',
    to: PAGES.aavik.route,
    // Figma "Aavik-video 1" — poster frame exported from Figma; video file pending from client
    image: `${A}/brand-slide-1-export.png`,
  },
  {
    id: 'mysphere',
    title: 'Mysphere',
    body: 'The roots of MYSPHERE 3.1 go back to the legendary flagship headphone K1000 of AKG, introduced to the market in 1989. Two outstanding acoustic engineers are associated with the history of the K1000: Helmut Ryback, who developed the AKG K 240 DF, at that time reference headphone for many radio stations, and Heinz Renner, leading in concept and development of the K 1000, together with Helmut Ryback.',
    to: PAGES.mysphere.route,
    image: `${A}/brand-slide-2.png`,
  },
  {
    id: 'evo-one',
    title: 'EvoOne',
    body: 'The Evo One features a unique Triple Analog architecture, switching between Dual Nutube tubes and Pure Transistor mode. Powered by a flagship Qualcomm platform with a reference-grade AKM DAC array, it delivers exceptional clarity and power. Available in Copper for rich warmth or Titanium for speed and holographic precision.',
    to: PAGES.evoOne.route,
    image: `${A}/brand-slide-3.png`,
  },
  {
    id: 'manley',
    title: 'Manley',
    body: 'Since its introduction, the Manley Massive Passive has redefined passive tube equalization: organic, musical, and unmistakably powerful. Hand-built in California, it combines metal-film resistors, film capacitors, and hand-wound inductors with all-tube makeup gain stages, to deliver unparalleled tonal sculpting for tracking and mastering.',
    to: PAGES.manley.route,
    image: `${A}/brand-slide-4.png`,
  },
];

export const HEADFI = {
  bg: `${A}/headfi-bg.png`,
  title: ['Head-Fi', 'Experience At', 'Hifonix'],
  body: 'The Vision Behind Hifonix Studio',
} as const;

export const ART = {
  bg: `${A}/art-bg.png`,
  product: `${A}/art-headphones.png`,
  title: ['The Art', 'of Headphone', 'Listening'],
  body: ['Hifonix delivers world-class', 'high-end headphone experiences', 'through curated products, expert', 'guidance, and pure sound.'],
} as const;

export const EXTRA_MILE = {
  imageA: `${A}/extra-mile-a.png`,
  imageB: `${A}/extra-mile-b.png`,
  title: 'Going the extra mile...',
  body: STORY,
  /** Figma 3647:12637 — the second state of the black collage section */
  next: {
    title: 'Community & Support',
    body: [
      'We are more than just a retailer; we are a community of audio enthusiasts. We regularly host events, workshops, and listening sessions to bring together individuals who share a passion for high-quality sound. Our commitment to our customers extends beyond the point of sale, with a dedicated after-sales support team ready to assist you with any questions or concerns you may have.',
      'Whatever your budget, we feel sure we can help you find the perfect system to suit your needs.',
    ],
    /** soft shots that surface with this state and come forward next (Figma image 464 / 458) */
    imageC: `${A}/community-c.webp`,
    imageD: `${A}/community-d.webp`,
  },
} as const;

export const NEWSLETTER = {
  eyebrow: ['The house of ', 'Hifonix Studio'],
  title: ['Join our global community for', 'exclusive benefits and news about'],
  perks: ['New & limited products', 'Exclusive events', 'Personalised content', 'Special offers', 'Behind the scenes'],
  consent:
    'I accept that Hifonix Studio can contact me via digital communication, including email with personalized marketing of our products and events in Bang & Olufsen shops. Unsubscribing is possible at any time. Details on how personal data is processed: ',
  privacyTo: PAGES.privacy.route,
  map: `${A}/map.png`,
  mapControls: `${A}/map-controls.png`,
} as const;
