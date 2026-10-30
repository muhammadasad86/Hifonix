import { Color, DoubleSide, MeshStandardMaterial } from 'three';
import { Block } from '../scene/Block';
import { materials } from '../scene/materials';

/**
 * Product + furniture props for the homepage gallery.
 * PLACEHOLDER FORMS: generic, unbranded silhouettes of real product types.
 * Each is a single component so it can be swapped for a supplied GLB later.
 */
let lib: ReturnType<typeof make> | null = null;
function make() {
  const m = materials();
  const charcoal = m.limePlaster.clone();
  charcoal.color.set('#3a3632');
  return {
    walnut: new MeshStandardMaterial({ map: m.oak.map, color: '#6a4a33', roughness: 0.42 }),
    lacquer: new MeshStandardMaterial({ color: '#0f1012', roughness: 0.18, metalness: 0.2 }),
    driver: new MeshStandardMaterial({ color: '#17181a', roughness: 0.6 }),
    driverCone: new MeshStandardMaterial({ color: '#2a2b2e', roughness: 0.35, metalness: 0.4 }),
    silver: new MeshStandardMaterial({ color: '#b9b6b0', roughness: 0.32, metalness: 1 }),
    blackMetal: new MeshStandardMaterial({ color: '#1b1c1f', roughness: 0.4, metalness: 0.85 }),
    display: new MeshStandardMaterial({ color: '#120b05', emissive: new Color('#ffb36b'), emissiveIntensity: 1.4 }),
    vinyl: new MeshStandardMaterial({ color: '#0a0a0b', roughness: 0.25 }),
    label: new MeshStandardMaterial({ color: '#b8734a', roughness: 0.6 }),
    leather: new MeshStandardMaterial({ color: '#5b3a26', roughness: 0.55 }),
    leatherDark: new MeshStandardMaterial({ color: '#2a1d16', roughness: 0.6 }),
    wool: new MeshStandardMaterial({ color: '#3b332c', roughness: 1 }),
    pad: new MeshStandardMaterial({ color: '#232120', roughness: 0.9, side: DoubleSide }),
    charcoal,
    stoneDark: new MeshStandardMaterial({ map: m.limestone.map, color: '#8d8478', roughness: 0.45 }),
    cable: new MeshStandardMaterial({ color: '#2b2622', roughness: 0.5 }),
    cableBronze: new MeshStandardMaterial({ color: '#7a5a3a', roughness: 0.45, metalness: 0.6 }),
    /** concealed LED, read as a warm line rather than a white bar */
    ledSoft: (() => {
      const l = m.ledLine.clone();
      l.emissiveIntensity = 0.85;
      l.emissive.set('#ffc98f');
      return l;
    })(),
    /** lattice backlight — a glow, not a lightbox */
    glowSoft: (() => {
      const g = m.glowPanel.clone();
      g.emissiveIntensity = 0.38;
      return g;
    })(),
    /** niche backs: a low ember so headphones read in silhouette */
    nicheGlow: (() => {
      const g = m.glowPanel.clone();
      g.emissiveIntensity = 0.12;
      g.emissive.set('#d99a5c');
      return g;
    })(),
    /** splash wall: deeper, warmer limestone for the dark opening */
    stoneDim: (() => {
      const st = m.limestone.clone();
      st.color.set('#6f665b');
      return st;
    })(),
  };
}
export function props() {
  if (!lib) lib = make();
  return lib;
}

