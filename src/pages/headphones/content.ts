import { PAGES } from '../../config/navigation';
import type { SplitSlide } from '../landing/SplitSlides';

/**
 * Headphones landing page content (Figma prototype "Headphone-Web.v5-1",
 * nodes 1934:20663 → 1934:24336). Copy is reproduced verbatim from Figma.
 * Category pages are designed in a later phase: "Discover more" opens their
 * placeholder routes (config/navigation PAGES).
 */

export const HP_HERO = {
  /** same photograph as the splash "Headphones" card, so the hand-off is one picture */
  image: '/splash/headphones.webp',
  title: 'Hifonix - For the love of music',
  body: ['Where bold design meets unmatched sound —', 'a soundbar that demands attention.'],
  cta: 'Learn More',
} as const;

export const HP_CATEGORY_EYEBROW = 'Headphones category';

export const HP_CATEGORIES: SplitSlide[] = [
  {
    id: 'closed-back',
    title: ['Closed Back', 'Headphones'],
    body: 'Experience ultimate isolation and deep, impactful bass with our premium range of closed-back designs.',
    to: PAGES.closedBack.route,
    image: '/headphones/category-1.webp',
  },
  {
    id: 'open-back',
    title: ['Open Back', 'Headphones'],
    body: 'The breathable design allows for maximum transparency and detail, making them the gold standard for critical home listening.',
    to: PAGES.openBack.route,
    image: '/headphones/category-2.webp',
  },
  {
    id: 'wireless',
    title: ['Wireless', 'Headphones'],
    body: 'Enjoy the perfect blend of high-fidelity audio and modern convenience with our selection of premium Bluetooth headphones.',
    to: PAGES.wireless.route,
    image: '/headphones/category-3.webp',
  },
  {
    id: 'iem',
    title: ['Earphones - In Ear', 'Monitors (IEM)'],
    body: "Our IEMs feature advanced driver technologies that reveal every nuance of your music, whether you're commuting or relaxing.",
    to: PAGES.iem.route,
    image: '/headphones/category-4.webp',
  },
  {
    id: 'electrostatic',
    title: ['Electrostatic', 'Headphones'],
    body: 'Step into the pinnacle of audio performance with electrostatic drivers that offer unmatched speed, transparency, and accuracy.',
    to: PAGES.electrostatic.route,
    image: '/headphones/category-5.webp',
  },
  {
    id: 'custom-iem',
    title: ['Custom In', 'Ear Monitors'],
    body: 'Favored by musicians & enthusiasts alike, these bespoke earphones provide a secure, tailored fit and a truly personalized sonic signature.',
    to: PAGES.customIem.route,
    image: '/headphones/category-6.webp',
  },
];

/**
 * Hero → categories (Figma 1934:20663 → 20700 → 24498): the photograph zooms
 * ×10.51 and turns 15° into the ear-cup grille, then the category slider opens
 * through one grille hole as a growing circle.
 *   zoomPoint: the photo point (fraction of the image box) that ends under the hole
 *   hole:      the hole on screen (fraction of the 1920 × 1035 frame)
 *   holeEnd:   centre of the fully-open circle
 */
export const HP_ZOOM = {
  scale: 10.51,
  turn: -15, // CSS degrees (Figma +15° = counter-clockwise)
  zoomPoint: [0.7023, 0.5722],
  hole: [1401.5 / 1920, 417.5 / 1035],
  holeEnd: [1361.5 / 1920, 394.5 / 1035],
} as const;
