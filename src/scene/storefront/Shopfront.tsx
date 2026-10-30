import { Text } from '@react-three/drei';
import { useMemo } from 'react';
import { ExtrudeGeometry, Shape, ShapeGeometry } from 'three';
import { DERIVED, WORLD } from '../../config/world';
import { Block } from '../Block';
import { FONTS } from '../fonts';
import { type Box, InstancedBlocks, slatRun } from '../InstancedBlocks';
import { materials } from '../materials';

/**
 * Ground floor: a deep honed-limestone portal framing a wall of frameless
 * glazing, lined with oak slat reveals. The entrance is a slender bronze
 * arch whose tympanum is a backlit geometric lattice — the one quiet regional
 * gesture, contemporary rather than ornamental.
 */
const f = WORLD.facade;
const e = WORLD.entrance;
const mu = f.mullion;
const SILL = f.stallRiserHeight;
const GLASS_FROM = SILL + 0.08;
const T = f.transomHeight;
const H = f.shopfrontHeight;
const P = f.pilasterDepth; // portal front face (z)
const STONE_TILE = 1.2;

const ARCH_RI = e.width / 2; // clear opening half-width
const ARCH_RO = ARCH_RI + 0.075; // bronze band
const BAY_FROM = ARCH_RO + 0.05;

/** Display-window bay: limestone plinth, hairline black frame, one mid mullion. */
function Bay({ xa, xb }: { xa: number; xb: number }) {
  const m = materials();
  const lo = Math.min(xa, xb);
  const hi = Math.max(xa, xb);
  const mid = (lo + hi) / 2;
  const z: [number, number] = [-0.035, 0.035];
  return (
    <group>
      <Block x={[lo, hi]} y={[0, SILL]} z={[-0.12, 0.1]} material={m.limestone} tile={STONE_TILE} aligned />
      <Block x={[lo, hi]} y={[SILL, GLASS_FROM]} z={z} material={m.joinery} />
      <Block x={[lo, lo + mu]} y={[GLASS_FROM, H]} z={z} material={m.joinery} />
      <Block x={[hi - mu, hi]} y={[GLASS_FROM, H]} z={z} material={m.joinery} />
      <Block x={[lo, hi]} y={[H - mu, H]} z={z} material={m.joinery} />
      <Block x={[mid - mu / 2, mid + mu / 2]} y={[GLASS_FROM, H]} z={[-0.03, 0.03]} material={m.joinery} />
      <Block x={[lo + mu, hi - mu]} y={[GLASS_FROM, H - mu]} z={[-0.006, 0.006]} material={m.glass} cast={false} receive={false} />
      {/* interior window bed (display platform) */}
      <Block x={[lo, hi]} y={[0, GLASS_FROM]} z={[-1.15, -0.12]} material={m.oak} tile={1.8} />
    </group>
  );
}

function useArchGeometry() {
  return useMemo(() => {
    const band = new Shape();
    band.moveTo(-ARCH_RO, 0);
    band.lineTo(-ARCH_RO, T);
    band.absarc(0, T, ARCH_RO, Math.PI, 0, true);
    band.lineTo(ARCH_RO, 0);
    band.lineTo(ARCH_RI, 0);
    band.lineTo(ARCH_RI, T);
    band.absarc(0, T, ARCH_RI, 0, Math.PI, false);
    band.lineTo(-ARCH_RI, 0);
    band.closePath();
    const frame = new ExtrudeGeometry(band, { depth: 0.1, bevelEnabled: false, curveSegments: 48 });
    frame.translate(0, 0, -0.04);

    const half = new Shape();
    half.moveTo(-ARCH_RI, T);
    half.absarc(0, T, ARCH_RI, Math.PI, 0, true);
    half.lineTo(-ARCH_RI, T);
    const tympanum = new ShapeGeometry(half, 48);
    // centre the lattice on the arch: UV = (x, y - T) / tile + 0.5
    const uv = tympanum.attributes.uv;
    const pos = tympanum.attributes.position;
    const tile = 0.27;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / tile + 0.5, (pos.getY(i) - T) / tile + 0.5);
    uv.needsUpdate = true;
    return { frame, tympanum };
  }, []);
}

