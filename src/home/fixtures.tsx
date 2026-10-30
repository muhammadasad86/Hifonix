import { RoundedBox } from '@react-three/drei';
import { type ReactNode, useLayoutEffect, useMemo, useRef } from 'react';
import { BoxGeometry, Color, CylinderGeometry, type InstancedMesh, type Material, Matrix4, Quaternion, type RectAreaLight, Vector3 } from 'three';
import { Block } from '../scene/Block';
import { type Box, InstancedBlocks, slatRun } from '../scene/InstancedBlocks';
import { ambience, AMBIENCE } from './ambience';

/**
 * Architectural fixtures + furniture for the studio ambience.
 * Side walls run along z at x = ±hw; `face` is the direction the lining faces
 * (+1 → faces +x, i.e. it lines the LEFT wall; −1 → lines the RIGHT wall).
 */
type V3 = [number, number, number];

/**
 * Soft area light that washes a wall from a cove — the references' key
 * lighting move (walls glow; light comes from the architecture, not fixtures).
 */
export function WallWash({ from, to, width, height = 0.3, intensity, color = '#ffb36e' }: { from: V3; to: V3; width: number; height?: number; intensity: number; color?: string }) {
  const ref = useRef<RectAreaLight>(null);
  useLayoutEffect(() => {
    ref.current?.lookAt(...to);
  }, [to]);
  return <rectAreaLight ref={ref} position={from} width={width} height={height} intensity={intensity} color={color} />;
}

