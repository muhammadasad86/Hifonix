import {
  CanvasTexture,
  LinearSRGBColorSpace,
  RepeatWrapping,
  SRGBColorSpace,
  type Texture,
} from 'three';

/**
 * Procedural placeholder surfaces (canvas-generated, zero network cost).
 * Each returns { map, bump } where bump doubles as roughness detail.
 * Replace with authored PBR sets via config/assets.ts when available.
 */

type Draw = (ctx: CanvasRenderingContext2D, size: number, rnd: () => number) => void;

export interface SurfaceMaps {
  map: Texture;
  bump: Texture;
}

const cache = new Map<string, SurfaceMaps>();

function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function makeCanvas(size: number) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return c;
}

function grain(ctx: CanvasRenderingContext2D, size: number, rnd: () => number, amount: number, alpha: number) {
  for (let i = 0; i < amount; i++) {
    const v = Math.floor(rnd() * 255);
    ctx.fillStyle = `rgba(${v},${v},${v},${alpha * rnd()})`;
    ctx.fillRect(rnd() * size, rnd() * size, 1 + rnd() * 2, 1 + rnd() * 2);
  }
}

function build(key: string, size: number, drawColor: Draw, drawBump: Draw, seed = 7): SurfaceMaps {
  const hit = cache.get(key);
  if (hit) return hit;
  const color = makeCanvas(size);
  const bump = makeCanvas(size);
  drawColor(color.getContext('2d')!, size, rng(seed));
  drawBump(bump.getContext('2d')!, size, rng(seed));
  const map = new CanvasTexture(color);
  map.colorSpace = SRGBColorSpace;
  const bumpTex = new CanvasTexture(bump);
  bumpTex.colorSpace = LinearSRGBColorSpace;
  for (const t of [map, bumpTex]) {
    t.wrapS = t.wrapT = RepeatWrapping;
    t.anisotropy = 8;
  }
  const out = { map, bump: bumpTex };
  cache.set(key, out);
  return out;
}

/** Stretcher-bond brick. Tile = 4 bricks wide × 12 courses (0.9m × 0.9m). */
export function brickSurface(): SurfaceMaps {
  const cols = 4;
  const rows = 12;
  const mortar = 0.045; // fraction of course
  const layout = (
    ctx: CanvasRenderingContext2D,
    size: number,
    rnd: () => number,
    brickFill: (x: number, y: number, w: number, h: number) => void,
    mortarFill: string,
  ) => {
    const bw = size / cols;
    const bh = size / rows;
    ctx.fillStyle = mortarFill;
    ctx.fillRect(0, 0, size, size);
    const m = bh * mortar * 2.2;
    for (let r = 0; r < rows; r++) {
      const off = r % 2 ? bw / 2 : 0;
      for (let c = -1; c <= cols; c++) {
        const x = c * bw + off + m / 2;
        brickFill(x, r * bh + m / 2, bw - m, bh - m);
      }
    }
    void rnd;
  };
  return build(
    'brick',
    1024,
    (ctx, size, rnd) => {
      layout(
        ctx,
        size,
        rnd,
        (x, y, w, h) => {
          const base = [118 + rnd() * 34, 52 + rnd() * 18, 38 + rnd() * 12];
          const k = 0.82 + rnd() * 0.3;
          ctx.fillStyle = `rgb(${base[0] * k},${base[1] * k},${base[2] * k})`;
          ctx.fillRect(x, y, w, h);
          // fired-face mottling
          for (let i = 0; i < 26; i++) {
            const d = rnd() * 40 - 20;
            ctx.fillStyle = `rgba(${40 + d},${18 + d / 2},${12},${0.08 + rnd() * 0.1})`;
            ctx.fillRect(x + rnd() * w, y + rnd() * h, 2 + rnd() * w * 0.3, 1 + rnd() * h * 0.4);
          }
        },
        '#8d867a',
      );
      grain(ctx, size, rnd, 22000, 0.12);
    },
    (ctx, size, rnd) => {
      layout(
        ctx,
        size,
        rnd,
        (x, y, w, h) => {
          const v = 190 + rnd() * 40;
          ctx.fillStyle = `rgb(${v},${v},${v})`;
          ctx.fillRect(x, y, w, h);
        },
        '#3a3a3a',
      );
      grain(ctx, size, rnd, 30000, 0.25);
    },
    11,
  );
}

