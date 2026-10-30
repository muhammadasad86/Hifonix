import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildHeadphone } from './headphoneModel';

/**
 * WebGL scene for the 360° viewer. Renders on demand only (while dragging or
 * coasting), so an idle viewer costs nothing. Loads `modelUrl` (glTF binary)
 * when present, otherwise the procedural stand-in.
 */
export async function createHeadphoneScene(host: HTMLElement, modelUrl: string | null, opts: { reduced: boolean }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  host.append(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const key = new THREE.DirectionalLight(0xfff1e0, 2.2);
  key.position.set(-14, 22, 26);
  const rim = new THREE.DirectionalLight(0xc8d6ff, 1.4);
  rim.position.set(20, 8, -22);
  scene.add(key, rim, new THREE.HemisphereLight(0xffffff, 0x2a2420, 0.45));

  const camera = new THREE.PerspectiveCamera(28, 1, 1, 400);
  camera.position.set(0, 7, 62);
  camera.lookAt(0, 4.2, 0);

  let model: THREE.Object3D = await loadModel(modelUrl);
  const pivot = new THREE.Group();
  pivot.add(model);
  scene.add(pivot);
  // centre + normalise size so any supplied model frames the same way
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const centre = box.getCenter(new THREE.Vector3());
  model.position.sub(centre);
  const k = 26 / Math.max(size.x, size.y, size.z);
  pivot.scale.setScalar(k);
  pivot.position.y = 4.2;

  // pose that matches the Figma photograph (three-quarter view, tilted)
  const rest = { yaw: -0.62, pitch: 0.12 };
  let yaw = rest.yaw;
  let pitch = rest.pitch;
  let vel = 0;
  let lastX = 0;
  let lastT = 0;
  let dragging = false;
  let raf = 0;

  const resize = () => {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    render();
  };
  const render = () => {
    pivot.rotation.set(pitch, yaw, -0.08);
    renderer.render(scene, camera);
  };
  const tick = () => {
    raf = 0;
    if (!dragging) {
      yaw += vel;
      vel *= opts.reduced ? 0 : 0.94;
      pitch += (rest.pitch - pitch) * 0.08;
    }
    render();
    if (dragging || Math.abs(vel) > 0.0004 || Math.abs(pitch - rest.pitch) > 0.001) raf = requestAnimationFrame(tick);
  };
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(tick);
  };

  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  return {
    start(x: number) {
      dragging = true;
      vel = 0;
      lastX = x;
      lastT = performance.now();
      kick();
    },
    move(x: number, y: number) {
      const now = performance.now();
      const dx = x - lastX;
      const w = host.clientWidth || 1;
      const d = (dx / w) * Math.PI * 1.6; // one viewer-width drag ≈ 290°
      yaw += d;
      vel = (d / Math.max(1, now - lastT)) * 16; // per-frame velocity for the coast
      pitch = Math.max(-0.35, Math.min(0.5, rest.pitch + ((y - host.getBoundingClientRect().top) / (host.clientHeight || 1) - 0.5) * 0.4));
      lastX = x;
      lastT = now;
      kick();
    },
    end() {
      dragging = false;
      kick();
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
      renderer.domElement.remove();
      model.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
        mats.forEach((mt) => mt.dispose());
      });
      model = new THREE.Object3D();
    },
  };
}

async function loadModel(url: string | null): Promise<THREE.Object3D> {
  if (!url) return buildHeadphone();
  try {
    const res = await fetch(url, { method: 'HEAD' });
    const type = res.headers.get('content-type') ?? '';
    if (res.ok && !type.includes('text/html')) {
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
      const gltf = await new GLTFLoader().loadAsync(url);
      return gltf.scene;
    }
  } catch {
    /* fall through to the stand-in */
  }
  return buildHeadphone();
}
