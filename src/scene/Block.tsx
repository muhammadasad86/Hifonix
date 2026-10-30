import type { Material } from 'three';
import { useMemo } from 'react';
import { alignedBox, worldBox } from './geometry';

type Range = readonly [number, number];

interface BlockProps {
  x: Range;
  y: Range;
  z: Range;
  material: Material;
  /** Texture tile size in metres (world-space UVs). */
  tile?: number;
  cast?: boolean;
  receive?: boolean;
  name?: string;
  /** World-anchored UVs: continuous texture across neighbouring blocks. */
  aligned?: boolean;
}

/**
 * Axis-aligned box defined by min/max bounds. Architectural blockout primitive:
 * reads like a drawing (x from → to) and keeps every edge on the WORLD grid.
 */
export function Block({ x, y, z, material, tile = 1, cast = true, receive = true, name, aligned = false }: BlockProps) {
  const w = Math.abs(x[1] - x[0]);
  const h = Math.abs(y[1] - y[0]);
  const d = Math.abs(z[1] - z[0]);
  const geometry = useMemo(
    () => (aligned ? alignedBox(x, y, z, tile) : worldBox(+w.toFixed(4), +h.toFixed(4), +d.toFixed(4), tile)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [aligned, x[0], x[1], y[0], y[1], z[0], z[1], tile],
  );
  return (
    <mesh
      name={name}
      geometry={geometry}
      material={material}
      position={[(x[0] + x[1]) / 2, (y[0] + y[1]) / 2, (z[0] + z[1]) / 2]}
      castShadow={cast}
      receiveShadow={receive}
    />
  );
}