/** 600mm concrete paving flags. Tile = 2 × 2 flags (1.2m). */
export function pavingSurface(): SurfaceMaps {
  const flags = (ctx: CanvasRenderingContext2D, size: number, rnd: () => number, fill: (i: number) => string, joint: string) => {
    ctx.fillStyle = joint;
    ctx.fillRect(0, 0, size, size);
    const s = size / 2;
    const j = 3;
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = fill(i);
      ctx.fillRect((i % 2) * s + j, Math.floor(i / 2) * s + j, s - j * 2, s - j * 2);
    }
    void rnd;
  };
  return build(
    'paving',
    512,
    (ctx, size, rnd) => {
      flags(ctx, size, rnd, () => {
        const v = 150 + rnd() * 14;
        return `rgb(${v},${v - 8},${v - 20})`;
      }, '#6d655a');
      grain(ctx, size, rnd, 30000, 0.18);
    },
    (ctx, size, rnd) => {
      flags(ctx, size, rnd, () => '#c8c8c8', '#202020');
      grain(ctx, size, rnd, 40000, 0.35);
    },
    23,
  );
}

export function asphaltSurface(): SurfaceMaps {
  return build(
    'asphalt',
    512,
    (ctx, size, rnd) => {
      ctx.fillStyle = '#1d1e20';
      ctx.fillRect(0, 0, size, size);
      grain(ctx, size, rnd, 60000, 0.22);
    },
    (ctx, size, rnd) => {
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, size, size);
      grain(ctx, size, rnd, 80000, 0.5);
    },
    31,
  );
}

/** Lobby threshold mosaic: small white tesserae with a black key border. Tile = 0.6m. */
export function mosaicSurface(): SurfaceMaps {
  const n = 24;
  const pattern = (ctx: CanvasRenderingContext2D, size: number, rnd: () => number, tone: (black: boolean) => string, grout: string) => {
    ctx.fillStyle = grout;
    ctx.fillRect(0, 0, size, size);
    const s = size / n;
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const edge = Math.min(x, y, n - 1 - x, n - 1 - y);
        const black = edge === 1 || (edge === 3 && (x + y) % 2 === 0);
        ctx.fillStyle = tone(black);
        ctx.fillRect(x * s + 1.2, y * s + 1.2, s - 2.4, s - 2.4);
      }
    void rnd;
  };
  return build(
    'mosaic',
    512,
    (ctx, size, rnd) => {
      pattern(ctx, size, rnd, (b) => {
        const v = b ? 22 + rnd() * 10 : 214 + rnd() * 22;
        return `rgb(${v},${v - 2},${v - 6})`;
      }, '#77736b');
    },
    (ctx, size, rnd) => pattern(ctx, size, rnd, () => '#d0d0d0', '#303030'),
    41,
  );
}

/** Oak plank floor (placeholder interior). Tile = 1.8m. */
export function oakSurface(): SurfaceMaps {
  const planks = 10;
  const draw = (ctx: CanvasRenderingContext2D, size: number, rnd: () => number, bumpMode: boolean) => {
    const w = size / planks;
    for (let i = 0; i < planks; i++) {
      const len = size * (0.45 + rnd() * 0.5);
      let y = -rnd() * len;
      while (y < size) {
        if (bumpMode) {
          ctx.fillStyle = '#bdbdbd';
        } else {
          const t = rnd();
          ctx.fillStyle = `rgb(${150 + t * 30},${104 + t * 22},${66 + t * 16})`;
        }
        ctx.fillRect(i * w + 1, y + 1, w - 2, len - 2);
        // grain lines
        for (let g = 0; g < 18; g++) {
          const gx = i * w + 3 + rnd() * (w - 6);
          ctx.strokeStyle = bumpMode ? 'rgba(90,90,90,0.25)' : `rgba(70,40,20,${0.08 + rnd() * 0.12})`;
          ctx.lineWidth = 0.6 + rnd();
          ctx.beginPath();
          ctx.moveTo(gx, y);
          ctx.bezierCurveTo(gx + rnd() * 3 - 1.5, y + len * 0.3, gx + rnd() * 3 - 1.5, y + len * 0.7, gx, y + len);
          ctx.stroke();
        }
        y += len;
      }
    }
  };
  return build(
    'oak',
    1024,
    (ctx, size, rnd) => {
      ctx.fillStyle = '#3b2a1c';
      ctx.fillRect(0, 0, size, size);
      draw(ctx, size, rnd, false);
    },
    (ctx, size, rnd) => {
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(0, 0, size, size);
      draw(ctx, size, rnd, true);
    },
    53,
  );
}

/**
 * Honed limestone: warm sand base, faint sedimentary bedding, fossil flecks.
 * Tile = 1.2m; large-format block joints drawn every 0.6m vertically.
 */