/** Oxblood mahogany panelling: panel grid with dark reveals, brass dado, amber cove at the head. */
export function PanelledWall({ x, face, z0, z1, h, bay = 1.2, wash = 32, material, reveal }: { x: number; face: 1 | -1; z0: number; z1: number; h: number; bay?: number; wash?: number; material?: Material; reveal?: Material }) {
  const a = ambience();
  const panel = material ?? a.mahogany;
  const seam = reveal ?? a.fluted;
  const lo = Math.min(z0, z1);
  const hi = Math.max(z0, z1);
  const t = 0.035;
  const xr = (d0: number, d1: number): [number, number] => {
    const p = x + face * d0;
    const q = x + face * d1;
    return [Math.min(p, q), Math.max(p, q)];
  };
  const reveals = useMemo<Box[]>(() => {
    const out: Box[] = [];
    const n = Math.max(1, Math.round((hi - lo) / bay));
    const step = (hi - lo) / n;
    const [r0, r1] = xr(t, t + 0.004);
    for (let i = 1; i < n; i++) out.push([r0, r1, 0.12, h - 0.42, lo + i * step - 0.006, lo + i * step + 0.006]);
    for (const y of [1.05, 2.55]) out.push([r0, r1, y - 0.006, y + 0.006, lo, hi]);
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [x, face, lo, hi, h, bay]);
  return (
    <group>
      <Block x={xr(0, t)} y={[0, h - 0.4]} z={[lo, hi]} material={panel} tile={1.2} aligned />
      <InstancedBlocks boxes={reveals} material={seam} cast={false} />
      <Block x={xr(t, t + 0.02)} y={[1.03, 1.07]} z={[lo, hi]} material={a.brassReveal} cast={false} />
      {/* cove: shelf lip + concealed amber line washing the wall above */}
      <Block x={xr(0, 0.16)} y={[h - 0.42, h - 0.38]} z={[lo, hi]} material={a.walnutVeneer} cast={false} />
      <Block x={xr(0.12, 0.14)} y={[h - 0.385, h - 0.375]} z={[lo + 0.05, hi - 0.05]} material={a.cove} cast={false} />
      <Block x={xr(0, 0.02)} y={[h - 0.38, h]} z={[lo, hi]} material={panel} tile={1.2} aligned cast={false} />
      {wash > 0 && <WallWash from={[x + face * 0.5, h - 0.5, (lo + hi) / 2]} to={[x, 0.6, (lo + hi) / 2]} width={hi - lo} intensity={wash} />}
    </group>
  );
}

/** Black lacquered fluting (vertical reeds) on a side wall. */
export function FlutedWall({ x, face, z0, z1, y0 = 0, y1 }: { x: number; face: 1 | -1; z0: number; z1: number; y0?: number; y1: number }) {
  const a = ambience();
  const lo = Math.min(z0, z1);
  const hi = Math.max(z0, z1);
  const back: [number, number] = face > 0 ? [x, x + 0.02] : [x - 0.02, x];
  const reed: [number, number] = face > 0 ? [x + 0.02, x + 0.055] : [x - 0.055, x - 0.02];
  const reeds = useMemo(() => slatRun('z', lo, hi, 0.045, 0.03, { y: [y0, y1], other: reed }), [lo, hi, y0, y1, reed[0], reed[1]]);
  return (
    <group>
      <Block x={back} y={[y0, y1]} z={[lo, hi]} material={a.fluted} cast={false} />
      <InstancedBlocks boxes={reeds} material={a.fluted} />
    </group>
  );
}

/** Amber backlit glass-block wall, pressed with the eight-point star. Plane faces `face` along x. */
export function GlassBlockWall({ x, face, z0, z1, y0 = 0, y1 }: { x: number; face: 1 | -1; z0: number; z1: number; y0?: number; y1: number }) {
  const a = ambience();
  const lo = Math.min(z0, z1);
  const hi = Math.max(z0, z1);
  return (
    <group>
      <Block x={face > 0 ? [x, x + 0.1] : [x - 0.1, x]} y={[y0, y1]} z={[lo, hi]} material={a.glassBlock} tile={0.76} aligned cast={false} />
      {/* slim bronze frame */}
      {[lo, hi].map((zz) => (
        <Block key={zz} x={face > 0 ? [x, x + 0.13] : [x - 0.13, x]} y={[y0, y1]} z={[zz - 0.02, zz + 0.02]} material={a.brassReveal} />
      ))}
      <WallWash from={[x + face * 0.15, (y0 + y1) / 2, (lo + hi) / 2]} to={[x + face * 3, (y0 + y1) / 2 - 0.6, (lo + hi) / 2]} width={hi - lo} height={y1 - y0} intensity={7} color="#ffad66" />
    </group>
  );
}

/** Same glass-block wall, facing +z (for back walls). */
export function GlassBlockPanel({ z, x0, x1, y0, y1 }: { z: number; x0: number; x1: number; y0: number; y1: number }) {
  const a = ambience();
  return (
    <group>
      <Block x={[x0, x1]} y={[y0, y1]} z={[z - 0.1, z]} material={a.glassBlock} tile={0.76} aligned cast={false} />
      {[x0, x1].map((xx) => (
        <Block key={xx} x={[xx - 0.025, xx + 0.025]} y={[y0, y1]} z={[z - 0.12, z + 0.03]} material={a.brassReveal} />
      ))}
      <Block x={[x0 - 0.025, x1 + 0.025]} y={[y1, y1 + 0.04]} z={[z - 0.12, z + 0.03]} material={a.brassReveal} />
      <WallWash from={[(x0 + x1) / 2, (y0 + y1) / 2, z + 0.12]} to={[(x0 + x1) / 2, (y0 + y1) / 2 - 0.6, z + 3]} width={x1 - x0} height={y1 - y0} intensity={7} color="#ffad66" />
    </group>
  );
}

/** Ceiling of circular backlit lay-lights in brass rings (ref 4; echoes the splash oculus). */
export function CeilingOculi({ h, xs, zs, r = 0.55 }: { h: number; xs: number[]; zs: number[]; r?: number }) {
  const a = ambience();
  return (
    <group>
      {xs.flatMap((x) =>
        zs.map((z) => (
          <group key={`${x}${z}`} position={[x, h - 0.004, z]} rotation={[Math.PI / 2, 0, 0]}>
            <mesh material={a.layLight}>
              <circleGeometry args={[r, 48]} />
            </mesh>
            <mesh material={a.brassReveal} position={[0, 0, -0.01]}>
              <torusGeometry args={[r + 0.03, 0.025, 8, 64]} />
            </mesh>
          </group>
        )),
      )}
    </group>
  );
}

/** Shallow vaulted ceiling in woven rattan with ribbed bands and cove lines (ref 6). */
export function VaultCeiling({ z0, z1, hw, spring, rise }: { z0: number; z1: number; hw: number; spring: number; rise: number }) {
  const a = ambience();
  const len = Math.abs(z1 - z0);
  const zc = (z0 + z1) / 2;
  const geo = useMemo(() => new CylinderGeometry(hw, hw, len, 48, 1, true, -Math.PI / 2, Math.PI), [hw, len]);
  const ribs = [0.2, 0.4, 0.6, 0.8].map((f) => Math.min(z0, z1) + len * f);
  return (
    <group>
      <mesh geometry={geo} material={a.rattan} position={[0, spring, zc]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1, rise / hw]} />
      {ribs.map((z) => (
        <mesh key={z} position={[0, spring, z]} scale={[1, rise / hw, 1]} material={a.walnutVeneer}>
          <torusGeometry args={[hw - 0.03, 0.05, 8, 48, Math.PI]} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <Block key={s} x={s < 0 ? [-hw, -hw + 0.12] : [hw - 0.12, hw]} y={[spring - 0.06, spring - 0.05]} z={[Math.min(z0, z1), Math.max(z0, z1)]} material={a.cove} cast={false} />
      ))}
      <WallWash from={[0, spring - 0.1, zc]} to={[0, spring + rise, zc]} width={hw * 1.6} height={len * 0.9} intensity={5} color="#ffc489" />
    </group>
  );
}

