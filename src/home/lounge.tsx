import { RoundedBox, Text } from '@react-three/drei';
import { type ReactNode, useMemo } from 'react';
import { LatheGeometry, type Material, PlaneGeometry, Vector2 } from 'three';
import { Block } from '../scene/Block';
import { FONTS } from '../scene/fonts';
import { worldPlane } from '../scene/geometry';
import { type Box, InstancedBlocks } from '../scene/InstancedBlocks';
import { ambience } from './ambience';
import { props } from './props';

/**
 * Listening-lounge pieces, drawn from the client references:
 * oak listening bar (coffers, cove light), horn-speaker lounge (caramel drape,
 * cognac sofa, houndstooth, globe sconce), Spiritland headphone wall (walnut,
 * brass pegs, number discs), backlit record grid, perforated-oak lounge
 * (curved bouclé chairs, oak cubes), editorial black-grid shelving.
 * Circles appear only as objects — horns, globes, tables — never architecture.
 *
 * Wall-mounted pieces take `x` (wall plane) and `face` (+1 lines the left wall,
 * facing +x; −1 lines the right wall, facing −x). Furniture: local front +z.
 */
type V3 = [number, number, number];

/* ─────────────────────────── sculptural horn speaker ─────────────────────────── */

let hornGeo: LatheGeometry | null = null;
/** Exponential flare, throat → mouth, revolved about Y (axis later turned to +z). */
function hornGeometry() {
  if (hornGeo) return hornGeo;
  const pts: Vector2[] = [];
  const L = 0.44;
  const r0 = 0.045;
  const r1 = 0.36;
  const k = Math.log(r1 / r0) / L;
  for (let i = 0; i <= 40; i++) {
    const y = (i / 40) * L;
    pts.push(new Vector2(r0 * Math.exp(k * y), y));
  }
  hornGeo = new LatheGeometry(pts, 96);
  return hornGeo;
}

/**
 * Unbranded sculptural horn loudspeaker (ref: ivory spherical horns on black
 * bass enclosures). Placeholder product form — swap for a supplied model.
 */
export function HornSpeaker({ position, rotationY = 0, scale = 1 }: { position: V3; rotationY?: number; scale?: number }) {
  const a = ambience();
  const p = props();
  const cab: [number, number, number] = [0.48, 0.6, 0.46];
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      {/* bass enclosure */}
      <RoundedBox args={cab} radius={0.012} smoothness={3} position={[0, 0.04 + cab[1] / 2, 0]} material={a.blackMetal} castShadow receiveShadow />
      <Block x={[-0.2, 0.2]} y={[0, 0.04]} z={[-0.19, 0.19]} material={a.blackMetal} />
      <group position={[0, 0.04 + cab[1] / 2, cab[2] / 2 + 0.002]}>
        <mesh material={p.driver}>
          <circleGeometry args={[0.17, 48]} />
        </mesh>
        <mesh material={p.driverCone} position={[0, 0, 0.003]}>
          <circleGeometry args={[0.13, 48]} />
        </mesh>
      </group>
      {/* horn: neck, rear bulb, flare */}
      <group position={[0, 0.04 + cab[1] + 0.36, -0.04]}>
        <mesh material={a.blackMetal} position={[0, -0.19, 0]}>
          <cylinderGeometry args={[0.025, 0.04, 0.2, 20]} />
        </mesh>
        <mesh material={a.ceramic} scale={[1, 1, 1.1]} position={[0, 0, -0.08]} castShadow>
          <sphereGeometry args={[0.12, 40, 24]} />
        </mesh>
        <mesh geometry={hornGeometry()} material={a.ceramic} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.02]} castShadow receiveShadow />
        {/* throat, darker glaze — reads as depth */}
        <mesh material={a.ceramicThroat} position={[0, 0, -0.015]}>
          <circleGeometry args={[0.044, 32]} />
        </mesh>
      </group>
    </group>
  );
}

/* ─────────────────────────── drapery ─────────────────────────── */

