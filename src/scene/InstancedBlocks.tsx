import { useLayoutEffect, useMemo, useRef } from 'react';
import { BoxGeometry, type InstancedMesh, type Material, Matrix4, Quaternion, Vector3 } from 'three';

export type Box = readonly [x0: number, x1: number, y0: number, y1: number, z0: number, z1: number];

/**
 * Many identical-material boxes (timber slats, lattice bars) in one draw call.
 * Boxes are min/max bounds, same convention as <Block>.
 */
export function InstancedBlocks({ boxes, material, cast = true }: { boxes: Box[]; material: Material; cast?: boolean }) {
  const ref = useRef<InstancedMesh>(null);
  const geometry = useMemo(() => new BoxGeometry(1, 1, 1), []);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new Matrix4();
    const q = new Quaternion();
    const p = new Vector3();
    const s = new Vector3();
    boxes.forEach(([x0, x1, y0, y1, z0, z1], i) => {
      p.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
      s.set(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0));
      mesh.setMatrixAt(i, m.compose(p, q, s));
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [boxes]);
  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, boxes.length]}
      castShadow={cast}
      receiveShadow
      frustumCulled={false}
    />
  );
}

/** Evenly spaced slats filling [from, to] along one axis. */
export function slatRun(
  axis: 'x' | 'z',
  from: number,
  to: number,
  pitch: number,
  width: number,
  fixed: { y: readonly [number, number]; other: readonly [number, number] },
): Box[] {
  const n = Math.max(1, Math.floor((to - from) / pitch));
  const gap = (to - from - n * pitch) / 2;
  const out: Box[] = [];
  for (let i = 0; i < n; i++) {
    const c = from + gap + pitch * (i + 0.5);
    const a = c - width / 2;
    const b = c + width / 2;
    out.push(
      axis === 'x'
        ? [a, b, fixed.y[0], fixed.y[1], fixed.other[0], fixed.other[1]]
        : [fixed.other[0], fixed.other[1], fixed.y[0], fixed.y[1], a, b],
    );
  }
  return out;
}
