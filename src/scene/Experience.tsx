import { Environment, Lightformer, PerformanceMonitor } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { ACESFilmicToneMapping, CanvasTexture, Fog, SRGBColorSpace } from 'three';
import { exteriorShot } from '../config/shots';
import { deviceTier } from '../lib/webgl';
import { CameraRig } from './CameraRig';
import { PlaceholderInterior } from './interior/PlaceholderInterior';
import { Storefront } from './storefront/Storefront';

const SKY = { zenith: '#070a10', mid: '#141b26', horizon: '#2c3340', glow: '#4a3f3a' };

/** Blue-hour sky as a screen-space background (no geometry, no network). */
function Atmosphere() {
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const c = document.createElement('canvas');
    c.width = 4;
    c.height = 512;
    const ctx = c.getContext('2d')!;
    const g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, SKY.zenith);
    g.addColorStop(0.45, SKY.mid);
    g.addColorStop(0.78, SKY.horizon);
    g.addColorStop(1, SKY.glow);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 512);
    const tex = new CanvasTexture(c);
    tex.colorSpace = SRGBColorSpace;
    scene.background = tex;
    scene.fog = new Fog('#161c26', 22, 70);
    return () => {
      tex.dispose();
      scene.background = null;
      scene.fog = null;
    };
  }, [scene]);
  return null;
}

/**
 * Environment used only for reflections/ambient: a dim dusk dome plus a few
 * warm street-light strips so glass and brass pick up believable highlights.
 * Rendered once into a cube map from Lightformers — no HDRI download.
 */
function DuskEnvironment() {
  return (
    <Environment resolution={256} frames={1} environmentIntensity={0.55}>
      <color attach="background" args={['#0d121a']} />
      <Lightformer form="rect" intensity={0.9} color="#3d4b60" position={[0, 12, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[40, 40, 1]} />
      <Lightformer form="rect" intensity={1.6} color="#ffd6a6" position={[-8, 4, 14]} scale={[1.2, 0.3, 1]} target={[0, 2, 0]} />
      <Lightformer form="rect" intensity={1.6} color="#ffd6a6" position={[9, 4, 14]} scale={[1.2, 0.3, 1]} target={[0, 2, 0]} />
      <Lightformer form="rect" intensity={0.6} color="#5a6a80" position={[0, 3, 30]} scale={[60, 6, 1]} target={[0, 2, 0]} />
      <Lightformer form="rect" intensity={2.2} color="#ffcf96" position={[0, 2, -8]} scale={[8, 3, 1]} target={[0, 1.5, 0]} />
    </Environment>
  );
}

export function Experience() {
  const tier = useMemo(deviceTier, []);
  const [dpr, setDpr] = useState<number>(tier === 'high' ? Math.min(window.devicePixelRatio, 2) : 1);
  const shadows = tier === 'high';
  const initial = useMemo(() => exteriorShot(window.innerWidth / window.innerHeight), []);

  return (
    <Canvas
      className="stage"
      dpr={dpr}
      shadows={shadows ? 'soft' : false}
      camera={{ position: initial.position.toArray(), fov: initial.fov, near: 0.05, far: 140 }}
      gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      onCreated={({ gl }) => {
        gl.outputColorSpace = SRGBColorSpace;
      }}
      aria-label="Interactive 3D view of the Hifonix storefront"
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} />
      <Atmosphere />
      <DuskEnvironment />
      <ambientLight intensity={0.06} color="#8ea0c0" />
      <Suspense fallback={null}>
        <Storefront shadows={shadows} />
        <PlaceholderInterior shadows={shadows} />
      </Suspense>
      <CameraRig />
    </Canvas>
  );
}

