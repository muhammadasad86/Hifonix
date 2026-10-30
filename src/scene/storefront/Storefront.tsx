import { Text, useTexture } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { useFrame, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { SRGBColorSpace, type SpotLight, Vector3 } from 'three';
import { ASSETS } from '../../config/assets';
import { DERIVED, WORLD } from '../../config/world';
import { damp } from '../../lib/easing';
import { signAnchor } from '../../state/signAnchor';
import { useExperience } from '../../state/useExperience';
import { FONTS } from '../fonts';
import { materials } from '../materials';
import { EntranceDoor } from './EntranceDoor';
import { Shopfront } from './Shopfront';
import { Street } from './Street';
import { UpperStorey } from './UpperStorey';

const f = WORLD.facade;
const SIGN_Y = (f.shopfrontHeight + DERIVED.fasciaTop) / 2;
const SIGN_Z = f.fasciaDepth + 0.012; // slight stand-off from the limestone header face
/** Logo height (m) on the 1m limestone header — generous margin, as cut-metal signage would sit. */
const LOGO_HEIGHT = 0.46;

/** Fascia sign: supplied logo texture when registered, wordmark placeholder otherwise. */
function Signage() {
  const m = materials();
  const src = ASSETS.fasciaLogo.src as string | null;
  const setSceneReady = useExperience((st) => st.setSceneReady);
  useEffect(() => {
    if (!src) setSceneReady(true);
  }, [src, setSceneReady]);
  if (src) {
    return (
      <Suspense fallback={null}>
        <LogoPlane src={`${import.meta.env.BASE_URL}${src}`} />
      </Suspense>
    );
  }
  return (
    <Text
      font={FONTS.sans}
      fontSize={0.34}
      letterSpacing={0.42}
      position={[0.07, SIGN_Y, SIGN_Z]}
      anchorX="center"
      anchorY="middle"
      material={m.signLetters}
    >
      HIFONIX
    </Text>
  );
}

/**
 * Supplied logo, unaltered: original proportions (aspect from the image) and
 * colours (sRGB, not tone-mapped). Lit by the fascia trough lights, with a
 * soft internal glow so it reads as an illuminated sign at dusk.
 */
function LogoPlane({ src }: { src: string }) {
  const tex = useTexture(src, (t) => {
    const one = Array.isArray(t) ? t[0] : t;
    one.colorSpace = SRGBColorSpace;
    one.anisotropy = 8;
  });
  const img = tex.image as { width: number; height: number };
  const h = LOGO_HEIGHT;
  const w = (h * img.width) / img.height;
  const setSceneReady = useExperience((st) => st.setSceneReady);
  useEffect(() => setSceneReady(true), [setSceneReady]);
  return (
    <mesh position={[0, SIGN_Y, SIGN_Z]} renderOrder={1}>
      <SignAnchor w={w} h={h} />
      <planeGeometry args={[w, h]} />
      <meshStandardMaterial
        map={tex}
        emissiveMap={tex}
        emissive="#ffffff"
        emissiveIntensity={0.6}
        roughness={0.45}
        metalness={0}
        transparent
        alphaTest={0.02}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

/**
 * Projects the sign's corners to CSS pixels each frame (into signAnchor) so
 * the DOM intro logo can land precisely on it at any viewport size.
 */
function SignAnchor({ w, h }: { w: number; h: number }) {
  const camera = useThree((st) => st.camera);
  const size = useThree((st) => st.size);
  const v = useMemo(() => [new Vector3(), new Vector3()], []);
  useFrame(() => {
    v[0].set(-w / 2, SIGN_Y + h / 2, SIGN_Z).project(camera);
    v[1].set(w / 2, SIGN_Y - h / 2, SIGN_Z).project(camera);
    const x0 = ((v[0].x + 1) / 2) * size.width;
    const y0 = ((1 - v[0].y) / 2) * size.height;
    const x1 = ((v[1].x + 1) / 2) * size.width;
    const y1 = ((1 - v[1].y) / 2) * size.height;
    signAnchor.left = x0;
    signAnchor.top = y0;
    signAnchor.width = x1 - x0;
    signAnchor.height = y1 - y0;
    signAnchor.ready = true;
  });
  return null;
}

type Aim = { pos: [number, number, number]; target: [number, number, number]; intensity: number; angle: number; distance: number };

/** One spotlight with a fixed aim point. */
function Spot({ pos, target, intensity, angle, distance }: Aim) {
  const ref = useRef<SpotLight>(null);
  useLayoutEffect(() => {
    ref.current?.target.position.set(...target);
    ref.current?.target.updateMatrixWorld();
  }, [target]);
  return (
    <spotLight ref={ref} position={pos} color="#ffd9ad" intensity={intensity} angle={angle} penumbra={1} distance={distance} decay={2} />
  );
}

/**
 * Architectural lighting for the portal, all concealed:
 * - uplights in the bronze trough graze the limestone header and the logo;
 * - soffit downlights wash the plinth and threshold;
 * - in-ground uplights at the jamb feet graze the stone edges.
 */
function PortalLights() {
  const H = f.shopfrontHeight;
  const P = f.pilasterDepth;
  const top = DERIVED.fasciaTop;
  const jx = (DERIVED.halfW + DERIVED.shopHalfW) / 2;
  const aims = useMemo<Aim[]>(
    () => [
      { pos: [-1.6, H + 0.05, P + 0.2], target: [-1.6, H + 0.8, P], intensity: 1.6, angle: 1.15, distance: 1.8 },
      { pos: [1.6, H + 0.05, P + 0.2], target: [1.6, H + 0.8, P], intensity: 1.6, angle: 1.15, distance: 1.8 },
      { pos: [-2.75, H - 0.06, 0.32], target: [-2.75, 0, 0.5], intensity: 13, angle: 0.75, distance: 5 },
      { pos: [2.75, H - 0.06, 0.32], target: [2.75, 0, 0.5], intensity: 13, angle: 0.75, distance: 5 },
      { pos: [-jx, 0.04, P + 0.14], target: [-jx, top, P], intensity: 9, angle: 0.22, distance: 6.5 },
      { pos: [jx, 0.04, P + 0.14], target: [jx, top, P], intensity: 9, angle: 0.22, distance: 6.5 },
    ],
    [H, P, top, jx],
  );
  return (
    <group name="portal-lights">
      {aims.map((a) => (
        <Spot key={a.pos.join()} {...a} />
      ))}
    </group>
  );
}

/**
 * Invisible hit area over the entrance opening + inviting lobby downlight
 * that warms on hover. Clicking anywhere in the doorway enters the store.
 */
function EntranceHotspot() {
  const enter = useExperience((s) => s.enter);
  const setHover = useExperience((s) => s.setHoverEntrance);
  const phase = useExperience((s) => s.phase);
  const hover = useExperience((s) => s.hoverEntrance);
  const light = useRef<SpotLight>(null);
  const hw = DERIVED.entranceHalfW;

  useLayoutEffect(() => {
    const l = light.current;
    if (!l) return;
    l.target.position.set(0, 0, DERIVED.doorZ / 2 + 0.1);
    l.target.updateMatrixWorld();
  }, []);

  useFrame((_, dt) => {
    const l = light.current;
    if (!l) return;
    const target = hover ? 26 : 12;
    l.intensity += (target - l.intensity) * damp(6, dt);
  });

  const introDone = useExperience((st) => st.introDone);
  const active = phase === 'exterior' && introDone;
  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!active) return;
    setHover(true);
    document.body.style.cursor = 'pointer';
  };
  const out = () => {
    setHover(false);
    document.body.style.cursor = '';
  };
  return (
    <group>
      <mesh
        position={[0, f.transomHeight / 2, 0.02]}
        onPointerOver={over}
        onPointerOut={out}
        onClick={(e) => {
          e.stopPropagation();
          if (!active) return;
          out();
          enter();
        }}
      >
        <planeGeometry args={[hw * 2 + 0.3, f.transomHeight]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>
      <spotLight
        ref={light}
        position={[0, f.transomHeight - 0.04, DERIVED.doorZ / 2]}
        color="#ffcf98"
        intensity={12}
        angle={0.95}
        penumbra={0.9}
        distance={5}
        decay={2}
      />
    </group>
  );
}

export function Storefront({ shadows }: { shadows: boolean }) {
  return (
    <group name="storefront">
      <Shopfront />
      <EntranceDoor />
      <UpperStorey />
      <Signage />
      <PortalLights />
      <EntranceHotspot />
      <Street shadows={shadows} />
    </group>
  );
}
