import { RoundedBox, Text } from '@react-three/drei';
import { type ReactNode, useMemo } from 'react';
import { CanvasTexture, Color, MeshStandardMaterial, SRGBColorSpace } from 'three';
import { Block } from '../scene/Block';
import { FONTS } from '../scene/fonts';
import { ambience } from './ambience';

/**
 * Hand-built 3D representations of the showcase products (homepage only).
 * Proportions from published specifications — see config/showcase.ts.
 * Each component is a single swap point for a supplied GLB later.
 */
type V3 = [number, number, number];

/* ─────────────── shared materials ─────────────── */
let lib: ReturnType<typeof make> | null = null;
function make() {
  return {
    // Aavik: matte-black composite cabinet, titanium braces, Darkz-style feet
    aavikBody: new MeshStandardMaterial({ color: '#111113', roughness: 0.62, metalness: 0.05 }),
    aavikGlass: new MeshStandardMaterial({ color: '#050506', roughness: 0.06, metalness: 0.3, envMapIntensity: 1.4 }),
    titanium: new MeshStandardMaterial({ color: '#a9abad', roughness: 0.34, metalness: 1, envMapIntensity: 1.3 }),
    copper: new MeshStandardMaterial({ color: '#b06a43', roughness: 0.3, metalness: 1 }),
    knob: new MeshStandardMaterial({ color: '#17171a', roughness: 0.35, metalness: 0.8 }),
    // Abyss
    ceramicBlack: new MeshStandardMaterial({ color: '#141416', roughness: 0.42, metalness: 0.55, envMapIntensity: 1.2 }),
    polished: new MeshStandardMaterial({ color: '#d7d8da', roughness: 0.1, metalness: 1, envMapIntensity: 1.6 }),
    steelGrille: new MeshStandardMaterial({ color: '#26272a', roughness: 0.5, metalness: 0.8 }),
    lambskin: new MeshStandardMaterial({ color: '#0e0d0d', roughness: 0.7 }),
    titaniumGray: new MeshStandardMaterial({ color: '#7d8084', roughness: 0.36, metalness: 0.85, envMapIntensity: 1.3 }),
    darkBronze: new MeshStandardMaterial({ color: '#5a4230', roughness: 0.38, metalness: 0.85, envMapIntensity: 1.3 }),
    carbon: new MeshStandardMaterial({ color: '#1c1c1e', roughness: 0.28, metalness: 0.3 }),
  };
}
function mats() {
  if (!lib) lib = make();
  return lib;
}

/** Red dot-matrix readout (Aavik's signature large-font display), as an emissive map. */
const displayCache = new Map<string, CanvasTexture>();
function dotMatrix(text: string) {
  const hit = displayCache.get(text);
  if (hit) return hit;
  const W = 512;
  const H = 96;
  const src = document.createElement('canvas');
  src.width = W;
  src.height = H;
  const s = src.getContext('2d')!;
  s.fillStyle = '#fff';
  s.font = '600 62px Inter, system-ui, sans-serif';
  s.textBaseline = 'middle';
  s.fillText(text, 14, H / 2 + 2);
  const px = s.getImageData(0, 0, W, H).data;
  const out = document.createElement('canvas');
  out.width = W;
  out.height = H;
  const o = out.getContext('2d')!;
  o.fillStyle = '#000';
  o.fillRect(0, 0, W, H);
  const step = 6;
  for (let y = step / 2; y < H; y += step)
    for (let x = step / 2; x < W; x += step) {
      const on = px[(Math.floor(y) * W + Math.floor(x)) * 4 + 3] > 110;
      o.fillStyle = on ? '#ff4433' : 'rgba(255,60,40,0.05)';
      o.beginPath();
      o.arc(x, y, on ? 2.3 : 1.6, 0, Math.PI * 2);
      o.fill();
    }
  const t = new CanvasTexture(out);
  t.colorSpace = SRGBColorSpace;
  displayCache.set(text, t);
  return t;
}

/** Sunflower (Fibonacci) vent pattern for Diana cup faces. */
let fibTex: CanvasTexture | null = null;
function fibonacciVents() {
  if (fibTex) return fibTex;
  const S = 256;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d')!;
  g.fillStyle = '#fff';
  g.fillRect(0, 0, S, S);
  g.fillStyle = '#1a1a1a';
  const n = 160;
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const r = Math.sqrt(i / n) * S * 0.44;
    const a = i * golden;
    g.beginPath();
    g.arc(S / 2 + Math.cos(a) * r, S / 2 + Math.sin(a) * r, 2.6, 0, Math.PI * 2);
    g.fill();
  }
  fibTex = new CanvasTexture(c);
  fibTex.colorSpace = SRGBColorSpace;
  return fibTex;
}

/* ─────────────── Aavik 580 series ─────────────── */

