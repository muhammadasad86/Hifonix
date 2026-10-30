import { useLayoutEffect, useMemo, useRef } from 'react';
import { MeshStandardMaterial, type SpotLight } from 'three';
import { DERIVED, WORLD } from '../../config/world';
import { Block } from '../Block';
import { worldPlane } from '../geometry';
import { materials } from '../materials';

const s = WORLD.street;

function StreetLamp({ x, z, shadow }: { x: number; z: number; shadow: boolean }) {
  const m = materials();
  const light = useRef<SpotLight>(null);
  const H = 5.7;
  const reach = -0.55; // head leans back over the pavement toward the facade
  useLayoutEffect(() => {
    const l = light.current;
    if (!l) return;
    l.target.position.set(x + 0.4, 0, z - 3.2);
    l.target.updateMatrixWorld();
  }, [x, z]);
  return (
    <group>
      <mesh position={[x, H / 2, z]} material={m.lampMetal} castShadow>
        <cylinderGeometry args={[0.045, 0.075, H, 20]} />
      </mesh>
      <mesh position={[x, 0.3, z]} material={m.lampMetal} castShadow>
        <cylinderGeometry args={[0.1, 0.11, 0.6, 20]} />
      </mesh>
      <Block x={[x - 0.025, x + 0.025]} y={[H - 0.06, H]} z={[z + reach, z]} material={m.lampMetal} />
      <Block x={[x - 0.11, x + 0.11]} y={[H - 0.1, H - 0.02]} z={[z + reach - 0.32, z + reach + 0.02]} material={m.lampMetal} />
      <mesh position={[x, H - 0.105, z + reach - 0.15]} rotation={[Math.PI / 2, 0, 0]} material={m.lampGlow}>
        <planeGeometry args={[0.18, 0.28]} />
      </mesh>
      <spotLight
        ref={light}
        position={[x, H - 0.15, z + reach - 0.15]}
        color="#ffdcb0"
        intensity={95}
        angle={0.95}
        penumbra={0.75}
        distance={22}
        decay={1.6}
        castShadow={shadow}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
    </group>
  );
}

/**
 * Olive tree in a honed limestone planter — a regional, drought-tolerant
 * species that softens the stone portal. Procedural placeholder foliage:
 * swap for a GLB (ASSETS) when an authored tree is supplied.
 */
function OliveTree({ x, z, seed = 1 }: { x: number; z: number; seed?: number }) {
  const m = materials();
  const mats = useMemo(
    () => ({
      leaf: new MeshStandardMaterial({ color: '#59664a', roughness: 0.85 }),
      leafLight: new MeshStandardMaterial({ color: '#7a8566', roughness: 0.85 }),
      bark: new MeshStandardMaterial({ color: '#4a4036', roughness: 0.95 }),
      soil: new MeshStandardMaterial({ color: '#2b241d', roughness: 1 }),
    }),
    [],
  );
  const clusters = useMemo(() => {
    let s = seed * 9301;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    return Array.from({ length: 9 }, (_, i) => {
      const a = (i / 9) * Math.PI * 2 + r() * 0.6;
      const d = 0.25 + r() * 0.45;
      return {
        p: [x + Math.cos(a) * d, 2.35 + r() * 0.75, z + Math.sin(a) * d * 0.8] as [number, number, number],
        s: 0.32 + r() * 0.22,
        light: i % 3 === 0,
      };
    });
  }, [x, z, seed]);
  const pw = 0.42;
  return (
    <group>
      <Block x={[x - pw, x + pw]} y={[0, 0.62]} z={[z - pw, z + pw]} material={m.limestone} tile={1.2} aligned />
      <Block x={[x - pw + 0.05, x + pw - 0.05]} y={[0.56, 0.6]} z={[z - pw + 0.05, z + pw - 0.05]} material={mats.soil} cast={false} />
      {/* gnarled twin trunk */}
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[x + sd * 0.06, 1.35, z]} rotation={[0, 0, sd * 0.16]} material={mats.bark} castShadow>
          <cylinderGeometry args={[0.035, 0.07, 1.6, 10]} />
        </mesh>
      ))}
      {clusters.map((c, i) => (
        <mesh key={i} position={c.p} scale={[c.s, c.s * 0.72, c.s]} material={c.light ? mats.leafLight : mats.leaf} castShadow receiveShadow>
          <icosahedronGeometry args={[1, 2]} />
        </mesh>
      ))}
    </group>
  );
}