export function limestoneSurface(): SurfaceMaps {
  const bedding = (ctx: CanvasRenderingContext2D, size: number, rnd: () => number, base: [number, number, number], amp: number) => {
    ctx.fillStyle = `rgb(${base.join(',')})`;
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 90; i++) {
      const y = rnd() * size;
      const d = (rnd() - 0.5) * amp;
      ctx.fillStyle = `rgba(${base[0] + d},${base[1] + d},${base[2] + d * 0.8},${0.12 + rnd() * 0.18})`;
      ctx.fillRect(0, y, size, 1 + rnd() * 6);
    }
    for (let i = 0; i < 900; i++) {
      const d = (rnd() - 0.6) * amp * 1.6;
      ctx.fillStyle = `rgba(${base[0] + d},${base[1] + d},${base[2] + d},${0.25 + rnd() * 0.3})`;
      ctx.beginPath();
      ctx.arc(rnd() * size, rnd() * size, 0.6 + rnd() * 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  const joints = (ctx: CanvasRenderingContext2D, size: number, col: string) => {
    ctx.fillStyle = col;
    ctx.fillRect(0, 0, size, 2);
    ctx.fillRect(0, size / 2, size, 2);
    ctx.fillRect(0, 0, 2, size);
  };
  return build(
    'limestone',
    1024,
    (ctx, size, rnd) => {
      bedding(ctx, size, rnd, [214, 199, 174], 26);
      grain(ctx, size, rnd, 50000, 0.08);
      joints(ctx, size, 'rgba(120,104,84,0.55)');
    },
    (ctx, size, rnd) => {
      bedding(ctx, size, rnd, [150, 150, 150], 60);
      grain(ctx, size, rnd, 70000, 0.25);
      joints(ctx, size, '#3a3a3a');
    },
    61,
  );
}

/** Hand-trowelled lime plaster (tadelakt-like): soft clouding, fine grain. Tile = 2m. */
export function plasterSurface(): SurfaceMaps {
  const cloud = (ctx: CanvasRenderingContext2D, size: number, rnd: () => number, base: [number, number, number], amp: number) => {
    ctx.fillStyle = `rgb(${base.join(',')})`;
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 260; i++) {
      const r = 20 + rnd() * 120;
      const x = rnd() * size;
      const y = rnd() * size;
      const d = (rnd() - 0.5) * amp;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${base[0] + d},${base[1] + d},${base[2] + d},0.35)`);
      g.addColorStop(1, `rgba(${base[0] + d},${base[1] + d},${base[2] + d},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // trowel strokes
    for (let i = 0; i < 140; i++) {
      ctx.strokeStyle = `rgba(255,255,255,${0.03 + rnd() * 0.04})`;
      ctx.lineWidth = 6 + rnd() * 18;
      ctx.beginPath();
      const x = rnd() * size;
      const y = rnd() * size;
      ctx.arc(x, y, 30 + rnd() * 80, rnd() * 6, rnd() * 6 + 0.9);
      ctx.stroke();
    }
  };
  return build(
    'plaster',
    1024,
    (ctx, size, rnd) => {
      cloud(ctx, size, rnd, [222, 210, 192], 18);
      grain(ctx, size, rnd, 40000, 0.06);
    },
    (ctx, size, rnd) => {
      cloud(ctx, size, rnd, [128, 128, 128], 50);
      grain(ctx, size, rnd, 90000, 0.3);
    },
    71,
  );
}

/**
 * Geometric lattice (contemporary mashrabiya): 8-point star rosettes on a
 * square grid, joined by a continuous strapwork band. Returns an alpha mask:
 * white = solid bronze, black = open. One tile = one rosette (scale via repeat).
 */
export function latticeAlpha(): CanvasTexture {
  const key = 'lattice';
  const hit = cache.get(key);
  if (hit) return hit.map as CanvasTexture;
  const size = 512;
  const c = makeCanvas(size);
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = '#fff';
  ctx.lineJoin = 'miter';
  ctx.lineWidth = size * 0.035;
  const star = (cx: number, cy: number, r: number) => {
    for (const rot of [0, Math.PI / 4]) {
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = rot + (i * Math.PI) / 2 + Math.PI / 4;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }
  };
  const h = size / 2;
  star(h, h, size * 0.3);
  // inner octagon
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 + Math.PI / 8;
    const r = size * 0.13;
    const fn = i === 0 ? 'moveTo' : 'lineTo';
    ctx[fn](h + Math.cos(a) * r, h + Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.stroke();
  // corner quarter-stars + connecting straps so tiles interlock seamlessly
  for (const [x, y] of [[0, 0], [size, 0], [0, size], [size, size]]) star(x, y, size * 0.3);
  ctx.lineWidth = size * 0.03;
  ctx.strokeRect(0, 0, size, size);
  const tex = new CanvasTexture(c);
  tex.colorSpace = LinearSRGBColorSpace;
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.anisotropy = 8;
  cache.set(key, { map: tex, bump: tex });
  return tex;
}

/** Clone a surface's textures with a specific repeat (shared image, independent UVs). */
export function withRepeat(s: SurfaceMaps, rx: number, ry: number): SurfaceMaps {
  const map = s.map.clone();
  const bump = s.bump.clone();
  map.repeat.set(rx, ry);
  bump.repeat.set(rx, ry);
  map.needsUpdate = bump.needsUpdate = true;
  return { map, bump };
}