export type AavikModel = 'I-580' | 'D-580' | 'S-580' | 'R-580';
const READOUT: Record<AavikModel, string> = {
  'I-580': 'STREAM  -32 dB',
  'D-580': 'USB  384 kHz',
  'S-580': 'TIDAL  PLAYING',
  'R-580': 'MC  LOW  60 dB',
};

/**
 * Aavik 580-series chassis (shared by I/D/S/R): 440 × 100 × 370 mm.
 * Matte-black composite cabinet, titanium reinforcement beams on the top,
 * large red dot-matrix display behind dark glass, one main knob, Darkz-style feet.
 * Local front +z, base at y = 0.
 */
export function Aavik580({ position, rotationY = 0, model }: { position: V3; rotationY?: number; model: AavikModel }) {
  const m = mats();
  const W = 0.44;
  const H = 0.1;
  const D = 0.37;
  const foot = 0.014;
  const screen = useMemo(
    () => new MeshStandardMaterial({ color: '#000', emissive: new Color('#ffffff'), emissiveMap: dotMatrix(READOUT[model]), emissiveIntensity: 1.5, toneMapped: false }),
    [model],
  );
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * (W / 2 - 0.05), foot / 2, sz * (D / 2 - 0.05)]} material={m.titanium}>
            <cylinderGeometry args={[0.022, 0.026, foot, 24]} />
          </mesh>
        )),
      )}
      <RoundedBox args={[W, H, D]} radius={0.006} smoothness={3} position={[0, foot + H / 2, 0]} material={m.aavikBody} castShadow receiveShadow />
      {/* titanium beams on the top plate (580 identifier) */}
      {[-0.11, 0.11].map((x) => (
        <Block key={x} x={[x - 0.016, x + 0.016]} y={[foot + H, foot + H + 0.006]} z={[-D / 2 + 0.01, D / 2 - 0.01]} material={m.titanium} />
      ))}
      {/* copper seam (copper electronics chassis) */}
      <Block x={[-W / 2 - 0.001, W / 2 + 0.001]} y={[foot + 0.012, foot + 0.016]} z={[-D / 2 + 0.02, D / 2 - 0.02]} material={m.copper} cast={false} />
      {/* front: dark glass window + red dot-matrix readout */}
      <Block x={[-W / 2 + 0.02, 0.1]} y={[foot + 0.03, foot + 0.078]} z={[D / 2, D / 2 + 0.003]} material={m.aavikGlass} cast={false} />
      <mesh position={[-W / 2 + 0.02 + 0.16, foot + 0.054, D / 2 + 0.0035]} material={screen}>
        <planeGeometry args={[0.26, 0.0488]} />
      </mesh>
      {/* main knob */}
      <group position={[0.155, foot + H / 2, D / 2]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.014]} material={m.knob} castShadow>
          <cylinderGeometry args={[0.03, 0.031, 0.028, 48]} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.0285]} material={m.titanium}>
          <cylinderGeometry args={[0.03, 0.03, 0.002, 48]} />
        </mesh>
      </group>
      {/* minimal touch buttons */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]} position={[0.108, foot + 0.035 + i * 0.016, D / 2 + 0.002]} material={m.titanium}>
          <cylinderGeometry args={[0.0035, 0.0035, 0.002, 16]} />
        </mesh>
      ))}
      <Text font={FONTS.sans} fontSize={0.0085} letterSpacing={0.4} position={[-W / 2 + 0.025, foot + 0.018, D / 2 + 0.004]} anchorX="left" anchorY="middle" color="#9a9ca0">
        AAVIK
      </Text>
    </group>
  );
}

/* ─────────────── Abyss ─────────────── */

/**
 * AB-1266 Phi TC: squarish two-tone black ceramic capsules with steel
 * baffle/grille and polished accents; rigid U-shaped band with centre slide
 * joint; wide flat leather strap; thick lambskin pads. ~640 g.
 * Origin = top of band; cups along local x; capsule faces ±x.
 */
