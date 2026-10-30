import { BoxGeometry, PlaneGeometry } from 'three';

/**
 * Geometry with UVs in world units so one shared material/texture tiles at a
 * consistent physical scale on every mesh (tile = metres per texture repeat).
 */
const boxCache = new Map<string, BoxGeometry>();
const planeCache = new Map<string, PlaneGeometry>();

export function worldBox(w: number, h: number, d: number, tile = 1): BoxGeometry {
  const key = `${w}|${h}|${d}|${tile}`;
  const hit = boxCache.get(key);
  if (hit) return hit;
  const g = new BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  // Face order: +x, -x, +y, -y, +z, -z (4 verts each)
  const dims: [number, number][] = [
    [d, h],
    [d, h],
    [w, d],
    [w, d],
    [w, h],
    [w, h],
  ];
  for (let f = 0; f < 6; f++) {
    const [su, sv] = dims[f];
    for (let v = 0; v < 4; v++) {
      const i = f * 4 + v;
      uv.setXY(i, (uv.getX(i) * su) / tile, (uv.getY(i) * sv) / tile);
    }
  }
  uv.needsUpdate = true;
  boxCache.set(key, g);
  return g;
}

export function worldPlane(w: number, h: number, tile = 1): PlaneGeometry {
  const key = `${w}|${h}|${tile}`;
  const hit = planeCache.get(key);
  if (hit) return hit;
  const g = new PlaneGeometry(w, h);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * w) / tile, (uv.getY(i) * h) / tile);
  uv.needsUpdate = true;
  planeCache.set(key, g);
  return g;
}

/**
 * Box whose UVs are derived from world position (x/y/z ÷ tile), so adjacent
 * blocks of the same material (e.g. brickwork around window openings) tile
 * seamlessly with continuous coursing.
 */
export function alignedBox(
  x: readonly [number, number],
  y: readonly [number, number],
  z: readonly [number, number],
  tile: number,
): BoxGeometry {
  const w = x[1] - x[0];
  const h = y[1] - y[0];
  const d = z[1] - z[0];
  const g = new BoxGeometry(w, h, d);
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  const cx = (x[0] + x[1]) / 2;
  const cy = (y[0] + y[1]) / 2;
  const cz = (z[0] + z[1]) / 2;
  for (let f = 0; f < 6; f++) {
    for (let v = 0; v < 4; v++) {
      const i = f * 4 + v;
      const px = pos.getX(i) + cx;
      const py = pos.getY(i) + cy;
      const pz = pos.getZ(i) + cz;
      if (f < 2) uv.setXY(i, pz / tile, py / tile);
      else if (f < 4) uv.setXY(i, px / tile, pz / tile);
      else uv.setXY(i, px / tile, py / tile);
    }
  }
  uv.needsUpdate = true;
  return g;
}
