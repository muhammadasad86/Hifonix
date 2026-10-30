import { Text } from '@react-three/drei';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { MeshStandardMaterial, type SpotLight } from 'three';
import { WORLD } from '../../config/world';
import { Block } from '../Block';
import { FONTS } from '../fonts';
import { worldPlane } from '../geometry';
import { materials } from '../materials';

/**
 * MILESTONE 1 PLACEHOLDER INTERIOR
 * A neutral, warm-lit shell that proves the entry transition lands in a
 * coherent space. Architecture, finishes and product displays are replaced
 * in Milestone 2 from the supplied interior references (ASSETS.interiorShell).
 */
const R = WORLD.interior;
const HW = R.width / 2;
const D = R.depth;
const H = R.height;

function AimedSpot({
  position,
  target,
  intensity,
  angle = 0.5,
  shadow = false,
}: {
  position: [number, number, number];
  target: [number, number, number];
  intensity: number;
  angle?: number;
  shadow?: boolean;
}) {
  const ref = useRef<SpotLight>(null);
  useLayoutEffect(() => {
    ref.current?.target.position.set(...target);
    ref.current?.target.updateMatrixWorld();
  }, [target]);
  return (
    <spotLight
      ref={ref}
      position={position}
      color="#ffd2a1"
      intensity={intensity}
      angle={angle}
      penumbra={0.8}
      distance={9}
      decay={2}
      castShadow={shadow}
      shadow-mapSize={[1024, 1024]}
      shadow-bias={-0.0004}
      shadow-normalBias={0.02}
    />
  );
}

function ZoneLabel({ x, title }: { x: number; title: string }) {
  return (
    <group position={[x, 2.55, -D + 0.02]}>
      <Text font={FONTS.display} fontSize={0.3} letterSpacing={0.16} anchorX="center" color="#3a3129">
        {title}
      </Text>
      <Text font={FONTS.sans} fontSize={0.055} letterSpacing={0.24} anchorX="center" position={[0, -0.28, 0]} color="#7a6d60">
        PLACEHOLDER · AWAITING INTERIOR REFERENCES
      </Text>
    </group>
  );
}

function SpeakerBlockout({ x, z }: { x: number; z: number }) {
  const m = materials();
  return (
    <group>
      <Block x={[x - 0.15, x + 0.15]} y={[0, 0.04]} z={[z - 0.24, z + 0.24]} material={m.placeholderDark} />
      <Block x={[x - 0.13, x + 0.13]} y={[0.04, 1.12]} z={[z - 0.2, z + 0.2]} material={m.placeholderDark} />
      {[0.88, 0.62, 0.36].map((y, i) => (
        <mesh key={y} position={[x, y, z + 0.201]} material={m.placeholder}>
          <circleGeometry args={[i === 0 ? 0.035 : 0.075, 32]} />
        </mesh>
      ))}
    </group>
  );
}

function HeadphoneStand({ x, z, y }: { x: number; z: number; y: number }) {
  const m = materials();
  return (
    <group position={[x, y, z]}>
      <mesh material={m.brass} position={[0, 0.01, 0]} castShadow>
        <cylinderGeometry args={[0.065, 0.07, 0.02, 32]} />
      </mesh>
      <mesh material={m.brass} position={[0, 0.17, 0]} castShadow>
        <cylinderGeometry args={[0.007, 0.007, 0.3, 12]} />
      </mesh>
      <mesh material={m.placeholderDark} position={[0, 0.33, 0]} castShadow>
        <torusGeometry args={[0.095, 0.014, 12, 40, Math.PI]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} material={m.placeholderDark} position={[s * 0.1, 0.26, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.04, 28]} />
        </mesh>
      ))}
    </group>
  );
}

