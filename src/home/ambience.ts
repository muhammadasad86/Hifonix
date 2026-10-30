import {
  CanvasTexture,
  Color,
  DoubleSide,
  LinearSRGBColorSpace,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  type Texture,
} from 'three';

/**
 * Studio ambience palette — distilled from the supplied interior references:
 * oxblood mahogany panelling with brass reveals, black fluted joinery, walnut
 * record shelving, dark herringbone / small-tile floors, burgundy & striped
 * rugs, navy velvet accent, chrome + leather, green marble, and an amber
 * glass-block wall reinterpreted with the eight-point star (regional motif).
 *
 * All textures are procedural canvas maps (no downloads); swap for authored
 * PBR sets later without touching room code.
 */
export const AMBIENCE = {
  oxblood: '#4a1d16',
  mahogany: '#5e2a1c',
  walnut: '#5a3a26',
  fluteBlack: '#141210',
  amber: '#ffb062',
  brass: '#b48a52',
  burgundy: '#5b1a1c',
  navy: '#1c2a52',
  cream: '#d9cbb2',
} as const;

type Paint = (ctx: CanvasRenderingContext2D, s: number, r: () => number) => void;

function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function tex(size: number, paint: Paint, seed: number, srgb = true, w = size): Texture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = size;
  paint(c.getContext('2d')!, size, rng(seed));
  const t = new CanvasTexture(c);
  t.colorSpace = srgb ? SRGBColorSpace : LinearSRGBColorSpace;
  t.wrapS = t.wrapT = RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

/** Fine straight-grain veneer (vertical). Tile = 1.2 m. */
const veneerPaint =
  (base: [number, number, number], streak: number): Paint =>
  (ctx, s, r) => {
    ctx.fillStyle = `rgb(${base.join(',')})`;
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 900; i++) {
      const x = r() * s;
      const d = (r() - 0.5) * streak;
      ctx.strokeStyle = `rgba(${base[0] + d},${base[1] + d * 0.6},${base[2] + d * 0.5},${0.12 + r() * 0.25})`;
      ctx.lineWidth = 0.6 + r() * 2.4;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(x + r() * 4 - 2, s * 0.33, x + r() * 4 - 2, s * 0.66, x + r() * 3 - 1.5, s);
      ctx.stroke();
    }
    // satin sheen bands
    const g = ctx.createLinearGradient(0, 0, s, 0);
    g.addColorStop(0, 'rgba(255,220,190,0.05)');
    g.addColorStop(0.5, 'rgba(0,0,0,0.06)');
    g.addColorStop(1, 'rgba(255,220,190,0.05)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  };

/** Herringbone oak (dark-stained). Tile = 1.2 m. */
const herringboneOf = (joint: string, base: [number, number, number], vary: [number, number, number]): Paint => (ctx, s, r) => {
  ctx.fillStyle = joint;
  ctx.fillRect(0, 0, s, s);
  const L = s / 4; // plank length
  const W = L / 4; // plank width
  ctx.save();
  ctx.translate(s / 2, s / 2);
  ctx.rotate(Math.PI / 4);
  for (let row = -12; row < 12; row++) {
    for (let col = -12; col < 12; col++) {
      const x = col * W + row * W;
      const y = row * W - col * W;
      for (const vert of [0, 1]) {
        const t = r();
        ctx.fillStyle = `rgb(${base[0] + t * vary[0]},${base[1] + t * vary[1]},${base[2] + t * vary[2]})`;
        if (vert) ctx.fillRect(x + 1, y + W + 1, W - 2, L - 2);
        else ctx.fillRect(x + 1, y + 1, L - 2, W - 2);
      }
    }
  }
  ctx.restore();
  for (let i = 0; i < 18000; i++) {
    ctx.fillStyle = `rgba(0,0,0,${r() * 0.12})`;
    ctx.fillRect(r() * s, r() * s, 1, 2 + r() * 4);
  }
};

/** Small square glazed tile, deep green-charcoal (zellige-like variation). Tile = 0.8 m (8 × 10 cm). */
const tilePaint: Paint = (ctx, s, r) => {
  ctx.fillStyle = '#2a2925';
  ctx.fillRect(0, 0, s, s);
  const n = 8;
  const t = s / n;
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const v = r();
      ctx.fillStyle = `rgb(${30 + v * 18},${36 + v * 18},${32 + v * 14})`;
      ctx.fillRect(x * t + 2, y * t + 2, t - 4, t - 4);
      const g = ctx.createRadialGradient(x * t + t * r(), y * t + t * r(), 1, x * t + t / 2, y * t + t / 2, t);
      g.addColorStop(0, 'rgba(255,255,255,0.06)');
      g.addColorStop(1, 'rgba(0,0,0,0.08)');
      ctx.fillStyle = g;
      ctx.fillRect(x * t + 2, y * t + 2, t - 4, t - 4);
    }
};