/** Neighbouring buildings: quiet, darker massing that frames the Hifonix facade. */
function Neighbours() {
  const m = materials();
  const mats = useMemo(
    () => ({
      render: (() => {
        const p = m.limePlaster.clone();
        p.color.set('#8d8476');
        return p;
      })(),
      darkBrick: (() => {
        const b = m.limestone.clone();
        b.color.set('#7a7064');
        return b;
      })(),
      shopGlass: new MeshStandardMaterial({ color: '#080a0c', roughness: 0.08, metalness: 0.7, envMapIntensity: 1.2 }),
      fascia: new MeshStandardMaterial({ color: '#33302c', roughness: 0.7 }),
    }),
    [m.limePlaster, m.limestone],
  );
  const { halfW } = DERIVED;
  const building = (x0: number, x1: number, h: number, wall: MeshStandardMaterial, z0 = -0.05) => {
    const lo = Math.min(x0, x1);
    const hi = Math.max(x0, x1);
    const bays = Math.max(1, Math.round((hi - lo) / 3.2));
    const bw = (hi - lo) / bays;
    return (
      <group key={x0}>
        <Block x={[lo, hi]} y={[3.9, h]} z={[-6, z0]} material={wall} tile={0.9} aligned cast={false} />
        <Block x={[lo, hi]} y={[3.3, 3.9]} z={[-6, z0 + 0.1]} material={mats.fascia} cast={false} />
        <Block x={[lo, hi]} y={[0, 0.45]} z={[-6, z0]} material={mats.fascia} cast={false} />
        <Block x={[lo + 0.2, hi - 0.2]} y={[0.45, 3.3]} z={[-6, z0 - 0.08]} material={mats.shopGlass} cast={false} />
        {Array.from({ length: bays }, (_, i) => {
          const cx = lo + bw * (i + 0.5);
          return (
            <Block key={i} x={[cx - 0.6, cx + 0.6]} y={[4.9, 6.6]} z={[z0, z0 + 0.02]} material={mats.shopGlass} cast={false} />
          );
        })}
      </group>
    );
  };
  return (
    <group name="neighbours">
      {building(-halfW - 11, -halfW, 7.4, mats.render)}
      {building(-halfW - 24, -halfW - 11, 8.6, mats.darkBrick)}
      {building(halfW, halfW + 10, 9.1, mats.darkBrick, -0.12)}
      {building(halfW + 10, halfW + 23, 7.8, mats.render)}
    </group>
  );
}

export function Street({ shadows }: { shadows: boolean }) {
  const m = materials();
  const roadZ0 = s.pavementDepth + 0.15;
  return (
    <group name="street">
      <mesh
        geometry={worldPlane(s.extent * 2, s.pavementDepth, 1.2)}
        material={m.paving}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, s.pavementDepth / 2]}
        receiveShadow
      />
      <Block x={[-s.extent, s.extent]} y={[-s.kerbHeight, 0]} z={[s.pavementDepth, roadZ0]} material={m.kerb} tile={0.9} cast={false} />
      <mesh
        geometry={worldPlane(s.extent * 2, s.roadDepth * 4, 4)}
        material={m.asphalt}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -s.kerbHeight, roadZ0 + s.roadDepth * 2]}
        receiveShadow
      />
      {/* double yellow lines — a quiet, authentic UK high-street cue */}
      {[0.06, 0.2].map((dz) => (
        <mesh key={dz} rotation={[-Math.PI / 2, 0, 0]} position={[0, -s.kerbHeight + 0.003, roadZ0 + 0.25 + dz]}>
          <planeGeometry args={[s.extent * 2, 0.08]} />
          <meshStandardMaterial color="#b8962e" roughness={0.7} />
        </mesh>
      ))}
      <StreetLamp x={-6.9} z={s.pavementDepth - 0.45} shadow={shadows} />
      <StreetLamp x={9.6} z={s.pavementDepth - 0.45} shadow={false} />
      <OliveTree x={-DERIVED.halfW - 0.75} z={1.15} seed={3} />
      <OliveTree x={DERIVED.halfW + 0.75} z={1.15} seed={7} />
      <Neighbours />
    </group>
  );
}
