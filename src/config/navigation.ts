/**
 * Single source of truth for product navigation.
 *
 * Categories mirror the live hifonix.co.uk menu (reviewed Oct 2026). `href`
 * is the live category page; `route` is the in-app landing page. Landing pages
 * not yet built render a placeholder that links out to the live category.
 */
const LIVE = 'https://hifonix.co.uk';

export interface Category {
  label: string;
  href: string; // live hifonix.co.uk page
}

export interface Collection {
  id: 'hi-fi' | 'headphones' | 'collections';
  route: string;
  title: string;
  /** Landing page implemented in-app? (false → placeholder route) */
  built: boolean;
  live: string;
  categories: Category[];
}

const cat = (label: string, path: string): Category => ({ label, href: `${LIVE}${path}` });

export const COLLECTIONS: Record<Collection['id'], Collection> = {
  'hi-fi': {
    id: 'hi-fi',
    route: '/pages/hi-fi',
    title: 'Hi-Fi',
    built: true,
    live: `${LIVE}/list/hi-fi/`,
    categories: [
      cat('Turntables', '/list/hi-fi/turntables/'),
      cat('Integrated Amplifiers', '/list/hi-fi/integrated-amplifiers/'),
      cat('Network Players', '/list/hi-fi/network-players/'),
      cat('DACs', '/list/hi-fi/dacs/'),
      cat('Phono Stage', '/list/hi-fi/phono-stage/'),
      cat('Pre-Amplifiers', '/list/hi-fi/pre-amplifiers/'),
      cat('Power Amplifiers', '/list/hi-fi/power-amplifiers/'),
      cat('Floorstanding Speakers', '/list/speakers/floor-standing-speakers/'),
      cat('Standmount Speakers', '/list/speakers/standmount-speakers/'),
    ],
  },
  headphones: {
    id: 'headphones',
    route: '/pages/headphones',
    title: 'Headphones',
    built: true,
    live: `${LIVE}/list/headphones/`,
    categories: [
      cat('Open Back Headphones', '/list/headphones/open-back-headphones/'),
      cat('Closed Back Headphones', '/list/headphones/closed-back-headphones/'),
      cat('Electrostatic Headphones', '/list/headphones/electrostatic-headphones/'),
      cat('Headphone Amplifiers', '/list/headphones/headphone-amplifiers/'),
      cat('Headphone DACs', '/list/headphones/headphone-dacs/'),
      cat('Digital Audio Players', '/list/headphones/digital-audio-players/'),
      cat('In-Ear Monitors', '/list/headphones/earphones-in-ear-monitors-iem/'),
    ],
  },
  collections: {
    id: 'collections',
    route: '/collections',
    title: 'Furniture & Accessories',
    built: false,
    live: `${LIVE}/list/furniture/`,
    categories: [
      cat('Hi-Fi Furniture', '/list/furniture/hi-fi-furniture/'),
      cat('Product Isolation', '/list/furniture/hi-fi-furniture/product-isolation/'),
      cat('Cables', '/list/cables/'),
      cat('Network Optimisation', '/list/cables/network-optimisation/'),
      cat('Headphone Accessories', '/list/headphones/headphone-accessories/'),
    ],
  },
};

export const SITE = {
  live: `${LIVE}/`,
  brands: `${LIVE}/brand-list/`,
  about: `${LIVE}/about/`,
  phone: '0121 382 5444',
} as const;

/** In-app routes. Keep every path here so links are never hardcoded twice. */
export const ROUTES = {
  home: '/',
  /** Splash / category chooser (Figma 1-4329) */
  splash: '/splash',
  studio: '/studio',
  hiFi: COLLECTIONS['hi-fi'].route,
  headphones: COLLECTIONS.headphones.route,
  collections: COLLECTIONS.collections.route,
} as const;

/** Legacy / short paths that redirect (history.replaceState) to their canonical route. */
export const ROUTE_ALIASES: Record<string, string> = {
  // the site starts on the splash (category chooser)
  '/': '/splash',
  '/hi-fi': ROUTES.hiFi,
  '/headphones': ROUTES.headphones,
};

/**
 * Page registry. Shop routes (/shop, /collections, /brands, /products, /cart)
 * are real pages (config/shop.ts); the rest are placeholders designed in later
 * phases (Figma: Category 1-5570,
 * Brand 1-5818, PLP 1-4820, PDP 1-4846). Each resolves to a clearly labelled
 * placeholder so no link on the built pages is ever a 404.
 */
export interface PlaceholderPage {
  route: string;
  title: string;
  /** live hifonix.co.uk equivalent, when one exists */
  live?: string;
}
const ph = (route: string, title: string, live?: string): PlaceholderPage => ({ route, title, live });