/** Record library: walnut grid with face-out sleeves; selected cells become amber-backlit niches. */
export function ShelfWall({
  x,
  face,
  z0,
  z1,
  y0,
  y1,
  cols,
  rows,
  niche,
  strips = false,
  children,
}: {
  x: number;
  face: 1 | -1;
  z0: number;
  z1: number;
  y0: number;
  y1: number;
  cols: number;
  rows: number;
  /** (col, row) → true for backlit niche cells (children are placed by the caller) */
  niche?: (c: number, r: number) => boolean;
  /** LED strip under the front of every shelf (ref: backlit record grid) */
  strips?: boolean;
  children?: ReactNode;
}) {
  const a = ambience();
  const lo = Math.min(z0, z1);
  const hi = Math.max(z0, z1);
  const depth = 0.34;
  const xr = (d0: number, d1: number): [number, number] => {
    const p = x + face * d0;
    const q = x + face * d1;
    return [Math.min(p, q), Math.max(p, q)];
  };
  const cw = (hi - lo) / cols;
  const rh = (y1 - y0) / rows;
  const frame = useMemo<Box[]>(() => {
    const out: Box[] = [];
    const [f0, f1] = xr(0, depth);
    for (let c = 0; c <= cols; c++) out.push([f0, f1, y0, y1, lo + c * cw - 0.015, lo + c * cw + 0.015]);
    for (let r = 0; r <= rows; r++) out.push([f0, f1, y0 + r * rh - 0.015, y0 + r * rh + 0.015, lo, hi]);
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [x, face, lo, hi, y0, y1, cols, rows]);
  const nicheCells = useMemo(() => {
    const out: { z: number; y: number }[] = [];
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) if (niche?.(c, r)) out.push({ z: lo + (c + 0.5) * cw, y: y0 + r * rh });
    return out;
  }, [cols, rows, lo, cw, y0, rh, niche]);

  // sleeves: one face-out album per ordinary cell, muted palette (abstract colour fields)
  const sleeves = useRef<InstancedMesh>(null);
  const cells = useMemo(() => {
    const out: { z: number; y: number; tilt: number; colour: Color }[] = [];
    const palette = ['#7a2d22', '#c9b08a', '#1f2b3f', '#a3622f', '#2d3a2c', '#d8cdb6', '#4a1d16', '#8c7652', '#151515', '#b9442e'];
    let s = 7;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let c = 0; c < cols; c++)
      for (let row = 0; row < rows; row++) {
        if (niche?.(c, row)) continue;
        out.push({ z: lo + (c + 0.5) * cw, y: y0 + row * rh + 0.02, tilt: (r() - 0.5) * 0.12, colour: new Color(palette[Math.floor(r() * palette.length)]) });
      }
    return out;
  }, [cols, rows, lo, cw, y0, rh, niche]);
  const sleeveGeo = useMemo(() => new BoxGeometry(0.008, 1, 1), []);
  const size = Math.min(0.31, cw - 0.06, rh - 0.06);
  useLayoutEffect(() => {
    const mesh = sleeves.current;
    if (!mesh) return;
    const m = new Matrix4();
    const q = new Quaternion();
    const p = new Vector3();
    const sc = new Vector3(1, size, size);
    cells.forEach((cell, i) => {
      p.set(x + face * (depth - 0.06), cell.y + size / 2, cell.z);
      q.setFromAxisAngle(new Vector3(0, 0, 1), face * -0.08 + cell.tilt);
      mesh.setMatrixAt(i, m.compose(p, q, sc));
      mesh.setColorAt(i, cell.colour);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [cells, x, face, size]);

  return (
    <group>
      <Block x={xr(0, 0.02)} y={[y0, y1]} z={[lo, hi]} material={a.walnutVeneer} tile={1.2} aligned cast={false} />
      <InstancedBlocks boxes={frame} material={a.walnutVeneer} />
      {nicheCells.map((n) => (
        <group key={`${n.z}${n.y}`}>
          <Block x={xr(0.02, 0.03)} y={[n.y + 0.015, n.y + rh - 0.015]} z={[n.z - cw / 2 + 0.015, n.z + cw / 2 - 0.015]} material={a.nicheAmber} cast={false} />
          <Block x={xr(depth - 0.05, depth - 0.03)} y={[n.y + rh - 0.03, n.y + rh - 0.018]} z={[n.z - cw / 2 + 0.03, n.z + cw / 2 - 0.03]} material={a.cove} cast={false} />
        </group>
      ))}
      <instancedMesh ref={sleeves} args={[sleeveGeo, undefined, Math.max(1, cells.length)]} castShadow receiveShadow>
        <meshStandardMaterial roughness={0.6} />
      </instancedMesh>
      {strips &&
        Array.from({ length: rows }, (_, r) => (
          <Block
            key={`s${r}`}
            x={xr(depth - 0.05, depth - 0.03)}
            y={[y0 + (r + 1) * rh - 0.03, y0 + (r + 1) * rh - 0.018]}
            z={[lo + 0.02, hi - 0.02]}
            material={a.cove}
            cast={false}
          />
        ))}
      <WallWash from={[x + face * 0.9, y1 + 0.1, (lo + hi) / 2]} to={[x, (y0 + y1) / 2, (lo + hi) / 2]} width={hi - lo} height={0.4} intensity={11} />
      {children}
    </group>
  );
}

/** Globe floor lamp (opal sphere on a black column) with its own warm light. */
export function GlobeLamp({ position, light = true }: { position: V3; light?: boolean }) {
  const a = ambience();
  return (
    <group position={position}>
      <mesh material={a.fluted} position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.11, 1.1, 32]} />
      </mesh>
      <mesh material={a.opal} position={[0, 1.27, 0]}>
        <sphereGeometry args={[0.17, 40, 24]} />
      </mesh>
      {light && <pointLight position={[0, 1.27, 0]} color="#ffb877" intensity={2.6} distance={5.5} decay={2} />}
    </group>
  );
}