export function PlaceholderInterior({ shadows }: { shadows: boolean }) {
  const m = materials();
  const rug = useMemo(() => new MeshStandardMaterial({ color: '#4a3c32', roughness: 1 }), []);
  const stoneTop = useMemo(() => new MeshStandardMaterial({ color: '#d9d3c7', roughness: 0.3 }), []);
  return (
    <group name="interior-placeholder">
      {/* shell */}
      <mesh
        geometry={worldPlane(R.width, D, 1.8)}
        material={m.oak}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.004, -D / 2]}
        receiveShadow
      />
      <Block x={[-HW - 0.12, -HW]} y={[0, H]} z={[-D, -0.35]} material={m.plaster} />
      <Block x={[HW, HW + 0.12]} y={[0, H]} z={[-D, -0.35]} material={m.plaster} />
      <Block x={[-HW, HW]} y={[0, H]} z={[-D - 0.12, -D]} material={m.plaster} />
      <Block x={[-HW - 0.12, HW + 0.12]} y={[H, H + 0.12]} z={[-D - 0.12, -0.02]} material={m.ceiling} cast={false} />
      {/* skirting */}
      <Block x={[-HW, -HW + 0.02]} y={[0, 0.12]} z={[-D, -0.35]} material={m.joinery} cast={false} />
      <Block x={[HW - 0.02, HW]} y={[0, 0.12]} z={[-D, -0.35]} material={m.joinery} cast={false} />

      {/* recessed downlight discs */}
      {[-2.6, 0, 2.6].flatMap((x) =>
        [-2.4, -5.2, -8, -10.8].map((z) => (
          <mesh key={`${x}${z}`} position={[x, H - 0.003, z]} rotation={[Math.PI / 2, 0, 0]} material={m.lampGlow}>
            <circleGeometry args={[0.045, 24]} />
          </mesh>
        )),
      )}

      {/* LEFT — Hi-Fi zone blockout */}
      <mesh geometry={worldPlane(3.2, 3.6, 1)} material={rug} rotation={[-Math.PI / 2, 0, 0]} position={[-2.6, 0.01, -8]} receiveShadow />
      <SpeakerBlockout x={-3.7} z={-9} />
      <SpeakerBlockout x={-1.5} z={-9} />
      <Block x={[-3.05, -2.15]} y={[0, 0.42]} z={[-9.35, -8.85]} material={m.oak} tile={1.8} />
      <Block x={[-2.82, -2.38]} y={[0.42, 0.52]} z={[-9.3, -8.95]} material={m.placeholderDark} />
      <Block x={[-2.82, -2.38]} y={[0.53, 0.62]} z={[-9.3, -8.95]} material={m.placeholder} />
      <ZoneLabel x={-2.6} title="Hi-Fi" />

      {/* RIGHT — Head-Fi zone blockout */}
      <Block x={[1.5, 3.9]} y={[0, 0.9]} z={[-8.6, -7.9]} material={m.oak} tile={1.8} />
      <Block x={[1.45, 3.95]} y={[0.9, 0.94]} z={[-8.65, -7.85]} material={stoneTop} />
      {[1.85, 2.45, 3.05, 3.6].map((x) => (
        <HeadphoneStand key={x} x={x} z={-8.25} y={0.94} />
      ))}
      {[2.05, 3.25].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.36, -7.35]} material={m.placeholderDark} castShadow receiveShadow>
            <cylinderGeometry args={[0.2, 0.18, 0.06, 32]} />
          </mesh>
          <mesh position={[x, 0.17, -7.35]} material={m.lampMetal} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.34, 12]} />
          </mesh>
        </group>
      ))}
      <ZoneLabel x={2.6} title="Head-Fi" />

      {/* window displays (ASSETS.windowDisplayLeft / Right) */}
      <group position={[0, WORLD.facade.stallRiserHeight + 0.08, 0]}>
        <SpeakerBlockout x={-3.35} z={-0.62} />
        <SpeakerBlockout x={-2.05} z={-0.62} />
        <HeadphoneStand x={2.2} z={-0.6} y={0.1} />
        <HeadphoneStand x={3.1} z={-0.6} y={0.1} />
        <Block x={[1.95, 3.35]} y={[0, 0.1]} z={[-0.85, -0.35]} material={stoneTop} />
      </group>

      {/* lighting */}
      <hemisphereLight args={['#ffe2c0', '#3b2b1f', 0.35]} />
      {[
        [-2.6, -3.6],
        [2.6, -3.6],
        [-2.6, -9],
        [2.6, -9],
      ].map(([x, z]) => (
        <pointLight key={`${x}${z}`} position={[x, H - 0.35, z]} color="#ffc68c" intensity={7} distance={11} decay={2} />
      ))}
      <AimedSpot position={[-2.6, H - 0.05, -6.6]} target={[-2.6, 0.5, -9]} intensity={34} angle={0.62} shadow={shadows} />
      <AimedSpot position={[2.7, H - 0.05, -6.4]} target={[2.7, 0.9, -8.25]} intensity={30} angle={0.55} shadow={shadows} />
      {/* window bed accents (read from the street) */}
      <AimedSpot position={[-2.7, H - 0.05, -1.4]} target={[-2.7, 0.6, -0.6]} intensity={16} angle={0.7} />
      <AimedSpot position={[2.7, H - 0.05, -1.4]} target={[2.7, 0.6, -0.6]} intensity={16} angle={0.7} />
    </group>
  );
}