export const PAGES = {
  speakers: ph('/shop/speakers', 'Speakers', `${LIVE}/list/speakers/`),
  furniture: ph('/shop/furniture', 'Furniture', `${LIVE}/list/furniture/`),
  cable: ph('/shop/cable', 'Cable', `${LIVE}/list/cables/`),
  brands: ph('/brands', 'Brands', `${LIVE}/brand-list/`),
  aavik: ph('/brands/aavik', 'Aavik'),
  mysphere: ph('/brands/mysphere', 'Mysphere'),
  evoOne: ph('/brands/evo-one', 'EvoOne'),
  manley: ph('/brands/manley', 'Manley'),
  about: ph('/pages/about-us', 'About Us', `${LIVE}/about/`),
  storeLocation: ph('/pages/store-location', 'Store Location'),
  privacy: ph('/pages/privacy-policy', 'Privacy Policy'),
  terms: ph('/pages/terms-and-conditions', 'Terms & Conditions'),
  careers: ph('/pages/careers', 'Careers'),
  contact: ph('/pages/contact-us', 'Contact Us'),
  faq: ph('/pages/product-faq', 'Product FAQ'),
  registration: ph('/pages/product-registration', 'Product Registration'),
  warranty: ph('/pages/warranty', 'Warranty'),
  newpayFaq: ph('/pages/newpay-faqs', 'Newpay FAQs'),
  // Headphones landing — category pages (designed in a later phase)
  closedBack: ph('/collections/closed-back-headphones', 'Closed Back Headphones', `${LIVE}/list/headphones/closed-back-headphones/`),
  openBack: ph('/collections/open-back-headphones', 'Open Back Headphones', `${LIVE}/list/headphones/open-back-headphones/`),
  wireless: ph('/collections/wireless-headphones', 'Wireless Headphones', `${LIVE}/list/headphones/`),
  iem: ph('/collections/earphones-in-ear-monitors-iem', 'Earphones - In Ear Monitors (IEM)', `${LIVE}/list/headphones/earphones-in-ear-monitors-iem/`),
  electrostatic: ph('/collections/electrostatic-headphones', 'Electrostatic Headphones', `${LIVE}/list/headphones/electrostatic-headphones/`),
  customIem: ph('/collections/custom-in-ear-monitors', 'Custom In Ear Monitors', `${LIVE}/list/headphones/`),
} as const satisfies Record<string, PlaceholderPage>;

export interface NavLink {
  label: string;
  to: string;
}

/** Header primary nav (Figma Header.v4). */
export const HEADER_NAV: NavLink[] = [
  { label: 'Explore Artisan Audio', to: ROUTES.hiFi },
  { label: 'Explore Headphones', to: ROUTES.headphones },
];

/**
 * Menu overlay — Figma component "Menu" (1125:16013). Hovering / opening a
 * category shows its sub-menu (variants Hi-FI, Head-Fi, Speakers, Furniture,
 * Cable) or the brand wall (Variant7). Columns are split exactly as in Figma.
 * Sub-category pages are not built yet, so every entry opens its category
 * landing (or placeholder) route.
 */
export interface MenuBrand {
  label: string;
  logo: string;
  /** rendered width at the 50px Figma logo height */
  w: number;
}
export interface MenuCategory extends NavLink {
  id: 'hi-fi' | 'head-fi' | 'speakers' | 'furniture' | 'cable' | 'brands';
  /** first entry of the first column is the category overview */
  columns?: string[][];
  brands?: MenuBrand[];
}

const brand = (label: string, logo: string, w: number): MenuBrand => ({ label, logo, w });

