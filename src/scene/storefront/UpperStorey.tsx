import { useMemo } from 'react';
import { PlaneGeometry } from 'three';
import { DERIVED } from '../../config/world';
import { Block } from '../Block';
import { materials } from '../materials';

/**
 * Upper storey: a calm mass of hand-trowelled lime plaster, set back behind
 * the limestone portal. A single recessed opening holds a brushed-bronze
 * geometric lattice (contemporary mashrabiya), softly backlit — privacy,
 * shade and pattern in the regional tradition, rendered with restraint.
 */
const PLASTER_TILE = 2;
const SCREEN_HW = 2.6;
const SCREEN_Y0_OFFSET = 0.62; // above the portal coping
const SCREEN_H = 2.7;
const LATTICE_TILE = 0.3;
const Z: [number, number] = [-0.35, 0];

function useLatticePlane() {
  return useMemo(() => {
    const g = new PlaneGeometry(SCREEN_HW * 2, SCREEN_H);
    const uv = g.attributes.uv;
    const pos = g.attributes.position;
    // tile-unit UVs centred on the opening so the pattern is symmetrical
    for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / LATTICE_TILE + 0.5, pos.getY(i) / LATTICE_TILE + 0.5);
    uv.needsUpdate = true;
    return g;
  }, []);
}

export function UpperStorey() {
  const m = materials();
  const lattice = useLatticePlane();
  const dimGlow = useMemo(() => {
    const g = m.glowPanel.clone();
    g.emissiveIntensity = 0.16;
    return g;
  }, [m.glowPanel]);
  const { halfW, corniceTop, buildingTop } = DERIVED;
  const y0 = corniceTop + SCREEN_Y0_OFFSET;
  const y1 = y0 + SCREEN_H;
  const fr = 0.045;
  return (
    <group name="upper-storey">
      {/* plaster mass around the screen opening (world-aligned UVs → seamless) */}
      <Block x={[-halfW, halfW]} y={[corniceTop, y0]} z={Z} material={m.limePlaster} tile={PLASTER_TILE} aligned />
      <Block x={[-halfW, -SCREEN_HW]} y={[y0, y1]} z={Z} material={m.limePlaster} tile={PLASTER_TILE} aligned />
      <Block x={[SCREEN_HW, halfW]} y={[y0, y1]} z={Z} material={m.limePlaster} tile={PLASTER_TILE} aligned />
      <Block x={[-halfW, halfW]} y={[y1, buildingTop]} z={Z} material={m.limePlaster} tile={PLASTER_TILE} aligned />

      {/* recessed screen: warm backlight, lattice, slim bronze frame */}
      <Block x={[-SCREEN_HW, SCREEN_HW]} y={[y0, y1]} z={[-0.36, -0.33]} material={dimGlow} cast={false} />
      <mesh geometry={lattice} material={m.bronzeLattice} position={[0, (y0 + y1) / 2, -0.12]} castShadow />
      <Block x={[-SCREEN_HW, SCREEN_HW]} y={[y0, y0 + fr]} z={[-0.14, -0.08]} material={m.bronze} />
      <Block x={[-SCREEN_HW, SCREEN_HW]} y={[y1 - fr, y1]} z={[-0.14, -0.08]} material={m.bronze} />
      <Block x={[-SCREEN_HW, -SCREEN_HW + fr]} y={[y0, y1]} z={[-0.14, -0.08]} material={m.bronze} />
      <Block x={[SCREEN_HW - fr, SCREEN_HW]} y={[y0, y1]} z={[-0.14, -0.08]} material={m.bronze} />
      {/* deep sill casting a soft shadow line */}
      <Block x={[-SCREEN_HW - 0.04, SCREEN_HW + 0.04]} y={[y0 - 0.05, y0]} z={[-0.33, 0.06]} material={m.limestone} tile={1.2} />

      {/* bronze coping at the parapet */}
      <Block x={[-halfW - 0.02, halfW + 0.02]} y={[buildingTop, buildingTop + 0.03]} z={[-0.38, 0.02]} material={m.bronze} />
      {/* roof mass so the parapet reads as a real building edge */}
      <Block x={[-halfW, halfW]} y={[buildingTop - 0.2, buildingTop + 1.2]} z={[-6, -0.6]} material={m.neighbour} cast={false} />
    </group>
  );
}

export const UPPER_CONST = { SCREEN_HW, SCREEN_H, SCREEN_Y0_OFFSET };