/** Mushroom table lamp: opal dome on a slim stem. */
export function DomeLamp({ position, light = true }: { position: V3; light?: boolean }) {
  const a = ambience();
  return (
    <group position={position}>
      <mesh material={a.fluted} position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.07, 0.08, 0.04, 32]} />
      </mesh>
      <mesh material={a.fluted} position={[0, 0.17, 0]}>
        <cylinderGeometry args={[0.012, 0.03, 0.3, 16]} />
      </mesh>
      <mesh material={a.opal} position={[0, 0.32, 0]}>
        <sphereGeometry args={[0.15, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      {light && <pointLight position={[0, 0.3, 0]} color="#ffbe80" intensity={1.4} distance={3.2} decay={2} />}
    </group>
  );
}

/** Brass picture light over an artwork slot. */
export function PictureLight({ position, width }: { position: V3; width: number }) {
  const a = ambience();
  return (
    <group position={position}>
      <Block x={[-width / 2, width / 2]} y={[-0.02, 0.02]} z={[0.08, 0.13]} material={a.brassReveal} />
      <Block x={[-width / 2 + 0.03, width / 2 - 0.03]} y={[-0.022, -0.018]} z={[0.09, 0.12]} material={a.cove} cast={false} />
      <Block x={[-0.012, 0.012]} y={[-0.01, 0.01]} z={[0, 0.09]} material={a.brassReveal} />
    </group>
  );
}

