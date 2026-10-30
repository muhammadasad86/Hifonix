import type { Material } from 'three';
import { Block } from '../scene/Block';
import { materials } from '../scene/materials';
import { worldPlane } from '../scene/geometry';
import { ROOMS } from './journey';
import { ambience } from './ambience';

/**
 * Cross wall with a contemporary rectangular portal: square-cut opening with a
 * full oak lining (soffit + jambs), a slim dark shadow-gap at the reveal edge
 * and a concealed light line in the soffit. Deliberately un-ornamental — no
 * arches, domes or lattices. Front face at z, thickness into −z.
 */
export function PortalWall({
  z,
  hw,
  h,
  material,
  w = ROOMS.portal.w,
  ph = ROOMS.portal.h,
  depth = ROOMS.wall,
  lining,
}: {
  z: number;
  hw: number;
  h: number;
  material: Material;
  w?: number;
  ph?: number;
  depth?: number;
  lining?: Material;
}) {
  const a = ambience();
  const ow = w / 2;
  const zz: [number, number] = [z - depth, z];
  const line = lining ?? a.oak;
  const lt = 0.03; // lining thickness
  return (
    <group>
      <Block x={[-hw, -ow]} y={[0, h]} z={zz} material={material} tile={1.2} aligned />
      <Block x={[ow, hw]} y={[0, h]} z={zz} material={material} tile={1.2} aligned />
      <Block x={[-ow, ow]} y={[ph, h]} z={zz} material={material} tile={1.2} aligned />
      {/* oak lining: jambs + soffit, set just proud of the wall faces */}
      <Block x={[-ow, -ow + lt]} y={[0, ph]} z={[zz[0] - 0.01, zz[1] + 0.01]} material={line} />
      <Block x={[ow - lt, ow]} y={[0, ph]} z={[zz[0] - 0.01, zz[1] + 0.01]} material={line} />
      <Block x={[-ow, ow]} y={[ph - lt, ph]} z={[zz[0] - 0.01, zz[1] + 0.01]} material={line} />
      {/* shadow-gap reveal around the face of the opening */}
      <Block x={[-ow - 0.012, -ow]} y={[0, ph + 0.012]} z={[z - 0.004, z + 0.002]} material={a.oakDark} cast={false} />
      <Block x={[ow, ow + 0.012]} y={[0, ph + 0.012]} z={[z - 0.004, z + 0.002]} material={a.oakDark} cast={false} />
      <Block x={[-ow - 0.012, ow + 0.012]} y={[ph, ph + 0.012]} z={[z - 0.004, z + 0.002]} material={a.oakDark} cast={false} />
      {/* concealed light line in the soffit */}
      <Block x={[-ow + 0.08, ow - 0.08]} y={[ph - lt - 0.006, ph - lt]} z={[zz[0] + 0.12, zz[1] - 0.12]} material={a.cove} cast={false} />
    </group>
  );
}

/** Room shell: floor, ceiling, side walls (front/back walls are separate cross walls). */
export function RoomShell({
  z0,
  z1,
  hw,
  h,
  wall,
  floor,
  floorTile = 1.8,
  ceiling,
}: {
  z0: number;
  z1: number;
  hw: number;
  h: number;
  wall: Material;
  floor: Material;
  floorTile?: number;
  ceiling?: Material;
}) {
  const m = materials();
  const d = Math.abs(z1 - z0);
  const t = ROOMS.wall;
  return (
    <group>
      <mesh
        geometry={worldPlane(hw * 2, d, floorTile)}
        material={floor}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, (z0 + z1) / 2]}
        receiveShadow
      />
      <Block x={[-hw - t, -hw]} y={[0, h]} z={[z1, z0]} material={wall} tile={2} aligned />
      <Block x={[hw, hw + t]} y={[0, h]} z={[z1, z0]} material={wall} tile={2} aligned />
      <Block x={[-hw - t, hw + t]} y={[h, h + t]} z={[z1 - t, z0 + t]} material={ceiling ?? m.ceiling} cast={false} />
      {/* shadow-gap skirting */}
      <Block x={[-hw, -hw + 0.015]} y={[0, 0.08]} z={[z1, z0]} material={m.joinery} cast={false} />
      <Block x={[hw - 0.015, hw]} y={[0, 0.08]} z={[z1, z0]} material={m.joinery} cast={false} />
    </group>
  );
}