/** Floorstanding loudspeaker. Local front faces +z; base at y=0. */
export function FloorSpeaker({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  const p = props();
  const m = materials();
  const W = 0.26;
  const H = 1.14;
  const D = 0.4;
  const drivers: [number, number][] = [
    [0.95, 0.03],
    [0.78, 0.075],
    [0.56, 0.085],
    [0.32, 0.095],
  ];
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Block x={[-W / 2 - 0.03, W / 2 + 0.03]} y={[0, 0.035]} z={[-D / 2 - 0.03, D / 2 + 0.03]} material={m.bronze} />
      <Block x={[-W / 2, W / 2]} y={[0.035, H]} z={[-D / 2, D / 2]} material={p.walnut} />
      <Block x={[-W / 2 + 0.006, W / 2 - 0.006]} y={[0.05, H - 0.015]} z={[D / 2, D / 2 + 0.006]} material={p.lacquer} />
      {drivers.map(([y, r]) => (
        <group key={y} position={[0, y, D / 2 + 0.008]}>
          <mesh material={p.driver}>
            <circleGeometry args={[r + 0.012, 40]} />
          </mesh>
          <mesh material={p.driverCone} position={[0, 0, 0.002]}>
            <circleGeometry args={[r * 0.82, 40]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Generic full-width component (amp / DAC / streamer). Local front +z, base at y=0. */
export function Component({
  position,
  rotationY = 0,
  h = 0.12,
  finish = 'silver',
  knobs = 2,
  display = true,
}: {
  position: [number, number, number];
  rotationY?: number;
  h?: number;
  finish?: 'silver' | 'black';
  knobs?: number;
  display?: boolean;
}) {
  const p = props();
  const W = 0.43;
  const D = 0.38;
  const body = finish === 'silver' ? p.silver : p.blackMetal;
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * (W / 2 - 0.04), 0.008, sz * (D / 2 - 0.04)]} material={p.blackMetal}>
            <cylinderGeometry args={[0.018, 0.02, 0.016, 16]} />
          </mesh>
        )),
      )}
      <Block x={[-W / 2, W / 2]} y={[0.016, h]} z={[-D / 2, D / 2]} material={body} />
      <Block x={[-W / 2 + 0.01, W / 2 - 0.01]} y={[0.02, h - 0.004]} z={[D / 2, D / 2 + 0.006]} material={p.blackMetal} />
      {display && (
        <Block x={[-0.06, 0.06]} y={[h * 0.42, h * 0.72]} z={[D / 2 + 0.006, D / 2 + 0.008]} material={p.display} cast={false} />
      )}
      {Array.from({ length: knobs }, (_, i) => (
        <mesh
          key={i}
          position={[(i === 0 ? -1 : 1) * 0.15, h * 0.55, D / 2 + 0.02]}
          rotation={[Math.PI / 2, 0, 0]}
          material={p.silver}
          castShadow
        >
          <cylinderGeometry args={[Math.min(0.032, h * 0.3), Math.min(0.034, h * 0.32), 0.03, 32]} />
        </mesh>
      ))}
    </group>
  );
}

/** Belt-drive turntable: plinth, platter, record, tonearm. Base at y=0. */
export function Turntable({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  const p = props();
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Block x={[-0.225, 0.225]} y={[0, 0.075]} z={[-0.18, 0.18]} material={p.walnut} />
      <mesh position={[-0.04, 0.09, 0]} material={p.silver} castShadow>
        <cylinderGeometry args={[0.152, 0.152, 0.03, 64]} />
      </mesh>
      <mesh position={[-0.04, 0.107, 0]} material={p.vinyl}>
        <cylinderGeometry args={[0.15, 0.15, 0.004, 64]} />
      </mesh>
      <mesh position={[-0.04, 0.11, 0]} material={p.label}>
        <cylinderGeometry args={[0.045, 0.045, 0.002, 32]} />
      </mesh>
      <mesh position={[0.165, 0.11, -0.11]} material={p.blackMetal}>
        <cylinderGeometry args={[0.022, 0.026, 0.07, 20]} />
      </mesh>
      <mesh position={[0.1, 0.138, -0.02]} rotation={[0, 0.5, Math.PI / 2]} material={p.silver} castShadow>
        <cylinderGeometry args={[0.005, 0.005, 0.24, 10]} />
      </mesh>
    </group>
  );
}

/** Over-ear headphone, centred on its headband; cups along local x. */
export function Headphone({
  position,
  rotationY = 0,
  cup = 'wood',
  scale = 1,
}: {
  position: [number, number, number];
  rotationY?: number;
  cup?: 'wood' | 'metal' | 'leather';
  scale?: number;
}) {
  const p = props();
  const m = materials();
  const cupMat = cup === 'wood' ? p.walnut : cup === 'metal' ? m.bronze : p.leatherDark;
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <mesh material={p.blackMetal} rotation={[0, Math.PI / 2, 0]} castShadow>
        <torusGeometry args={[0.1, 0.007, 10, 48, Math.PI]} />
      </mesh>
      <mesh material={p.leather} rotation={[0, Math.PI / 2, 0]} position={[0, -0.012, 0]}>
        <torusGeometry args={[0.088, 0.012, 10, 40, Math.PI]} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.1, -0.085, 0]} rotation={[0, 0, Math.PI / 2]}>
          <mesh material={p.silver} position={[0, -s * 0.004, 0]}>
            <torusGeometry args={[0.055, 0.005, 8, 32]} />
          </mesh>
          <mesh material={cupMat} position={[0, s * 0.022, 0]} castShadow>
            <cylinderGeometry args={[0.052, 0.055, 0.032, 40]} />
          </mesh>
          <mesh material={p.pad} position={[0, -s * 0.006, 0]}>
            <cylinderGeometry args={[0.056, 0.056, 0.026, 40]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Bronze T-stand with a headphone resting on it. Base at y=0. */
export function HeadphoneOnStand({
  position,
  rotationY = 0,
  cup = 'wood',
  scale = 1,
}: {
  position: [number, number, number];
  rotationY?: number;
  cup?: 'wood' | 'metal' | 'leather';
  scale?: number;
}) {
  const m = materials();
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <mesh material={m.bronze} position={[0, 0.008, 0]} castShadow>
        <cylinderGeometry args={[0.065, 0.07, 0.016, 40]} />
      </mesh>
      <mesh material={m.bronze} position={[0, 0.17, 0]} castShadow>
        <cylinderGeometry args={[0.006, 0.006, 0.32, 12]} />
      </mesh>
      <mesh material={m.bronze} position={[0, 0.33, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.012, 0.012, 0.09, 16]} />
      </mesh>
      <Headphone position={[0, 0.43, 0]} cup={cup} />
    </group>
  );
}