/** Burgundy & cream stripe rug (ref: striped wool rug). Tile = whole rug. */
const stripePaint: Paint = (ctx, s, r) => {
  const bands = ['#5b1a1c', '#d2c1a3', '#5b1a1c', '#d2c1a3', '#d2c1a3', '#5b1a1c', '#d2c1a3', '#5b1a1c'];
  const h = s / bands.length;
  bands.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(0, i * h, s, h);
  });
  for (let i = 0; i < 60000; i++) {
    ctx.fillStyle = `rgba(${r() > 0.5 ? '255,240,220' : '0,0,0'},${r() * 0.12})`;
    ctx.fillRect(r() * s, r() * s, 2, 2);
  }
};

/** Green marble with soft veining (ref: green marble cube table). Tile = 1 m. */
const marbleOf = (ground: string, vein: [number, number, number], strength = 1): Paint => (ctx, s, r) => {
  ctx.fillStyle = ground;
  ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 40; i++) {
    ctx.strokeStyle = `rgba(${vein[0] + r() * 50},${vein[1] + r() * 50},${vein[2] + r() * 40},${(0.08 + r() * 0.18) * strength})`;
    ctx.lineWidth = 0.6 + r() * 3;
    ctx.beginPath();
    let x = r() * s;
    let y = 0;
    ctx.moveTo(x, y);
    while (y < s) {
      x += (r() - 0.5) * 40;
      y += 10 + r() * 30;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
};

/**
 * Glass-block wall — 19 cm blocks, each pressed with an eight-point star.
 * Returns an emissive map (bright = more light through) for a warm backlit wall.
 */
const glassBlockPaint: Paint = (ctx, s, r) => {
  const n = 4;
  const b = s / n;
  ctx.fillStyle = '#100a05';
  ctx.fillRect(0, 0, s, s);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const cx = x * b + b / 2;
      const cy = y * b + b / 2;
      const k = 0.75 + r() * 0.25;
      const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, b * 0.62);
      g.addColorStop(0, `rgba(255,214,160,${k})`);
      g.addColorStop(0.6, `rgba(220,140,70,${k * 0.8})`);
      g.addColorStop(1, `rgba(90,45,18,${k * 0.6})`);
      ctx.fillStyle = g;
      ctx.fillRect(x * b + 4, y * b + 4, b - 8, b - 8);
      // pressed star
      ctx.strokeStyle = `rgba(255,236,200,${0.35 * k})`;
      ctx.lineWidth = 2.2;
      for (const rot of [0, Math.PI / 4]) {
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const a = rot + (i * Math.PI) / 2 + Math.PI / 4;
          const px = cx + Math.cos(a) * b * 0.3;
          const py = cy + Math.sin(a) * b * 0.3;
          if (i) ctx.lineTo(px, py);
          else ctx.moveTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }
};

/**
 * ARTWORK PLACEHOLDER: an original gestural composition — a few broad cream
 * strokes and one oxblood mark on charcoal — standing in for the client's art.
 */