export function AbyssAB1266({ position, rotationY = 0, scale = 1 }: { position: V3; rotationY?: number; scale?: number }) {
  const m = mats();
  const cx = 0.098;
  const cy = -0.17;
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * cx, cy, 0]}>
          <RoundedBox args={[0.036, 0.132, 0.118]} radius={0.012} smoothness={4} material={m.ceramicBlack} castShadow />
          {/* steel baffle / grille on the outer face, polished bezel */}
          <RoundedBox args={[0.006, 0.112, 0.098]} radius={0.008} smoothness={3} position={[s * 0.019, 0, 0]} material={m.polished} />
          <RoundedBox args={[0.006, 0.102, 0.088]} radius={0.007} smoothness={3} position={[s * 0.0215, 0, 0]} material={m.steelGrille} />
          {[-1, 1].flatMap((a) =>
            [-1, 1].map((b) => (
              <mesh key={`${a}${b}`} position={[s * 0.0245, a * 0.046, b * 0.039]} rotation={[0, 0, Math.PI / 2]} material={m.polished}>
                <cylinderGeometry args={[0.003, 0.003, 0.002, 10]} />
              </mesh>
            )),
          )}
          {/* lambskin pad (inner side) */}
          <RoundedBox args={[0.03, 0.126, 0.11]} radius={0.014} smoothness={4} position={[-s * 0.031, 0, 0]} material={m.lambskin} />
        </group>
      ))}
      {/* rigid U-band: uprights + flat top section + slide joint */}
      {[-1, 1].map((s) => (
        <Block key={s} x={s < 0 ? [-cx - 0.005, -cx + 0.005] : [cx - 0.005, cx + 0.005]} y={[cy + 0.066, -0.012]} z={[-0.012, 0.012]} material={m.ceramicBlack} />
      ))}
      <Block x={[-cx - 0.005, cx + 0.005]} y={[-0.012, 0]} z={[-0.012, 0.012]} material={m.ceramicBlack} />
      <Block x={[-0.022, 0.022]} y={[-0.016, 0.004]} z={[-0.016, 0.016]} material={m.polished} />
      {/* wide flat strap */}
      <mesh position={[0, -0.12, 0]} scale={[1, 1, 2.8]} material={m.lambskin}>
        <torusGeometry args={[cx - 0.008, 0.007, 8, 40, Math.PI]} />
      </mesh>
    </group>
  );
}

/**
 * Diana TC: compact squarish cups with sharply curved corners in Titanium Gray
 * or Dark Bronze ceramic finish; Fibonacci vent pattern; thin arching band with
 * carbon-fibre slider and padded strap. ~390 g. Origin = top of band.
 */
export function AbyssDianaTC({ position, rotationY = 0, finish = 'titanium', scale = 1 }: { position: V3; rotationY?: number; finish?: 'titanium' | 'bronze'; scale?: number }) {
  const m = mats();
  const body = finish === 'titanium' ? m.titaniumGray : m.darkBronze;
  const face = useMemo(() => {
    const f = body.clone();
    f.map = fibonacciVents();
    return f;
  }, [body]);
  const cx = 0.09;
  const cy = -0.14;
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * cx, cy, 0]}>
          <RoundedBox args={[0.026, 0.104, 0.096]} radius={0.02} smoothness={5} material={body} castShadow />
          <mesh position={[s * 0.0135, 0, 0]} rotation={[0, (s * Math.PI) / 2, 0]} material={face}>
            <planeGeometry args={[0.074, 0.08]} />
          </mesh>
          <RoundedBox args={[0.026, 0.108, 0.098]} radius={0.024} smoothness={5} position={[-s * 0.025, 0, 0]} material={m.lambskin} />
          {/* carbon slider + yoke */}
          <Block x={[-0.004, 0.004]} y={[0.052, 0.078]} z={[-0.009, 0.009]} material={m.carbon} />
        </group>
      ))}
      <mesh position={[0, -0.062, 0]} scale={[1, 0.74, 2.4]} material={body} castShadow>
        <torusGeometry args={[cx, 0.0045, 8, 48, Math.PI]} />
      </mesh>
      <mesh position={[0, -0.075, 0]} scale={[1, 0.7, 3.4]} material={m.lambskin}>
        <torusGeometry args={[cx - 0.01, 0.005, 8, 40, Math.PI]} />
      </mesh>
    </group>
  );
}

/** Display stand: bronze base, slim pole, leather-wrapped saddle. Top of saddle at y = h. */
export function HeadphoneStand({ position, h = 0.34, rotationY = 0, children }: { position: V3; h?: number; rotationY?: number; children?: ReactNode }) {
  const a = ambience();
  const m = mats();
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh material={a.brassReveal} position={[0, 0.006, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.07, 0.075, 0.012, 48]} />
      </mesh>
      <mesh material={a.brassReveal} position={[0, h / 2, 0]} castShadow>
        <cylinderGeometry args={[0.005, 0.006, h, 12]} />
      </mesh>
      <mesh material={m.lambskin} position={[0, h - 0.03, 0]} rotation={[0, Math.PI / 2, 0]} scale={[1, 0.6, 1]}>
        <torusGeometry args={[0.03, 0.009, 8, 24, Math.PI]} />
      </mesh>
      <group position={[0, h + 0.002, 0]}>{children}</group>
    </group>
  );
}

/** Small brass-lettered product plaque. */
export function Plaque({ position, rotationY = 0, brand, model }: { position: V3; rotationY?: number; brand: string; model: string }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Text font={FONTS.sans} fontSize={0.016} letterSpacing={0.3} anchorX="center" anchorY="bottom" color="#c9a86e">
        {brand.toUpperCase()}
      </Text>
      <Text font={FONTS.display} fontSize={0.022} anchorX="center" anchorY="top" position={[0, -0.004, 0]} color="#e6d9c2">
        {model}
      </Text>
    </group>
  );
}