/** Lounge chair (leather on walnut). Local front faces +z. */
export function LoungeChair({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  const p = props();
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {[-1, 1].map((s) => (
        <Block key={s} x={[s * 0.36 - 0.03, s * 0.36 + 0.03]} y={[0, 0.58]} z={[-0.4, 0.4]} material={p.walnut} />
      ))}
      <Block x={[-0.33, 0.33]} y={[0.24, 0.4]} z={[-0.36, 0.38]} material={p.leather} />
      <group position={[0, 0.4, -0.32]} rotation={[-0.22, 0, 0]}>
        <Block x={[-0.33, 0.33]} y={[0, 0.5]} z={[-0.08, 0.06]} material={p.leather} />
      </group>
    </group>
  );
}

/** Multi-tier equipment rack: walnut shelves on bronze posts, with components. Local front +z. */
export function EquipmentRack({ position, rotationY = 0, tiers = 4 }: { position: [number, number, number]; rotationY?: number; tiers?: number }) {
  const p = props();
  const m = materials();
  const W = 0.62;
  const D = 0.5;
  const gap = 0.3;
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * (W / 2 - 0.03), (tiers * gap) / 2 + 0.04, sz * (D / 2 - 0.03)]} material={m.bronze} castShadow>
            <cylinderGeometry args={[0.014, 0.014, tiers * gap + 0.08, 12]} />
          </mesh>
        )),
      )}
      {Array.from({ length: tiers }, (_, i) => {
        const y = 0.06 + i * gap;
        return (
          <group key={i}>
            <Block x={[-W / 2, W / 2]} y={[y, y + 0.04]} z={[-D / 2, D / 2]} material={p.walnut} />
            {i < tiers - 1 && (
              <Component position={[0, y + 0.04, 0.02]} h={0.1 + (i % 2) * 0.04} finish={i % 2 ? 'black' : 'silver'} knobs={i % 3 === 0 ? 2 : 1} display={i !== 1} />
            )}
          </group>
        );
      })}
    </group>
  );
}

/** Stone isolation platform on bronze cones. Base at y=0. */
export function IsolationPlatform({ position, w = 0.5, d = 0.42 }: { position: [number, number, number]; w?: number; d?: number }) {
  const p = props();
  const m = materials();
  return (
    <group position={position}>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * (w / 2 - 0.05), 0.022, sz * (d / 2 - 0.05)]} rotation={[Math.PI, 0, 0]} material={m.bronze}>
            <coneGeometry args={[0.022, 0.044, 20]} />
          </mesh>
        )),
      )}
      <Block x={[-w / 2, w / 2]} y={[0.044, 0.094]} z={[-d / 2, d / 2]} material={p.stoneDark} />
    </group>
  );
}

/** Coiled cable, lying flat. */
export function CableCoil({ position, r = 0.11, bronze = false }: { position: [number, number, number]; r?: number; bronze?: boolean }) {
  const p = props();
  return (
    <group position={position}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[i * 0.006, 0.012 + i * 0.012, 0]} rotation={[Math.PI / 2, 0, i * 0.4]} material={bronze ? p.cableBronze : p.cable} castShadow>
          <torusGeometry args={[r - i * 0.006, 0.009, 10, 48]} />
        </mesh>
      ))}
    </group>
  );
}