const artPaint: Paint = (ctx, s, r) => {
  ctx.fillStyle = '#1a1816';
  ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = `rgba(255,255,255,${r() * 0.04})`;
    ctx.fillRect(r() * s, r() * s, 2, 2);
  }
  const stroke = (pts: [number, number][], w: number, col: string) => {
    ctx.strokeStyle = col;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let k = 0; k < 14; k++) {
      ctx.lineWidth = w * (0.4 + r() * 0.7);
      ctx.globalAlpha = 0.08 + r() * 0.12;
      ctx.beginPath();
      pts.forEach(([x, y], i) => {
        const jx = x * s + (r() - 0.5) * w * 0.6;
        const jy = y * s + (r() - 0.5) * w * 0.6;
        if (i) ctx.lineTo(jx, jy);
        else ctx.moveTo(jx, jy);
      });
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };
  stroke([[0.32, 0.18], [0.48, 0.36], [0.44, 0.58], [0.6, 0.82]], s * 0.07, '#e8dcc4');
  stroke([[0.62, 0.3], [0.5, 0.46], [0.34, 0.5]], s * 0.05, '#e8dcc4');
  stroke([[0.46, 0.62], [0.66, 0.64], [0.74, 0.78]], s * 0.04, '#d8c8aa');
  stroke([[0.55, 0.14], [0.6, 0.2]], s * 0.035, '#8a2a20');
};

/** Honed travertine floor: 60 × 120 cm slabs, warm ivory with fine pitting. Tile = 1.2 m. */
const travertinePaint: Paint = (ctx, s, r) => {
  ctx.fillStyle = '#b9ad9b';
  ctx.fillRect(0, 0, s, s);
  for (const [x, y, w, h] of [[0, 0, s, s / 2], [0, s / 2, s / 2, s / 2], [s / 2, s / 2, s / 2, s / 2]]) {
    const v = r() * 10;
    ctx.fillStyle = `rgb(${222 + v},${212 + v},${196 + v})`;
    ctx.fillRect(x + 1.5, y + 1.5, w - 3, h - 3);
  }
  for (let i = 0; i < 70; i++) {
    ctx.fillStyle = `rgba(160,140,112,${0.05 + r() * 0.08})`;
    ctx.fillRect(0, r() * s, s, 1 + r() * 3); // bedding
  }
  for (let i = 0; i < 1600; i++) {
    ctx.fillStyle = `rgba(120,100,76,${0.15 + r() * 0.25})`;
    ctx.fillRect(r() * s, r() * s, 1 + r() * 3, 1);
  }
};

/** Black/ivory houndstooth (ref: bolster cushions). One tile = 4 checks. */
const houndstoothPaint: Paint = (ctx, s) => {
  ctx.fillStyle = '#ece6da';
  ctx.fillRect(0, 0, s, s);
  ctx.fillStyle = '#1c1a18';
  const c = s / 4;
  for (let y = 0; y < 4; y++)
    for (let x = 0; x < 4; x++) {
      if ((x + y) % 2) continue;
      const ox = x * c;
      const oy = y * c;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + c, oy);
      ctx.lineTo(ox + c * 1.25, oy - c * 0.25);
      ctx.lineTo(ox + c * 1.25, oy + c * 0.5);
      ctx.lineTo(ox + c, oy + c);
      ctx.lineTo(ox + c * 0.5, oy + c);
      ctx.lineTo(ox, oy + c * 0.5);
      ctx.closePath();
      ctx.fill();
    }
};