/** Floor-to-ceiling velvet drape with soft folds, on a slim ceiling track. */
export function Drape({ x, face, z0, z1, h, material }: { x: number; face: 1 | -1; z0: number; z1: number; h: number; material?: Material }) {
  const a = ambience();
  const lo = Math.min(z0, z1);
  const hi = Math.max(z0, z1);
  const w = hi - lo;
  const geo = useMemo(() => {
    const g = new PlaneGeometry(w, h, Math.round(w / 0.02), 1);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i);
      // two summed waves → irregular, natural folds
      pos.setZ(i, Math.sin(u * 38) * 0.035 + Math.sin(u * 13 + 1.3) * 0.02);
    }
    g.computeVertexNormals();
    return g;
  }, [w, h]);
  return (
    <group>
      <mesh
        geometry={geo}
        material={material ?? a.caramel}
        position={[x + face * 0.12, h / 2, (lo + hi) / 2]}
        rotation={[0, (face * Math.PI) / 2, 0]}
        castShadow
        receiveShadow
      />
      <Block x={face > 0 ? [x, x + 0.2] : [x - 0.2, x]} y={[h - 0.03, h]} z={[lo, hi]} material={a.blackMetal} cast={false} />
    </group>
  );
}

/* ─────────────────────────── light fittings ─────────────────────────── */

/** Brass backplate with three opal globes (ref: three-globe sconce over the credenza). */
export function GlobeSconce({ position, rotationY = 0, n = 3, light = 3.2 }: { position: V3; rotationY?: number; n?: number; light?: number }) {
  const a = ambience();
  const gap = 0.3;
  const w = (n - 1) * gap + 0.32;
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Block x={[-w / 2, w / 2]} y={[-0.11, 0.11]} z={[0, 0.02]} material={a.brassReveal} />
      {Array.from({ length: n }, (_, i) => (
        <mesh key={i} material={a.opal} position={[(i - (n - 1) / 2) * gap, 0, 0.16]}>
          <sphereGeometry args={[0.13, 40, 24]} />
        </mesh>
      ))}
      <pointLight position={[0, 0, 0.45]} color="#ffd6a8" intensity={light} distance={6} decay={2} />
    </group>
  );
}

/**
 * Coffered timber ceiling with warm lit coffers (ref: oak listening bar).
 * A softly lit ivory plane above an oak beam grid (self-illuminated: the
 * room's fill comes from the hemisphere light, keeping the shader cost low).
 */
export function CofferCeiling({ z0, z1, hw, h, bay = 1.6 }: { z0: number; z1: number; hw: number; h: number; bay?: number }) {
  const a = ambience();
  const lo = Math.min(z0, z1);
  const hi = Math.max(z0, z1);
  const beams = useMemo<Box[]>(() => {
    const out: Box[] = [];
    const b = 0.14;
    const y0 = h - 0.22;
    const nx = Math.max(1, Math.round((hw * 2) / bay));
    const nz = Math.max(1, Math.round((hi - lo) / bay));
    for (let i = 0; i <= nx; i++) {
      const x = -hw + (i * hw * 2) / nx;
      out.push([x - b / 2, x + b / 2, y0, h - 0.04, lo, hi]);
    }
    for (let j = 0; j <= nz; j++) {
      const z = lo + (j * (hi - lo)) / nz;
      out.push([-hw, hw, y0, h - 0.04, z - b / 2, z + b / 2]);
    }
    return out;
  }, [lo, hi, hw, h, bay]);
  return (
    <group>
      <mesh geometry={worldPlane(hw * 2, hi - lo, 1)} material={a.litIvory} rotation={[Math.PI / 2, 0, 0]} position={[0, h - 0.04, (lo + hi) / 2]} />
      <InstancedBlocks boxes={beams} material={a.oakDark} cast={false} />
    </group>
  );
}

/* ─────────────────────────── seating & tables ─────────────────────────── */

