"""Wire the supplied Hifonix logo onto the fascia. Usage: python3 logo_patch.py <project_root>"""
import sys, pathlib

root = pathlib.Path(sys.argv[1])

def patch(rel, pairs):
    p = root / rel
    s = p.read_text()
    for old, new in pairs:
        if new in s:
            continue  # already applied
        assert s.count(old) == 1, f"{rel}: anchor not unique/missing: {old[:60]!r}"
        s = s.replace(old, new)
    p.write_text(s)
    print("patched", rel)

patch("src/config/assets.ts", [(
"""  fasciaLogo: {
    kind: 'texture',
    src: null,
    status: 'placeholder',
    note: 'White Hifonix logo, transparent PNG/SVG-rasterised, ≥2048px wide. Placeholder renders wordmark text.',
  },""",
"""  fasciaLogo: {
    kind: 'texture',
    src: 'textures/brand/hifonix-logo.png', // relative to BASE_URL
    status: 'supplied',
    note: 'Official Hifonix logo (supplied, 782×207 transparent PNG). Rendered unaltered; a ≥2048px version would sharpen close-ups.',
  },""")])

patch("src/scene/storefront/Storefront.tsx", [
(
"""import type { SpotLight } from 'three';""",
"""import { SRGBColorSpace, type SpotLight } from 'three';""",
),
(
"""const SIGN_Z = f.fasciaDepth + 0.006;""",
"""const SIGN_Z = f.fasciaDepth + 0.012; // slight stand-off from the fascia face
/** Logo cap height as a share of the fascia band (inside the top/bottom mouldings). */
const LOGO_HEIGHT = f.fasciaHeight * 0.62;""",
),
(
"""      <Suspense fallback={null}>
        <LogoPlane src={src} />
      </Suspense>""",
"""      <Suspense fallback={null}>
        <LogoPlane src={`${import.meta.env.BASE_URL}${src}`} />
      </Suspense>""",
),
(
"""function LogoPlane({ src }: { src: string }) {
  const tex = useTexture(src);
  const img = tex.image as { width: number; height: number };
  const h = f.fasciaHeight * 0.52;
  return (
    <mesh position={[0, SIGN_Y, SIGN_Z]}>
      <planeGeometry args={[(h * img.width) / img.height, h]} />
      <meshStandardMaterial map={tex} transparent emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.5} />
    </mesh>
  );
}""",
"""/**
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
  return (
    <mesh position={[0, SIGN_Y, SIGN_Z]} renderOrder={1}>
      <planeGeometry args={[(h * img.width) / img.height, h]} />
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
}""",
),
])