/** Bouclé / wool weave: soft looped grain for upholstery and rugs (neutral, tinted by material colour). */
const weavePaint: Paint = (ctx, s, r) => {
  ctx.fillStyle = '#d8d8d8';
  ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 5200; i++) {
    const v = 150 + r() * 105;
    ctx.fillStyle = `rgba(${v},${v},${v},0.55)`;
    ctx.beginPath();
    ctx.arc(r() * s, r() * s, 0.8 + r() * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
};

/** Perforated acoustic panel (ref 5): regular round holes. White = solid (alpha map). */
const perforationPaint: Paint = (ctx, s) => {
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, s, s);
  ctx.fillStyle = '#000';
  const n = 8;
  const p = s / n;
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      ctx.beginPath();
      ctx.arc(x * p + p / 2, y * p + p / 2, p * 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
};

let lib: ReturnType<typeof make> | null = null;

function make() {
  const veneer = tex(512, veneerPaint([112, 46, 32], 30), 101);
  const walnutV = tex(512, veneerPaint([118, 76, 46], 34), 103);
  const herring = tex(1024, herringboneOf('#1e140d', [68, 44, 28], [26, 16, 10]), 105);
  const herringLight = tex(1024, herringboneOf('#7a5a3c', [178, 134, 92], [30, 22, 16]), 121);
  const tiles = tex(512, tilePaint, 107);
  const stripe = tex(512, stripePaint, 109);
  const marble = tex(512, marbleOf('#1f2c22', [150, 170, 140]), 111);
  const marbleWhite = tex(512, marbleOf('#ece8e1', [120, 118, 114], 1.4), 123);
  const oakV = tex(512, veneerPaint([186, 140, 94], 30), 125);
  const oakDarkV = tex(512, veneerPaint([92, 62, 40], 26), 127);
  const travertine = tex(512, travertinePaint, 129);
  const houndstooth = tex(128, houndstoothPaint, 131);
  const weave = tex(256, weavePaint, 133);
  const perf = tex(256, perforationPaint, 135, false);
  const glass = tex(512, glassBlockPaint, 113);
  const art = tex(512, artPaint, 117);
  return {
    /** oxblood mahogany panelling (refs 1–3) */
    mahogany: new MeshStandardMaterial({ map: veneer, roughness: 0.38, metalness: 0.02, envMapIntensity: 0.9 }),
    /** walnut shelving / joinery (refs 6–7) */
    walnutVeneer: new MeshStandardMaterial({ map: walnutV, roughness: 0.42, envMapIntensity: 0.8 }),
    /** black lacquered fluting (ref 5) */
    fluted: new MeshStandardMaterial({ color: AMBIENCE.fluteBlack, roughness: 0.3, metalness: 0.1 }),
    brassReveal: new MeshStandardMaterial({ color: AMBIENCE.brass, roughness: 0.3, metalness: 1 }),
    herringbone: new MeshStandardMaterial({ map: herring, roughness: 0.5 }),
    darkTile: new MeshStandardMaterial({ map: tiles, roughness: 0.28, envMapIntensity: 1.1 }),
    stripeRug: new MeshStandardMaterial({ map: stripe, roughness: 1 }),
    burgundyRug: new MeshStandardMaterial({ color: AMBIENCE.burgundy, roughness: 1 }),
    navyRug: new MeshStandardMaterial({ color: '#16213f', roughness: 1 }),
    greenMarble: new MeshStandardMaterial({ map: marble, roughness: 0.18, envMapIntensity: 1.2 }),
    velvetNavy: new MeshPhysicalMaterial({
      color: AMBIENCE.navy,
      roughness: 0.85,
      sheen: 1,
      sheenRoughness: 0.45,
      sheenColor: new Color('#6a7fb8'),
    }),
    chrome: new MeshStandardMaterial({ color: '#d9dadc', roughness: 0.12, metalness: 1, envMapIntensity: 1.6 }),
    blackLeather: new MeshStandardMaterial({ color: '#121111', roughness: 0.45 }),
    glassTop: new MeshPhysicalMaterial({
      color: '#c9c3b8',
      roughness: 0.05,
      transparent: true,
      opacity: 0.22,
      envMapIntensity: 1.5,
      side: DoubleSide,
      depthWrite: false,
    }),
    /** amber glass-block wall: emissive map does the glowing */
    glassBlock: new MeshStandardMaterial({
      color: '#3a2412',
      emissive: new Color('#ffc07a'),
      emissiveMap: glass,
      emissiveIntensity: 0.5,
      roughness: 0.42,
      metalness: 0.1,
    }),
    /** opal glass: globe lamps, ceiling lay-lights */
    opal: new MeshStandardMaterial({ color: '#fff3e0', emissive: new Color('#ffd7a3'), emissiveIntensity: 1.6 }),
    layLight: new MeshStandardMaterial({ color: '#fff3e0', emissive: new Color('#ffdcb0'), emissiveIntensity: 0.85 }),
    cove: new MeshStandardMaterial({ color: '#ffe2bd', emissive: new Color('#ffb877'), emissiveIntensity: 1.25 }),
    /** backlit niche panel (refs 6: amber-gold niche backs) */
    nicheAmber: new MeshStandardMaterial({ color: '#1e1108', emissive: new Color('#b0602a'), emissiveIntensity: 0.2, roughness: 0.6 }),
    rattan: new MeshStandardMaterial({ color: '#cbb894', roughness: 0.9, side: DoubleSide }),
    artCanvas: new MeshStandardMaterial({ map: art, roughness: 0.9 }),
    artFrame: new MeshStandardMaterial({ color: '#0d0c0b', roughness: 0.4 }),

    /* ── Listening-lounge palette (refs: oak listening bar, Spiritland wall,
          horn-speaker lounge, record grid, editorial shelving) ── */
    oak: new MeshStandardMaterial({ map: oakV, roughness: 0.46, envMapIntensity: 0.7 }),
    oakDark: new MeshStandardMaterial({ map: oakDarkV, roughness: 0.5, envMapIntensity: 0.6 }),
    herringboneOak: new MeshStandardMaterial({ map: herringLight, roughness: 0.42, envMapIntensity: 0.8 }),
    travertine: new MeshStandardMaterial({ map: travertine, roughness: 0.62, envMapIntensity: 0.6 }),
    whiteMarble: new MeshStandardMaterial({ map: marbleWhite, roughness: 0.16, envMapIntensity: 1.1 }),
    /** glazed ivory ceramic — sculptural horn speakers */
    ceramic: new MeshPhysicalMaterial({ color: '#f1ece3', roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.25, side: DoubleSide }),
    ceramicThroat: new MeshPhysicalMaterial({ color: '#d8d0c3', roughness: 0.5, side: DoubleSide }),
    caramel: new MeshPhysicalMaterial({ color: '#7d4d30', roughness: 0.9, sheen: 0.8, sheenRoughness: 0.55, sheenColor: new Color('#c99068'), side: DoubleSide }),
    cognac: new MeshStandardMaterial({ color: '#7a3e22', roughness: 0.5, envMapIntensity: 0.9 }),
    houndstooth: new MeshStandardMaterial({ map: houndstooth, roughness: 0.9 }),
    boucleGrey: new MeshStandardMaterial({ map: weave, color: '#a9a49c', roughness: 1 }),
    boucleCharcoal: new MeshStandardMaterial({ map: weave, color: '#5a5754', roughness: 1 }),
    oatmealRug: new MeshStandardMaterial({ map: weave, color: '#cdbfa8', roughness: 1 }),
    blackMetal: new MeshStandardMaterial({ color: '#161514', roughness: 0.55, metalness: 0.6 }),
    /** perforated oak acoustic panel (alpha-cut holes) */
    perfOak: new MeshStandardMaterial({ map: oakV, alphaMap: perf, alphaTest: 0.5, roughness: 0.5, side: DoubleSide }),
    /** soft ivory light behind perforations / shelving (a lit wall, not a glow effect) */
    litIvory: new MeshStandardMaterial({ color: '#f3e7d3', emissive: new Color('#ffe3bd'), emissiveIntensity: 0.55, roughness: 1 }),
  };
}

export function ambience() {
  if (!lib) lib = make();
  return lib;
}

/** Pre-sized repeat helper: clone a mapped material with a world-scale repeat. */
export function repeated<T extends MeshStandardMaterial>(mat: T, rx: number, ry: number): T {
  const c = mat.clone() as T;
  for (const key of ['map', 'emissiveMap'] as const) {
    const t = c[key];
    if (t) {
      const n = t.clone();
      n.repeat.set(rx, ry);
      n.needsUpdate = true;
      c[key] = n;
    }
  }
  return c;
}