/** Deep cognac leather sofa with houndstooth bolsters (ref: horn-speaker lounge). */
export function LeatherSofa({ position, rotationY = 0, w = 2.4 }: { position: V3; rotationY?: number; w?: number }) {
  const a = ambience();
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Block x={[-w / 2 + 0.06, w / 2 - 0.06]} y={[0, 0.08]} z={[-0.4, 0.38]} material={a.blackMetal} />
      <RoundedBox args={[w, 0.26, 1.0]} radius={0.1} smoothness={4} position={[0, 0.2, 0]} material={a.cognac} castShadow receiveShadow />
      <RoundedBox args={[w, 0.2, 0.3]} radius={0.1} smoothness={4} position={[0, 0.42, -0.36]} material={a.cognac} castShadow />
      {[-1, 1].map((s) => (
        <mesh key={`b${s}`} material={a.houndstooth} position={[s * w * 0.2, 0.43, -0.12]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <capsuleGeometry args={[0.085, w * 0.32, 8, 24]} />
        </mesh>
      ))}
    </group>
  );
}

/** Curved tub lounge chair in bouclé (ref: perforated-oak lounge). */
export function TubChair({ position, rotationY = 0, material }: { position: V3; rotationY?: number; material?: Material }) {
  const a = ambience();
  const m = material ?? a.boucleGrey;
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh material={a.oakDark} position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.3, 0.32, 0.12, 40]} />
      </mesh>
      <mesh material={m} position={[0, 0.25, 0.03]} castShadow receiveShadow>
        <cylinderGeometry args={[0.36, 0.36, 0.22, 48]} />
      </mesh>
      {/* wrap-around back and arms: a thick ring segment open to the front */}
      <mesh material={m} position={[0, 0.48, 0]} rotation={[Math.PI / 2, 0, Math.PI * 0.9]} castShadow>
        <torusGeometry args={[0.34, 0.1, 20, 48, Math.PI * 1.2]} />
      </mesh>
    </group>
  );
}

/** Solid oak cube side table (ref: oak cube tables). */
export function OakCube({ position, s = 0.42 }: { position: V3; s?: number }) {
  const a = ambience();
  return <RoundedBox args={[s, s * 0.95, s]} radius={0.012} smoothness={3} position={[position[0], position[1] + (s * 0.95) / 2, position[2]]} material={a.oak} castShadow receiveShadow />;
}

/** Round white-marble coffee table on a black pedestal (ref: editorial lounge). */
export function MarbleTable({ position, r = 0.55 }: { position: V3; r?: number }) {
  const a = ambience();
  return (
    <group position={position}>
      <mesh material={a.blackMetal} position={[0, 0.005, 0]}>
        <cylinderGeometry args={[0.24, 0.26, 0.01, 40]} />
      </mesh>
      <mesh material={a.blackMetal} position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.05, 0.07, 0.38, 24]} />
      </mesh>
      <mesh material={a.whiteMarble} position={[0, 0.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[r, r, 0.035, 72]} />
      </mesh>
    </group>
  );
}

/** Low bouclé sofa (ref: charcoal bouclé sofas either side of the shelving). */
export function BoucleSofa({ position, rotationY = 0, w = 2.0, material }: { position: V3; rotationY?: number; w?: number; material?: Material }) {
  const a = ambience();
  const m = material ?? a.boucleCharcoal;
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} material={a.oakDark} position={[sx * (w / 2 - 0.1), 0.05, sz * 0.32]}>
            <cylinderGeometry args={[0.02, 0.016, 0.1, 10]} />
          </mesh>
        )),
      )}
      <RoundedBox args={[w, 0.3, 0.86]} radius={0.12} smoothness={4} position={[0, 0.25, 0]} material={m} castShadow receiveShadow />
      <RoundedBox args={[w, 0.38, 0.24]} radius={0.12} smoothness={4} position={[0, 0.56, -0.31]} material={m} castShadow />
      {[-1, 1].map((s) => (
        <RoundedBox key={s} args={[0.22, 0.3, 0.86]} radius={0.11} smoothness={4} position={[s * (w / 2 - 0.11), 0.5, 0]} material={m} castShadow />
      ))}
    </group>
  );
}

