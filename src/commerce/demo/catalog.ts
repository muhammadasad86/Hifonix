import { money } from '../money';
import type { Img, Product, ProductOption, ProductStory, Variant } from '../types';

/**
 * ⚠ TEMPORARY DEMO CATALOGUE — replaced by Shopify product data.
 * Titles, prices and swatches are copied from the Figma design frames
 * (Product-listing v5-2 / PDP v5-3) purely so the storefront can be reviewed.
 * They are NOT confirmed specifications, prices or stock levels, and the
 * option value names are neutral placeholders. IDs use a "gid://hifonix-demo/…"
 * prefix so they can never be mistaken for Shopify IDs.
 */
const P = '/shop/products';
const im = (url: string, alt: string): Img => ({ url, alt });
const gid = (type: 'Product' | 'ProductVariant', id: string) => `gid://hifonix-demo/${type}/${id}`;

interface Seed {
  handle: string;
  /** asset folder under /public/shop/products */
  folder: string;
  title: string;
  subtitle?: string;
  vendor: string;
  brandHandle: string;
  type: string;
  collections: string[];
  options?: ProductOption[];
  /** price per value of the first option (last one repeats) */
  prices: number[];
  priceFrom?: boolean;
  gallery?: number;
  description?: string;
  story?: (img: (n: string, alt: string) => Img) => ProductStory;
}

function build(s: Seed): Product {
  const img = (n: string, alt: string) => im(`${P}/${s.folder}/${n}.webp`, alt);
  const images = Array.from({ length: s.gallery ?? 1 }, (_, i) => img(String(i + 1), i ? `${s.title} — view ${i + 1}` : s.title));
  const opts = s.options ?? [];
  const combos = opts.reduce<{ name: string; value: string }[][]>(
    (acc, o) => acc.flatMap((c) => o.values.map((v) => [...c, { name: o.name, value: v.name }])),
    [[]],
  );
  const variants: Variant[] = combos.map((sel, i) => {
    const first = opts[0] ? opts[0].values.findIndex((v) => v.name === sel[0].value) : 0;
    return {
      id: gid('ProductVariant', `${s.handle}-${i + 1}`),
      title: sel.length ? sel.map((x) => x.value).join(' / ') : 'Default Title',
      availableForSale: true,
      selectedOptions: sel,
      price: money(s.prices[Math.min(first, s.prices.length - 1)]),
      image: images[0],
    };
  });
  const amounts = variants.map((v) => v.price.amount);
  return {
    id: gid('Product', s.handle),
    handle: s.handle,
    title: s.title,
    subtitle: s.subtitle,
    vendor: s.vendor,
    brandHandle: s.brandHandle,
    productType: s.type,
    collections: s.collections,
    departments: ['head-fi'],
    description: s.description ?? '',
    priceRange: { min: money(Math.min(...amounts)), max: money(Math.max(...amounts)) },
    priceFrom: s.priceFrom,
    featuredImage: images[0],
    hoverImage: img('hover', `${s.title} — in use`),
    images,
    options: opts,
    variants,
    badges: { demo: true },
    story: s.story?.(img),
  };
}

const colours = (...values: [string, string][]): ProductOption => ({
  name: 'Colour',
  values: values.map(([name, color]) => ({ name, swatch: { color } })),
});
const HP = ['closed-back-headphones'];
const DZ_COPY =
  'At 315 grams (without ear pads), Diana DZ is the lightest Diana yet, featuring a soft sling headband for added comfort and elegant options like New Zealand Abalone or Forged Carbon inlays. It delivers spacious, highly detailed sound with the highest resolution in the Diana line. The vegan version includes a cactus leather headband and Ultrasuede pads for a slightly softer top end, while lambskin pads enhance detail. Non-ported pads come standard for a linear sub-20 Hz response, with optional magnetic bass-ported pads available separately for sound tuning.';

