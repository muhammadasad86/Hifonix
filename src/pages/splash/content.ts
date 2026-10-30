import { ROUTES } from '../../config/navigation';

/**
 * Splash category cards (Figma "Splash-Web2", node 1-4329).
 * `to` resolves through config/navigation so each card can later point at a
 * Shopify collection / landing route without touching the component.
 */
export interface SplashCardData {
  id: 'artisan' | 'headphones';
  title: string;
  lines: string[];
  to: string;
  /** side the card enters from */
  from: 'left' | 'right';
  image: { src: string; alt: string; placeholder: string };
  /** shared-image transition into the destination page (key read by its hero) */
  handoff?: { key: string; shade: string };
}

export const SPLASH_CARDS: SplashCardData[] = [
  {
    id: 'artisan',
    title: 'Artisan Audio',
    lines: ['Premium Hi-Fi crafted for clarity, power, and realism.', 'Experience music beyond ordinary listening.'],
    to: ROUTES.hiFi,
    from: 'left',
    // Figma "image 450/451" — 3840 × 2160 source, already in the project
    image: { src: '/hifi/hero-speaker.png', alt: '', placeholder: 'Figma “image 451” — Hi-Fi photograph' },
    // the speaker photo expands into the Hi-Fi hero (same file, same crop family)
    handoff: { key: 'hifi-hero', shade: 'linear-gradient(to bottom, rgb(0 0 0 / 0) 0%, rgb(0 0 0 / 0.6) 40.093%)' },
  },
  {
    id: 'headphones',
    title: 'Headphones',
    lines: [
      'Precision-tuned headphones that reveal every detail.',
      'Crafted for long sessions and uncompromising sound quality.',
    ],
    to: ROUTES.headphones,
    from: 'right',
    // Figma "image 456" (701 × 1024 source)
    image: { src: '/splash/headphones.webp', alt: '', placeholder: 'Figma “image 456” — Headphones photograph' },
    // the same photograph expands into the Headphones hero (Figma 1934:20560 → 20663)
    handoff: { key: 'hp-hero', shade: 'linear-gradient(to bottom, rgb(0 0 0 / 0) 36.352%, rgb(0 0 0 / 0.6) 71.601%)' },
  },
];