/**
 * ARTWORK SLOT (placeholder): framed dark canvas. Supply the client's chosen
 * artwork (image) later; the frame size is set here.
 */
export function ArtFrame({ position, rotationY = 0, w, h }: { position: V3; rotationY?: number; w: number; h: number }) {
  const a = ambience();
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Block x={[-w / 2 - 0.04, w / 2 + 0.04]} y={[-h / 2 - 0.04, h / 2 + 0.04]} z={[0, 0.05]} material={a.artFrame} />
      <mesh position={[0, 0, 0.056]} material={a.artCanvas}>
        <planeGeometry args={[w, h]} />
      </mesh>
      <PictureLight position={[0, h / 2 + 0.12, 0]} width={w * 0.6} />
    </group>
  );
}

/** Black fluted credenza with walnut top. Local front +z, base y=0. */
export function Credenza({ position, rotationY = 0, w = 2.6, d = 0.48, h = 0.58, material }: { position: V3; rotationY?: number; w?: number; d?: number; h?: number; material?: Material }) {
  const a = ambience();
  const body = material ?? a.fluted;
  const reeds = useMemo(() => slatRun('x', -w / 2 + 0.02, w / 2 - 0.02, 0.035, 0.024, { y: [0.1, h - 0.04], other: [d / 2, d / 2 + 0.018] }), [w, d, h]);
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Block x={[-w / 2 + 0.1, w / 2 - 0.1]} y={[0, 0.08]} z={[-d / 2 + 0.06, d / 2 - 0.06]} material={a.fluted} />
      <Block x={[-w / 2, w / 2]} y={[0.08, h - 0.04]} z={[-d / 2, d / 2]} material={body} />
      <InstancedBlocks boxes={reeds} material={body} />
      <Block x={[-w / 2 - 0.01, w / 2 + 0.01]} y={[h - 0.04, h]} z={[-d / 2 - 0.01, d / 2 + 0.03]} material={a.walnutVeneer} />
    </group>
  );
}