/** Bronze arch, backlit lattice tympanum, oak slats in the spandrels. */
function ArchEntrance() {
  const m = materials();
  const { frame, tympanum } = useArchGeometry();
  const spandrel = useMemo<Box[]>(
    () => slatRun('x', -BAY_FROM, BAY_FROM, 0.07, 0.04, { y: [T, H], other: [-0.1, -0.06] }),
    [],
  );
  return (
    <group name="arch-entrance">
      <mesh geometry={frame} material={m.bronze} castShadow receiveShadow />
      <mesh geometry={tympanum} material={m.bronzeLattice} position={[0, 0, 0.01]} castShadow />
      <mesh geometry={tympanum} material={m.glowPanel} position={[0, 0, -0.045]} />
      <InstancedBlocks boxes={spandrel} material={m.oakSlat} />
      <Block x={[-BAY_FROM, BAY_FROM]} y={[T, H]} z={[-0.13, -0.1]} material={m.joinery} cast={false} />
      {/* posts closing the gap between arch band and the glazing bays */}
      {([-1, 1] as const).map((s) => (
        <Block
          key={s}
          x={s < 0 ? [-BAY_FROM, -ARCH_RO] : [ARCH_RO, BAY_FROM]}
          y={[0, H]}
          z={[-0.04, 0.04]}
          material={m.joinery}
        />
      ))}
    </group>
  );
}

/** Recessed entrance lobby: limestone floor, frameless glass returns, oak slat soffit. */
function Lobby() {
  const m = materials();
  const hw = DERIVED.entranceHalfW;
  const dz = DERIVED.doorZ;
  const soffit = useMemo<Box[]>(() => slatRun('x', -hw, hw, 0.07, 0.04, { y: [T, T + 0.04], other: [dz, 0] }), [hw, dz]);
  const returnSide = (s: 1 | -1) => {
    const x0 = s * hw;
    const x1 = s * (hw + 0.05);
    const xr: [number, number] = [Math.min(x0, x1), Math.max(x0, x1)];
    return (
      <group key={s}>
        <Block x={xr} y={[0, SILL]} z={[dz, 0]} material={m.limestone} tile={STONE_TILE} aligned />
        <Block x={xr} y={[SILL, GLASS_FROM]} z={[dz, 0]} material={m.joinery} />
        <Block x={xr} y={[GLASS_FROM, T]} z={[dz, dz + mu]} material={m.joinery} />
        <Block x={[xr[0] + 0.02, xr[1] - 0.02]} y={[GLASS_FROM, T]} z={[dz + mu, -0.04]} material={m.glass} cast={false} receive={false} />
        <Block x={xr} y={[T, H]} z={[dz - 0.1, -0.04]} material={m.plaster} />
      </group>
    );
  };
  return (
    <group>
      <Block x={[-hw, hw]} y={[0, 0.018]} z={[dz, 0]} material={m.limestone} tile={STONE_TILE} cast={false} aligned />
      <Block x={[-hw, hw]} y={[0, 0.022]} z={[-0.02, 0.05]} material={m.bronze} cast={false} />
      {returnSide(-1)}
      {returnSide(1)}
      <InstancedBlocks boxes={soffit} material={m.oakSlat} cast={false} />
      <Block x={[-hw, hw]} y={[T + 0.04, T + 0.08]} z={[dz, 0]} material={m.joinery} cast={false} />
      <mesh position={[0, T - 0.002, dz / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.05, 32]} />
        <primitive object={m.lampGlow} attach="material" />
      </mesh>
      {/* inside bulkhead above the door plane */}
      <Block x={[-hw, hw]} y={[T, H]} z={[dz - 0.1, dz - 0.05]} material={m.plaster} />
    </group>
  );
}

