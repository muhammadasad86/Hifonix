import * as THREE from 'three';

/**
 * Procedural stand-in for the Elevate headphone (Figma photo: open-back planar
 * with tan leather pads + headband and grey perforated cups). Used by the 360°
 * viewer until a real model is supplied at /models/headphone.glb.
 * Units ≈ cm; origin at the centre of the headband arc, y up, cups face ±x.
 */
function roundedRect(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function holePath(w: number, h: number, r: number) {
  const s = roundedRect(w, h, r);
  return new THREE.Path(s.getPoints(48).reverse());
}

function perforation(size: number, dot: number, gap: number, base: string, hole: string) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  g.fillStyle = base;
  g.fillRect(0, 0, size, size);
  g.fillStyle = hole;
  for (let y = gap / 2, row = 0; y < size; y += gap * 0.866, row++) {
    for (let x = (row % 2 ? gap : gap / 2); x < size; x += gap) {
      g.beginPath();
      g.arc(x, y, dot, 0, Math.PI * 2);
      g.fill();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function grain(size: number) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const d = g.createImageData(size, size);
  for (let i = 0; i < d.data.length; i += 4) {
    const v = 120 + Math.random() * 90;
    d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
    d.data[i + 3] = 255;
  }
  g.putImageData(d, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export function buildHeadphone() {
  const group = new THREE.Group();
  const leatherGrain = grain(256);
  leatherGrain.repeat.set(6, 6);

  const leather = new THREE.MeshPhysicalMaterial({
    color: 0x7a4521,
    roughness: 0.55,
    sheen: 0.3,
    sheenColor: new THREE.Color(0xd08a52),
    sheenRoughness: 0.45,
    bumpMap: leatherGrain,
    bumpScale: 0.015,
  });
  // pads: tan leather with the photo's large staggered perforations
  const padTex = perforation(512, 22, 74, '#82481f', '#26130a');
  padTex.repeat.set(0.32, 0.32);
  const padFace = new THREE.MeshPhysicalMaterial({
    map: padTex,
    roughness: 0.6,
    sheen: 0.25,
    sheenColor: new THREE.Color(0xc98450),
    bumpMap: padTex,
    bumpScale: 0.25,
  });
  const metal = new THREE.MeshPhysicalMaterial({ color: 0x6b6e72, metalness: 0.85, roughness: 0.34, clearcoat: 0.2 });
  const dark = new THREE.MeshPhysicalMaterial({ color: 0x1d1e20, metalness: 0.6, roughness: 0.45 });
  const grilleTex = perforation(512, 4.2, 13, '#7b7f84', '#151618');
  grilleTex.repeat.set(1.2, 1.2);
  const grille = new THREE.MeshPhysicalMaterial({ map: grilleTex, metalness: 0.7, roughness: 0.42, bumpMap: grilleTex, bumpScale: 0.05 });

  const W = 8.6;
  const H = 11.8;
  const R = 4.2;

  const cup = (side: 1 | -1) => {
    const g = new THREE.Group();
    // housing
    const shell = new THREE.Mesh(
      new THREE.ExtrudeGeometry(roundedRect(W, H, R), { depth: 1.6, bevelEnabled: true, bevelThickness: 0.35, bevelSize: 0.35, bevelSegments: 6, curveSegments: 40 }),
      metal,
    );
    shell.position.z = -0.8;
    g.add(shell);
    // perforated outer grille, set into the housing
    const gr = new THREE.Mesh(new THREE.ShapeGeometry(roundedRect(W * 0.8, H * 0.8, R * 0.8), 32), grille);
    gr.position.z = -1.17;
    gr.rotation.y = Math.PI;
    const uv = gr.geometry.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / (W * 0.8) + 0.5, uv.getY(i) / (H * 0.8) + 0.5);
    g.add(gr);
    // dark baffle ring
    const ringShape = roundedRect(W * 1.02, H * 1.02, R);
    ringShape.holes.push(holePath(W * 0.62, H * 0.66, R * 0.6));
    const baffle = new THREE.Mesh(new THREE.ExtrudeGeometry(ringShape, { depth: 0.35, bevelEnabled: false, curveSegments: 32 }), dark);
    baffle.position.z = 1.1;
    g.add(baffle);
    // leather pad (rounded donut)
    const padShape = roundedRect(W * 1.04, H * 1.04, R * 1.04);
    padShape.holes.push(holePath(W * 0.55, H * 0.6, R * 0.55));
    const pad = new THREE.Mesh(
      new THREE.ExtrudeGeometry(padShape, { depth: 0.9, bevelEnabled: true, bevelThickness: 0.55, bevelSize: 0.6, bevelSegments: 8, curveSegments: 48 }),
      [padFace, leather],
    );
    pad.position.z = 1.6;
    g.add(pad);
    // yoke pivot
    const pivot = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.6, 24), metal);
    pivot.position.set(0, H / 2 + 0.6, 0);
    g.add(pivot);
    g.rotation.y = side * (Math.PI / 2);
    g.position.set(side * -8.0, -1, 0);
    return g;
  };
  group.add(cup(1), cup(-1));

  // headband frame (metal) + suspended leather strap
  const arc = (r: number, y: number) =>
    new THREE.CatmullRomCurve3(
      Array.from({ length: 25 }, (_, i) => {
        const a = Math.PI * (i / 24);
        return new THREE.Vector3(Math.cos(a) * r, y + Math.sin(a) * r * 0.92, 0);
      }),
    );
  const frame = new THREE.Mesh(new THREE.TubeGeometry(arc(8.6, 5.6), 120, 0.2, 12, false), metal);
  group.add(frame);
  const frame2 = frame.clone();
  frame2.position.z = 0.75;
  const frame3 = frame.clone();
  frame3.position.z = -0.75;
  group.add(frame2, frame3);
  group.remove(frame);

  const strapShape = roundedRect(2.6, 0.4, 0.18);
  const strap = new THREE.Mesh(
    new THREE.ExtrudeGeometry(strapShape, { steps: 120, extrudePath: arc(7.7, 5.1), bevelEnabled: false }),
    leather,
  );
  group.add(strap);

  // drop arms from frame to cup pivots
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.6, 16), metal);
    arm.position.set(s * 8.4, 5.0, 0);
    group.add(arm);
  }

  group.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return group;
}