/** Tubular chrome lounge chair with black leather slings. Local front +z. */
export function TubularChair({ position, rotationY = 0 }: { position: V3; rotationY?: number }) {
  const a = ambience();
  const T = 0.013;
  const tube = (p: V3, len: number, rot: V3) => (
    <mesh key={p.join()} position={p} rotation={rot} material={a.chrome} castShadow>
      <cylinderGeometry args={[T, T, len, 12]} />
    </mesh>
  );
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {[-1, 1].map((s) => (
        <group key={s}>
          {tube([s * 0.33, 0.012, 0], 0.72, [Math.PI / 2, 0, 0])}
          {tube([s * 0.33, 0.33, 0.34], 0.66, [0, 0, 0])}
          {tube([s * 0.33, 0.4, -0.3], 0.8, [0.32, 0, 0])}
          {tube([s * 0.33, 0.58, 0.02], 0.66, [Math.PI / 2, 0, 0])}
        </group>
      ))}
      {tube([0, 0.36, 0.34], 0.66, [0, 0, Math.PI / 2])}
      <Block x={[-0.31, 0.31]} y={[0.36, 0.38]} z={[-0.3, 0.32]} material={a.blackLeather} />
      <group position={[0, 0.62, -0.3]} rotation={[-0.3, 0, 0]}>
        <Block x={[-0.31, 0.31]} y={[-0.16, 0.2]} z={[-0.01, 0.01]} material={a.blackLeather} />
      </group>
      {[-1, 1].map((s) => (
        <Block key={s} x={[s * 0.33 - 0.03, s * 0.33 + 0.03]} y={[0.57, 0.59]} z={[-0.2, 0.25]} material={a.blackLeather} />
      ))}
    </group>
  );
}

/** Round glass-top wire table (chrome rods). Base y=0. */
export function WireTable({ position, r = 0.45 }: { position: V3; r?: number }) {
  const a = ambience();
  const rods = 28;
  return (
    <group position={position}>
      {Array.from({ length: rods }, (_, i) => {
        const ang = (i / rods) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(ang) * r * 0.42, 0.21, Math.sin(ang) * r * 0.42]} rotation={[Math.sin(ang) * 0.5, 0, -Math.cos(ang) * 0.5]} material={a.chrome}>
            <cylinderGeometry args={[0.004, 0.004, 0.46, 6]} />
          </mesh>
        );
      })}
      <mesh position={[0, 0.41, 0]} rotation={[Math.PI / 2, 0, 0]} material={a.chrome}>
        <torusGeometry args={[r * 0.62, 0.008, 8, 48]} />
      </mesh>
      <mesh position={[0, 0.43, 0]} material={a.glassTop}>
        <cylinderGeometry args={[r, r, 0.015, 64]} />
      </mesh>
    </group>
  );
}

/** Channel-tufted navy velvet banquette. Local front +z. */
export function VelvetBanquette({ position, rotationY = 0, w = 3.2 }: { position: V3; rotationY?: number; w?: number }) {
  const a = ambience();
  const n = Math.round(w / 0.32);
  const cw = w / n;
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Block x={[-w / 2, w / 2]} y={[0, 0.12]} z={[-0.4, 0.38]} material={a.fluted} />
      <RoundedBox args={[w, 0.2, 0.7]} radius={0.06} smoothness={4} position={[0, 0.22, 0]} material={a.velvetNavy} castShadow receiveShadow />
      {Array.from({ length: n }, (_, i) => (
        <RoundedBox
          key={i}
          args={[cw - 0.01, 0.55, 0.2]}
          radius={0.08}
          smoothness={4}
          position={[-w / 2 + cw * (i + 0.5), 0.58, -0.3]}
          material={a.velvetNavy}
          castShadow
        />
      ))}
    </group>
  );
}

/** Green marble cube table (pair of offset cubes, ref 1). Base y=0. */
export function MarbleCubes({ position, s = 0.45 }: { position: V3; s?: number }) {
  const a = ambience();
  return (
    <group position={position}>
      <Block x={[-s, 0]} y={[0, s * 0.95]} z={[-s / 2, s / 2]} material={a.greenMarble} tile={1} aligned />
      <Block x={[0.02, s + 0.02]} y={[0, s * 0.85]} z={[-s / 2 + 0.06, s / 2 + 0.06]} material={a.greenMarble} tile={1} aligned />
    </group>
  );
}

export { AMBIENCE };