/** Deep limestone portal: jambs, header (signage band), oak-lined reveals and soffit. */
function Portal() {
  const m = materials();
  const { halfW, shopHalfW, fasciaTop } = DERIVED;
  const slats = useMemo<Box[]>(() => {
    const soffit = slatRun('x', -shopHalfW, shopHalfW, 0.075, 0.038, { y: [H - 0.05, H], other: [0.02, P - 0.03] });
    const reveal = (s: 1 | -1) =>
      slatRun('z', 0.04, P - 0.03, 0.075, 0.038, {
        y: [0.06, H - 0.05],
        other: s < 0 ? [-shopHalfW, -shopHalfW + 0.035] : [shopHalfW - 0.035, shopHalfW],
      });
    return [...soffit, ...reveal(-1), ...reveal(1)];
  }, [shopHalfW]);

  const jamb = (s: 1 | -1) => {
    const a = s * halfW;
    const b = s * shopHalfW;
    const x: [number, number] = [Math.min(a, b), Math.max(a, b)];
    return <Block key={s} x={x} y={[0, fasciaTop]} z={[-0.35, P]} material={m.limestone} tile={STONE_TILE} aligned />;
  };

  return (
    <group name="portal">
      {jamb(-1)}
      {jamb(1)}
      <Block x={[-shopHalfW, shopHalfW]} y={[H, fasciaTop]} z={[-0.35, P]} material={m.limestone} tile={STONE_TILE} aligned />
      {/* bronze coping + light trough under the signage */}
      <Block x={[-halfW - 0.02, halfW + 0.02]} y={[fasciaTop, fasciaTop + f.corniceHeight]} z={[-0.35, P + 0.02]} material={m.bronze} />
      <Block x={[-shopHalfW, shopHalfW]} y={[H, H + 0.045]} z={[P, P + 0.1]} material={m.bronze} />
      {/* portal floor: limestone threshold slab */}
      <Block x={[-shopHalfW, shopHalfW]} y={[0, 0.04]} z={[0, P]} material={m.limestone} tile={STONE_TILE} aligned cast={false} />
      {/* oak lining + dark backing so slat gaps read as shadow */}
      <InstancedBlocks boxes={slats} material={m.oakSlat} />
      <Block x={[-shopHalfW, shopHalfW]} y={[H - 0.003, H]} z={[0, P]} material={m.joinery} cast={false} />
      {([-1, 1] as const).map((s) => (
        <Block
          key={s}
          x={s < 0 ? [-shopHalfW, -shopHalfW + 0.004] : [shopHalfW - 0.004, shopHalfW]}
          y={[0.04, H]}
          z={[0, P]}
          material={m.joinery}
          cast={false}
        />
      ))}
      {/* concealed LED line washing the head of the glazing */}
      <Block x={[-shopHalfW + 0.05, shopHalfW - 0.05]} y={[H - 0.06, H - 0.05]} z={[0.05, 0.07]} material={m.ledLine} cast={false} />
      {/* street number, bronze, on the right jamb */}
      <Text
        font={FONTS.display}
        fontSize={0.16}
        letterSpacing={0.14}
        position={[(halfW + shopHalfW) / 2, 1.62, P + 0.004]}
        anchorX="center"
        anchorY="middle"
        material={m.bronze}
      >
        396
      </Text>
    </group>
  );
}

export function Shopfront() {
  const { shopHalfW } = DERIVED;
  return (
    <group name="shopfront">
      <Portal />
      <Bay xa={-shopHalfW} xb={-BAY_FROM} />
      <Bay xa={BAY_FROM} xb={shopHalfW} />
      <ArchEntrance />
      <Lobby />
    </group>
  );
}

export const SHOPFRONT_CONST = { mu, SILL, GLASS_FROM, T, H, P, doorHeight: e.doorHeight };
