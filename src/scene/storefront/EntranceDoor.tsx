import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import type { Group } from 'three';
import { TIMING } from '../../config/shots';
import { DERIVED, WORLD } from '../../config/world';
import { clamp01, easeInOutSine } from '../../lib/easing';
import { useExperience } from '../../state/useExperience';
import { Block } from '../Block';
import { FONTS } from '../fonts';
import { materials } from '../materials';

const e = WORLD.entrance;
const mu = WORLD.facade.mullion;
const T = WORLD.facade.transomHeight;
const OPEN_ANGLE = 1.78; // ~102°, swings inward (−z)

function Leaf() {
  const m = materials();
  const W = e.doorLeafWidth - 0.012;
  const H = e.doorHeight - 0.01;
  const stile = 0.085;
  const handleX = W - 0.15;
  const handle = (side: 1 | -1) => (
    <group key={side} position={[handleX, 1.08, side * 0.065]}>
      <mesh material={m.brass} castShadow>
        <cylinderGeometry args={[0.014, 0.014, 0.95, 20]} />
      </mesh>
      {[-0.36, 0.36].map((y) => (
        <mesh key={y} material={m.brass} position={[0, y, -side * 0.025]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.05, 12]} />
        </mesh>
      ))}
    </group>
  );
  return (
    <group position={[0.006, 0.006, 0]}>
      <Block x={[0, stile]} y={[0, H]} z={[-0.026, 0.026]} material={m.joinery} />
      <Block x={[W - stile, W]} y={[0, H]} z={[-0.026, 0.026]} material={m.joinery} />
      <Block x={[stile, W - stile]} y={[H - 0.1, H]} z={[-0.026, 0.026]} material={m.joinery} />
      <Block x={[stile, W - stile]} y={[0, 0.24]} z={[-0.026, 0.026]} material={m.joinery} />
      {/* brushed kick plate */}
      <Block x={[stile, W - stile]} y={[0.03, 0.2]} z={[0.026, 0.029]} material={m.brass} cast={false} />
      <Block x={[stile, W - stile]} y={[0.24, H - 0.1]} z={[-0.005, 0.005]} material={m.glass} cast={false} receive={false} />
      {handle(1)}
      {handle(-1)}
      {/* door vinyl — real opening information from hifonix.co.uk */}
      <group position={[W / 2 - 0.06, 1.5, 0.007]}>
        <Text font={FONTS.sans} fontSize={0.03} letterSpacing={0.18} anchorX="center" color="#efe8da" fillOpacity={0.85}>
          MONDAY – SATURDAY
        </Text>
        <Text font={FONTS.sans} fontSize={0.03} letterSpacing={0.18} anchorX="center" position={[0, -0.05, 0]} color="#efe8da" fillOpacity={0.85}>
          10AM – 6PM
        </Text>
        <Text font={FONTS.display} fontSize={0.034} letterSpacing={0.04} anchorX="center" position={[0, -0.12, 0]} color="#d9c39a" fillOpacity={0.9}>
          Demonstrations by appointment
        </Text>
      </group>
    </group>
  );
}

export function EntranceDoor() {
  const m = materials();
  const hw = DERIVED.entranceHalfW;
  const dz = DERIVED.doorZ;
  const dh = e.doorLeafWidth / 2;
  const leafRef = useRef<Group>(null);
  const doorOpen = useExperience((s) => s.doorOpen);
  const reducedMotion = useExperience((s) => s.reducedMotion);
  const anim = useRef({ from: 0, to: 0, start: 0, current: 0, pending: true });

  useEffect(() => {
    const a = anim.current;
    a.from = a.current;
    a.to = doorOpen ? OPEN_ANGLE : 0;
    a.pending = true;
  }, [doorOpen]);

  useFrame(({ clock }) => {
    const a = anim.current;
    const leaf = leafRef.current;
    if (!leaf) return;
    if (a.pending) {
      a.start = clock.elapsedTime + (doorOpen ? TIMING.doorOpenDelay : 0.35);
      a.pending = false;
    }
    if (reducedMotion) {
      a.current = a.to;
    } else {
      const dur = doorOpen ? TIMING.doorOpen : TIMING.doorOpen * 1.3;
      const t = clamp01((clock.elapsedTime - a.start) / dur);
      a.current = a.from + (a.to - a.from) * easeInOutSine(t);
    }
    leaf.rotation.y = a.current;
  });

  const z: [number, number] = [dz - 0.05, dz + 0.05];
  return (
    <group name="entrance-door">
      {/* side lights */}
      {([-1, 1] as const).map((s) => {
        const outer = s * hw;
        const inner = s * dh;
        const x: [number, number] = [Math.min(outer, inner), Math.max(outer, inner)];
        return (
          <group key={s}>
            <Block x={x} y={[0, 0.24]} z={z} material={m.joinery} />
            <Block x={[x[0] + 0.01, x[1] - 0.01]} y={[0.24, e.doorHeight]} z={[dz - 0.005, dz + 0.005]} material={m.glass} cast={false} receive={false} />
            {/* door post */}
            <Block x={s < 0 ? [inner - mu, inner] : [inner, inner + mu]} y={[0, T]} z={z} material={m.joinery} />
          </group>
        );
      })}
      <Block x={[-hw, hw]} y={[e.doorHeight, T]} z={z} material={m.joinery} />
      {/* hinged leaf — pivot on the left post */}
      <group ref={leafRef} position={[-dh, 0, dz]}>
        <Leaf />
      </group>
    </group>
  );
}