export const MENU_CATEGORIES: MenuCategory[] = [
  {
    id: 'hi-fi',
    label: 'Hi-Fi',
    to: ROUTES.hiFi,
    columns: [
      ['Hi Fi', 'Headphone Tube Amplifier', 'Solid State Amplifier', 'Stereo Tube Amplifier', 'All-In-One Amplifier', 'Cartridge', 'CD Players', 'DAB Radio', 'DACs'],
      ['DC Power Supply', 'Integrated Amplifiers', 'Micro Hi-Fi Systems', 'Music Servers', 'Network Players', 'Phono Stage', 'Power Amplifiers', 'Pre - Amplifiers', 'Streaming Solutions', 'Turntables'],
    ],
  },
  {
    id: 'head-fi',
    label: 'Head-Fi',
    to: ROUTES.headphones,
    columns: [
      ['Head-Fi', 'Earspeaker System', 'Headphone System', 'Audio Recorders', 'Closed Back Headphones', 'Custom In Ear Monitors', 'Digital Audio Players', 'Earphones - In Ear Monitors (IEM)', 'Headphone Amplifiers'],
      ['Electrostatic Headphones', 'Headphone Accessories', 'Headphone Cables', 'Headphone DACs', 'IEM Cables', 'Jumper Cables', 'Open Back Headphones', 'USB DAC Amplifier', 'Wireless Headphones'],
    ],
  },
  {
    id: 'speakers',
    label: 'Speakers',
    to: PAGES.speakers.route,
    columns: [
      ['Speakers', 'BookShelf', 'Active Speakers', 'Centre Speaker', 'Floor standing Speakers'],
      ['Multi Room Speakers', 'Soundbars & Sound Bases', 'Standmount Speakers', 'Subwoofers', 'Wireless Speakers'],
    ],
  },
  {
    id: 'furniture',
    label: 'Furniture',
    to: PAGES.furniture.route,
    columns: [['Furniture', 'Hi-Fi Furniture', 'Product Isolation']],
  },
  {
    id: 'cable',
    label: 'Cable',
    to: PAGES.cable.route,
    columns: [
      ['Cables', 'DC Cables', 'Grounding Cables', 'HDMI', 'Analogue Interconnect', 'Cables', 'Audio Cables', 'Coaxial Audio Cables', 'Ethernet Cables', 'Mains Distribution Block'],
      ['Power Cables', 'Speaker Cables', 'Tonearm Cables', 'Digital interconnects', 'Network Optimisation', 'USB Cables'],
    ],
  },
  {
    id: 'brands',
    label: 'Brands',
    to: PAGES.brands.route,
    brands: [
      brand('4 Audio', '/hifi/menu/brand-4audio.png', 166),
      brand('Aavik', '/hifi/menu/brand-aavik.png', 173),
      brand('Abyss', '/hifi/menu/brand-abyss.png', 137),
      brand('Albedo', '/hifi/menu/brand-albedo.png', 203),
      brand('Aroma Audio', '/hifi/menu/brand-aroma.png', 351),
      brand('Astell&Kern', '/hifi/menu/brand-astellkern.png', 239),
      brand('Audeze', '/hifi/menu/brand-audeze.png', 311),
      brand('Audio-Technica', '/hifi/menu/brand-audiotechnica.png', 310),
      brand('Aavik', '/hifi/menu/brand-aavik.png', 173),
      brand('Abyss', '/hifi/menu/brand-abyss.png', 137),
      brand('Albedo', '/hifi/menu/brand-albedo.png', 203),
      brand('Aroma Audio', '/hifi/menu/brand-aroma.png', 351),
      brand('Audiolab', '/hifi/menu/brand-audiolab.png', 163),
      brand('Audma', '/hifi/menu/brand-audma.png', 96),
      brand('Auralic', '/hifi/menu/brand-auralic.png', 243),
    ],
  },
];
export const MENU_LINKS: NavLink[] = [
  { label: 'Terms of Use', to: PAGES.terms.route },
  { label: 'Privacy Policy', to: PAGES.privacy.route },
  { label: 'Store Location', to: PAGES.storeLocation.route },
  { label: 'Newpay FAQs', to: PAGES.newpayFaq.route },
];

/** Footer link columns (Figma footer 1-419). */
export const FOOTER_COLUMNS: { title: string; links: NavLink[] }[] = [
  {
    title: 'The Company',
    links: [
      { label: 'Home', to: ROUTES.splash },
      { label: 'About Us', to: PAGES.about.route },
      { label: 'Store Location', to: PAGES.storeLocation.route },
      { label: 'Privacy Policy', to: PAGES.privacy.route },
      { label: 'Terms & Conditions', to: PAGES.terms.route },
      { label: 'Careers', to: PAGES.careers.route },
    ],
  },
  {
    title: 'Product Support',
    links: [
      { label: 'Contact Us', to: PAGES.contact.route },
      { label: 'Product FAQ', to: PAGES.faq.route },
      { label: 'Product Registration', to: PAGES.registration.route },
      { label: 'Warranty', to: PAGES.warranty.route },
    ],
  },
];

/** Contact details as shown in the Figma bottom bar / footer. */
export const CONTACT = {
  email: 'hello@hifonixstudios.ae',
  phone: '050 240 2947',
  whatsappLabel: 'Reach out anytime',
  store: {
    address: ['396 Birmingham Road Sutton Coldfield', 'West Midlands B72 1YJ'],
    phone: '0121 382 5444',
    email: 'sales@hifonix.co.uk',
  },
  reviews: 'Check out our 2,066 reviews',
} as const;

/**
 * Social profiles shown in the bottom bar. URLs not supplied yet → rendered as
 * non-interactive icons until a real profile link is added here.
 */
export const SOCIAL: { id: 'youtube' | 'tiktok' | 'whatsappGlyph' | 'facebook' | 'instagram'; label: string; href: string | null }[] = [
  { id: 'youtube', label: 'YouTube', href: null },
  { id: 'tiktok', label: 'TikTok', href: null },
  { id: 'whatsappGlyph', label: 'WhatsApp', href: null },
  { id: 'facebook', label: 'Facebook', href: null },
  { id: 'instagram', label: 'Instagram', href: null },
];
