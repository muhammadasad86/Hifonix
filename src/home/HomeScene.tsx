import { Environment, Lightformer, PerformanceMonitor } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { ACESFilmicToneMapping, CatmullRomCurve3, type PerspectiveCamera, SRGBColorSpace, Vector3 } from 'three';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { deviceTier } from '../lib/webgl';

RectAreaLightUniformsLib.init();
import { JOURNEY_FOV, journey, KEYS, poseAt, SPLASH } from './journey';
import { Gallery } from './rooms';

/** Flight from the splash pose, through the opened lattice, to the first journey key. */
const k0 = KEYS[0];
const flightPos = new CatmullRomCurve3(
  [SPLASH.pos.clone(), new Vector3(0.5, 2.0, -1.6), new Vector3(0.55, 1.92, -3.75), new Vector3(0.3, 1.82, -4.9), new Vector3(...k0.pos)],
  false,
  'centripetal',
);
const flightLook = new CatmullRomCurve3(
  [SPLASH.look.clone(), new Vector3(0.3, 2.0, -6), new Vector3(0.2, 1.9, -9), new Vector3(0, 1.92, -11), new Vector3(...k0.look)],
  false,
  'centripetal',
);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function Rig() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  const v = useMemo(() => ({ pos: new Vector3(), look: new Vector3(), ptr: { x: 0, y: 0, sx: 0, sy: 0 } }), []);
  useEffect(() => {
    const move = (e: PointerEvent) => {
      v.ptr.x = (e.clientX / window.innerWidth) * 2 - 1;
      v.ptr.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, [v]);

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20);
    let fov = JOURNEY_FOV;
    if (!journey.started) {
      v.pos.copy(SPLASH.pos);
      v.look.copy(SPLASH.look);
      fov = SPLASH.fov;
      if (!journey.reducedMotion) v.pos.y += Math.sin(clock.elapsedTime * 0.3) * 0.02;
    } else if (journey.flight < 1) {
      const e = easeInOut(journey.flight);
      flightPos.getPoint(e, v.pos);
      flightLook.getPoint(e, v.look);
      fov = SPLASH.fov + (JOURNEY_FOV - SPLASH.fov) * e;
    } else {
      poseAt(journey.current, v.pos, v.look);
    }
    // pointer parallax (a gentle head turn), damped
    const k = 1 - Math.exp(-3 * dt);
    const amt = journey.reducedMotion ? 0 : 1;
    v.ptr.sx += (v.ptr.x * amt - v.ptr.sx) * k;
    v.ptr.sy += (v.ptr.y * amt - v.ptr.sy) * k;
    v.look.x += v.ptr.sx * 0.35;
    v.look.y -= v.ptr.sy * 0.18;
    // narrow / portrait screens: widen the lens (capped) so the settled compositions still read
    const aspect = size.width / Math.max(1, size.height);
    if (aspect < 1.5) fov = Math.min(72, fov * (1 + (1.5 - aspect) * 0.42));
    camera.position.copy(v.pos);
    camera.lookAt(v.look);
    if (Math.abs(camera.fov - fov) > 1e-3) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  });
  return null;
}

/** Reflections only: a warm, dim interior environment built from light cards (no HDRI download). */
function Interiorlight() {
  return (
    <Environment resolution={128} frames={1} environmentIntensity={0.42}>
      <color attach="background" args={['#3a3029']} />
      <Lightformer form="rect" intensity={1.2} color="#ffcf9a" position={[0, 6, -18]} rotation={[Math.PI / 2, 0, 0]} scale={[8, 30, 1]} />
      <Lightformer form="rect" intensity={0.9} color="#d9c7ae" position={[-8, 2, -20]} rotation={[0, Math.PI / 2, 0]} scale={[30, 3, 1]} />
      <Lightformer form="rect" intensity={0.9} color="#d9c7ae" position={[8, 2, -20]} rotation={[0, -Math.PI / 2, 0]} scale={[30, 3, 1]} />
    </Environment>
  );
}

export function HomeScene({ onReady }: { onReady?: () => void }) {
  const tier = useMemo(deviceTier, []);
  const [dpr, setDpr] = useState(tier === 'high' ? Math.min(window.devicePixelRatio, 1.5) : 1);
  const shadows = tier === 'high';
  return (
    <Canvas
      className="home-stage"
      dpr={dpr}
      shadows={shadows}
      camera={{ position: SPLASH.pos.toArray(), fov: SPLASH.fov, near: 0.05, far: 80 }}
      gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
      onCreated={({ gl, scene }) => {
        gl.outputColorSpace = SRGBColorSpace;
        // the lounge is static (only the camera moves): bake shadow maps once, not every frame
        gl.shadowMap.autoUpdate = false;
        gl.shadowMap.needsUpdate = true;
        scene.background = null;
      }}
      aria-hidden="true"
    >
      <color attach="background" args={['#2a221c']} />
      <PerformanceMonitor onDecline={() => setDpr(1)} />
      <Interiorlight />
      <ambientLight intensity={0.22} color="#ffeedd" />
      <hemisphereLight args={['#fff0dc', '#6b5440', 1.05]} />
      <Suspense fallback={null}>
        <Gallery shadows={shadows} />
        <Ready onReady={onReady} />
      </Suspense>
      <Rig />
    </Canvas>
  );
}

/** Fires once the first frame with the gallery has rendered (shaders compiled). */
function Ready({ onReady }: { onReady?: () => void }) {
  const [done, setDone] = useState(false);
  const frames = useRef(0);
  useFrame(({ gl }) => {
    // re-bake shadows for the first frames while late assets (fonts, textures) settle
    if (frames.current < 90) {
      frames.current++;
      if (frames.current % 15 === 0) gl.shadowMap.needsUpdate = true;
    }
    if (!done) {
      setDone(true);
      requestAnimationFrame(() => onReady?.());
    }
  });
  return null;
}