export const DEMO_PRODUCTS: Product[] = [
  build({ handle: 'abyss-ab-1266', folder: 'ab-1266', title: 'Abyss AB-1266', vendor: 'Abyss', brandHandle: 'abyss', type: 'Headphones', collections: HP, prices: [8595], priceFrom: true }),
  build({
    handle: 'abyss-audio-diana',
    folder: 'diana',
    title: 'Abyss Audio DIANA®',
    vendor: 'Abyss',
    brandHandle: 'abyss',
    type: 'Headphones',
    collections: HP,
    options: [colours(['Grey', '#626264'], ['Orange', '#d47536'])],
    prices: [4700],
  }),
  build({
    handle: 'abyss-diana-phi-tc',
    folder: 'diana-phi-tc',
    title: 'Abyss Diana Phi Tc',
    vendor: 'Abyss',
    brandHandle: 'abyss',
    type: 'Headphones',
    collections: HP,
    options: [colours(['Grey', '#6a6971'], ['Brown', '#6c573a'])],
    prices: [3949, 4149],
  }),
  build({
    handle: 'abyss-diana-mr',
    folder: 'diana-mr',
    title: 'Abyss DIANA MR',
    vendor: 'Abyss',
    brandHandle: 'abyss',
    type: 'Headphones',
    collections: HP,
    options: [{ name: 'Finish', values: [1, 2, 3, 4].map((i) => ({ name: `Finish ${i}`, swatch: { image: `/shop/swatch/diana-mr-${i}.webp` } })) }],
    prices: [2895],
  }),
  build({
    handle: 'abyss-diana-dz',
    folder: 'diana-dz',
    title: 'Abyss DIANA DZ',
    subtitle: 'Luxury High Performance Headphones',
    vendor: 'Abyss',
    brandHandle: 'abyss',
    type: 'Headphones',
    collections: HP,
    gallery: 6,
    options: [
      {
        name: 'Finish',
        values: [
          // names taken from the Figma product copy ("New Zealand Abalone or Forged Carbon inlays")
          { name: 'Damascus Forged', swatch: { color: '#7541da', image: '/shop/swatch/diana-dz-1.webp' } },
          { name: 'Forged Carbon', swatch: { color: '#323232', image: '/shop/swatch/diana-dz-2.webp' } },
          { name: 'New Zealand Abalone', swatch: { color: '#d9ad3f', image: '/shop/swatch/diana-dz-3.webp' } },
        ],
      },
      { name: 'Cable Length', values: [{ name: '1.5mm' }] },
      { name: 'Headphone Connection', values: ['3.5 mm plug', '6.3 mm (1/4″) plug', '4 pin XLR', '4.4 mm balanced'].map((name) => ({ name })) },
    ],
    prices: [3795, 3795, 3945],
    description: DZ_COPY,
    story: (img) => ({
      lead: {
        title:
          'Backed by a 10-year warranty from Abyss Audio, ensuring long-term peace of mind and trusted quality. Product registration is required to activate the warranty coverage.',
        body: DZ_COPY,
      },
      specsImage: img('specs', 'Headphones on a gallery wall'),
      specs: [
        { label: 'Weight', value: '315 Grams; 370-385 Grams Depending On Ear Pad Configuration.' },
        { label: 'Impedance', value: '50 Ohms' },
        { label: 'Sensitivity', value: '92 DB/Mw' },
        { label: 'Frequency Response', value: '5 Hz-65 KHz' },
        { label: 'Impedance', value: '6Ω @1kHz' },
        {
          label: 'Includes',
          value:
            'A High Quality Headphone Cable By JPS Labs With Choice Of 3.5 Mm, 6.3 Mm (1/4″), 4 Pin XLR Or 4.4 Mm Balanced Plug (Upgrade Superconductor HP Cable May Be Purchased Separately Or As Part Of The Complete Package).',
        },
        {
          label: 'Patented Planar Speakers',
          value: 'Large 63 Mm Patented Planar Speakers Designed Specifically For Diana DZ Deliver The ABYSS Signature Sound With Spacious Soundstage And Powerful Bass.',
        },
      ],
      statement: [
        'Backed by a 10-year warranty from Abyss Audio, ensuring long-term ',
        'peace of mind and trusted quality. Product registration is required to activate the warranty coverage.',
      ],
      storyImages: {
        pair: [img('story-1', 'Listening to the Diana DZ'), img('story-2', 'Diana DZ with a desktop amplifier')],
        wide: img('story-3', 'Headphones displayed on a gallery wall'),
      },
      colourShowcase: { option: 'Finish', images: { 'Damascus Forged': img('colour-1', 'Diana DZ — Damascus Forged') } },
      features: {
        heading: ['Made in USA Boutique Craftsmanship with Ultra-Light ', 'Design and Precision Acoustic Engineering'],
        images: [img('colour-1', 'Diana DZ'), img('1', 'Diana DZ — three-quarter view'), img('feature-3', 'Diana DZ — detail')],
        items: [
          {
            title: 'Premium Materials',
            body: 'Made in the USA with an ultra-light aluminium frame and ceramic finish, offering exceptional strength and precision fit. Includes a premium leather headband, magnetic adjustment, and a protective hard case.',
          },
          {
            title: 'Comfort Design',
            body: 'The latest generation Diana headband twists and flexes naturally with the cushion ear pads, while head-shaped foam and a plush “pillow top” cushion ensure exceptional comfort during extended listening sessions.',
          },
          {
            title: 'Precision Sound',
            body: 'The open-back design creates a spacious soundstage, enhanced by the Fibonacci side hole pattern optimized specifically for DZ to deliver accurate tuning and refined acoustic performance.',
          },
        ],
      },
      faq: {
        intro: 'We have gathered the most frequently asked questions from our customers to help you in the best possible way.',
        // answers are not part of the design — to be supplied (null = labelled placeholder)
        items: [
          { q: 'How sound is the Diana DZ?', a: null },
          { q: 'What materials and design options are available?', a: null },
          { q: 'How does the sound perform?', a: null },
          { q: 'Can I customize the ear pads?', a: null },
        ],
      },
    }),
  }),
  build({
    handle: 'abyss-diana-v2',
    folder: 'diana-v2',
    title: 'Abyss Diana V2',
    vendor: 'Abyss',
    brandHandle: 'abyss',
    type: 'Headphones',
    collections: HP,
    options: [colours(['Black', '#000000'], ['Brown', '#6c573a'])],
    prices: [3495],
  }),
  build({
    handle: 'abyss-joal',
    folder: 'joal',
    title: 'ABYSS JOAL',
    vendor: 'Abyss',
    brandHandle: 'abyss',
    type: 'Headphones',
    collections: HP,
    options: [{ name: 'Option', values: [{ name: 'Option 1' }, { name: 'Option 2' }] }],
    prices: [1749, 1879],
  }),
  build({
    handle: 'aroma-audio-air-dac',
    folder: 'aroma-air',
    title: 'Aroma Audio AIR - DAC',
    vendor: 'Aroma Audio',
    brandHandle: 'aroma-audio',
    type: 'Headphone DAC',
    collections: [...HP, 'headphone-dacs'],
    options: [{ name: 'Colour', values: [{ name: 'Black', swatch: { color: '#101010' } }] }],
    prices: [449],
  }),
];