/* ─────────────────────────── display walls ─────────────────────────── */

export interface PegItem {
  /** headphone (or any object) to hang; rendered with band top at the peg */
  node: ReactNode;
}

/**
 * Walnut headphone wall (ref: Spiritland): a single walnut board with radiused
 * corners, a grid of brass pegs each with a small numbered brass disc, and a
 * floating walnut shelf beneath. Items hang with their cups along the wall.
 */
export function HeadphoneWall({
  x,
  face,
  z0,
  z1,
  y0,
  y1,
  cols,
  rows,
  items,
  shelfY,
  shelf,
}: {
  x: number;
  face: 1 | -1;
  z0: number;
  z1: number;
  y0: number;
  y1: number;
  cols: number;
  rows: number;
  items: (c: number, r: number) => ReactNode;
  shelfY?: number;
  shelf?: ReactNode;
}) {
  const a = ambience();
  const lo = Math.min(z0, z1);
  const hi = Math.max(z0, z1);
  const t = 0.05;
  const bx = x + face * (t / 2);
  const rot = face > 0 ? Math.PI / 2 : -Math.PI / 2;
  const pegs = useMemo(() => {
    const out: { z: number; y: number; c: number; r: number; n: number }[] = [];
    const cw = (hi - lo) / cols;
    const top = y1 - 0.5;
    const bottom = (shelfY ?? y0) + 0.75;
    let n = 1;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const y = rows === 1 ? top : top - (r * (top - bottom)) / (rows - 1);
        out.push({ z: lo + (c + 0.5) * cw, y, c, r, n: n++ });
      }
    return out;
  }, [lo, hi, cols, rows, y0, y1, shelfY]);
  return (
    <group>
      <group position={[bx, (y0 + y1) / 2, (lo + hi) / 2]} rotation={[0, rot, 0]}>
        <RoundedBox args={[hi - lo, y1 - y0, t]} radius={0.12} smoothness={4} material={a.walnutVeneer} receiveShadow />
      </group>
      {pegs.map((p) => (
        <group key={p.n}>
          {/* brass peg */}
          <mesh material={a.brassReveal} position={[x + face * (t + 0.05), p.y, p.z]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.008, 0.008, 0.1, 12]} />
          </mesh>
          {/* numbered brass disc */}
          <group position={[x + face * (t + 0.004), p.y - 0.02, p.z + (hi - lo) / cols / 2 - 0.09]} rotation={[0, rot, 0]}>
            <mesh material={a.brassReveal} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.024, 0.024, 0.004, 32]} />
            </mesh>
            <Text font={FONTS.sans} fontSize={0.018} position={[0, 0, 0.003]} anchorX="center" anchorY="middle" color="#3a2a1a">
              {String(p.n).padStart(2, '0')}
            </Text>
          </group>
          <group position={[x + face * (t + 0.09), p.y - 0.005, p.z]} rotation={[0, rot, 0]}>
            {items(p.c, p.r)}
          </group>
        </group>
      ))}
      {shelfY !== undefined && (
        <group>
          <Block x={face > 0 ? [x + t, x + t + 0.3] : [x - t - 0.3, x - t]} y={[shelfY - 0.04, shelfY]} z={[lo + 0.2, hi - 0.2]} material={a.walnutVeneer} />
          {shelf}
        </group>
      )}
    </group>
  );
}

/**
 * Editorial black-metal grid shelving (ref: backlit art-book wall), standing
 * in front of a softly lit ivory wall. Plane faces +z; contents by the caller.
 */
