/**
 * Homepage showcase products — HOMEPAGE ATMOSPHERE ONLY.
 * Not final landing-page content: the client supplies final product imagery
 * and assets when landing pages are built. Models here are hand-built 3D
 * representations from published design descriptions; swap any entry for a
 * supplied GLB via `model` without touching room code.
 */
export interface ShowcaseProduct {
  brand: 'Aavik' | 'Abyss';
  model: string;
  finish?: string;
  /** published reference used for proportions / design (dealer or review) */
  reference: string;
  /** published physical data used for scale */
  spec: string;
  model3d: string | null;
}

export const SHOWCASE = {
  hifi: {
    'I-580': {
      brand: 'Aavik',
      model: 'I-580 Integrated Amplifier',
      reference: 'https://blinkhighend.com/shop/amplifiers-dacs/aavik/aavik-i180-i280-i580/',
      spec: '440 × 100 × 370 mm (dealer listing), 7.5 kg; red dot-matrix display; single main knob; 580: titanium top reinforcement, copper chassis, Darkz feet',
      model3d: null,
    },
    'D-580': {
      brand: 'Aavik',
      model: 'D-580 DAC',
      reference: 'https://www.hifireport.com/aavik-s-280-streamer-review/',
      spec: 'Shares the 180/280/580 chassis dimensions',
      model3d: null,
    },
    'S-580': {
      brand: 'Aavik',
      model: 'S-580 Streamer',
      reference: 'https://www.hifireport.com/aavik-s-280-streamer-review/',
      spec: 'Shares the 180/280/580 chassis dimensions',
      model3d: null,
    },
    'R-580': {
      brand: 'Aavik',
      model: 'R-580 Phono Stage',
      reference: 'https://blinkhighend.com/shop/amplifiers-dacs/aavik/aavik-i180-i280-i580/',
      spec: 'Shares the 180/280/580 chassis dimensions',
      model3d: null,
    },
  },
  headphones: {
    'AB-1266 Phi TC': {
      brand: 'Abyss',
      model: 'AB-1266 Phi TC',
      finish: 'Two-tone black ceramic',
      reference: 'https://upscaleaudio.com/products/abyss-ab-1266-phi-tc-headphones',
      spec: '640 g; CNC aluminium frame, steel baffle, foamed-aluminium sides; rigid U-band + wide flat strap; magnetic lambskin pads',
      model3d: null,
    },
    'Diana TC · Titanium Gray': {
      brand: 'Abyss',
      model: 'Diana TC',
      finish: 'Titanium Gray',
      reference: 'https://headfonics.com/abyss-headphones-diana-tc-review/',
      spec: '390 g; compact squarish cups with sharply curved corners; thin headband, carbon-fibre slider; Fibonacci side vents',
      model3d: null,
    },
    'Diana TC · Dark Bronze': {
      brand: 'Abyss',
      model: 'Diana TC',
      finish: 'Dark Bronze',
      reference: 'https://headfonics.com/abyss-headphones-diana-tc-review/',
      spec: 'As Diana TC, Dark Bronze finish',
      model3d: null,
    },
  },
} satisfies Record<string, Record<string, ShowcaseProduct>>;