export function GridShelf({ z, x0, x1, y0, y1, cols, rows, depth = 0.4, children }: { z: number; x0: number; x1: number; y0: number; y1: number; cols: number; rows: number; depth?: number; children?: ReactNode }) {
  const a = ambience();
  const bars = useMemo<Box[]>(() => {
    const out: Box[] = [];
    const b = 0.022;
    for (let c = 0; c <= cols; c++) {
      const x = x0 + ((x1 - x0) * c) / cols;
      for (const zz of [z - depth, z]) out.push([x - b / 2, x + b / 2, 0, y1, zz - b / 2, zz + b / 2]);
    }
    for (let r = 0; r <= rows; r++) {
      const y = y0 + ((y1 - y0) * r) / rows;
      out.push([x0, x1, y - 0.012, y + 0.012, z - depth, z]);
    }
    return out;
  }, [z, x0, x1, y0, y1, cols, rows, depth]);
  return (
    <group>
      <InstancedBlocks boxes={bars} material={a.blackMetal} />
      {children}
    </group>
  );
}

/** Perforated oak acoustic panelling in front of a lit ivory backing (ref: perforated lounge). */
export function PerforatedWall({ x, face, z0, z1, y0, y1 }: { x: number; face: 1 | -1; z0: number; z1: number; y0: number; y1: number }) {
  const a = ambience();
  const lo = Math.min(z0, z1);
  const hi = Math.max(z0, z1);
  const rot = face > 0 ? Math.PI / 2 : -Math.PI / 2;
  const w = hi - lo;
  const h = y1 - y0;
  return (
    <group>
      <Block x={face > 0 ? [x, x + 0.02] : [x - 0.02, x]} y={[y0, y1]} z={[lo, hi]} material={a.litIvory} cast={false} />
      <mesh geometry={worldPlane(w, h, 0.32)} material={a.perfOak} position={[x + face * 0.07, (y0 + y1) / 2, (lo + hi) / 2]} rotation={[0, rot, 0]} />
      <Block x={face > 0 ? [x, x + 0.09] : [x - 0.09, x]} y={[y1, y1 + 0.03]} z={[lo, hi]} material={a.oakDark} />
    </group>
  );
}

/* ─────────────────────────── curated objects ─────────────────────────── */

const BOOK_TONES = ['#e8e1d3', '#b9a88d', '#2d2b28', '#8c5a3a', '#c7c0b4', '#55615a', '#9a2f26', '#d6b37a'];

/** A run of upright books in muted tones (no titles, no brands). Spines face +z. */
export function Books({ position, rotationY = 0, n = 7, seed = 1 }: { position: V3; rotationY?: number; n?: number; seed?: number }) {
  const mats = useMemo(() => {
    const base = ambience().oatmealRug;
    return BOOK_TONES.map((c) => {
      const m = base.clone();
      m.map = null;
      m.color.set(c);
      m.roughness = 0.75;
      return m;
    });
  }, []);
  const books = useMemo(() => {
    let s = seed * 7919;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    let x = 0;
    return Array.from({ length: n }, () => {
      const w = 0.025 + r() * 0.03;
      const h = 0.22 + r() * 0.1;
      const b = { x: x + w / 2, w, h, d: 0.16 + r() * 0.06, m: Math.floor(r() * BOOK_TONES.length) };
      x += w + 0.002;
      return b;
    });
  }, [n, seed]);
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {books.map((b, i) => (
        <mesh key={i} material={mats[b.m]} position={[b.x, b.h / 2, 0]} castShadow>
          <boxGeometry args={[b.w, b.h, b.d]} />
        </mesh>
      ))}
    </group>
  );
}

let vaseGeo: LatheGeometry | null = null;
/** Hand-thrown ceramic vessel. */
export function Vessel({ position, scale = 1 }: { position: V3; scale?: number }) {
  if (!vaseGeo) {
    const pts = [
      [0.0, 0],
      [0.06, 0],
      [0.085, 0.05],
      [0.095, 0.11],
      [0.07, 0.19],
      [0.04, 0.23],
      [0.045, 0.26],
    ].map(([r, y]) => new Vector2(r, y));
    vaseGeo = new LatheGeometry(pts, 48);
  }
  return <mesh geometry={vaseGeo} material={ambience().ceramic} position={position} scale={scale} castShadow />;
}
