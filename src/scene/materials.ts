import { Color, DoubleSide, MeshPhysicalMaterial, MeshStandardMaterial } from 'three';
import {
  asphaltSurface,
  brickSurface,
  latticeAlpha,
  limestoneSurface,
  mosaicSurface,
  oakSurface,
  pavingSurface,
  plasterSurface,
  withRepeat,
} from '../lib/textures';

/**
 * Shared material library — one instance per surface type, reused across
 * meshes so the renderer batches state changes. Colour tokens live in
 * PALETTE; edit there to retune the whole scene.
 */
export const PALETTE = {
  joinery: '#15171a', // satin near-black shopfront frames (brand black)
  joineryEdge: '#22252a',
  brass: '#b08d57',
  stone: '#d8d2c6', // pilasters / cornice
  granite: '#202225', // stall riser
  fascia: '#0d0e10',
  signWhite: '#f4f1ea',
  plaster: '#e4ddd1',
  interiorWarm: '#ffcf9a',
  ceiling: '#efe9de',
  bronze: '#8c6a43', // brushed dark bronze — portal metalwork, arch, lattice
  oak: '#b58a5e', // natural oak slats
  glow: '#ffc88a', // warm backlight behind lattice
} as const;

let lib: ReturnType<typeof create> | null = null;

function create() {
  const brick = brickSurface();
  const paving = pavingSurface();
  const asphalt = asphaltSurface();
  const mosaic = mosaicSurface();
  const oak = oakSurface();
  const lime = limestoneSurface();
  const plaster = plasterSurface();
  const lattice = latticeAlpha();

  const brickRep = withRepeat(brick, 1, 1); // repeat set per-mesh via UV scaling in geometry helpers
  const pavingRep = withRepeat(paving, 1, 1);
  const asphaltRep = withRepeat(asphalt, 1, 1);
  const mosaicRep = withRepeat(mosaic, 1, 1);
  const oakRep = withRepeat(oak, 1, 1);
  const limeRep = withRepeat(lime, 1, 1);
  const plasterRep = withRepeat(plaster, 1, 1);

  return {
    joinery: new MeshStandardMaterial({ color: PALETTE.joinery, roughness: 0.42, metalness: 0.15 }),
    joineryEdge: new MeshStandardMaterial({ color: PALETTE.joineryEdge, roughness: 0.38, metalness: 0.2 }),
    brass: new MeshStandardMaterial({ color: PALETTE.brass, roughness: 0.28, metalness: 1 }),
    stone: new MeshStandardMaterial({ color: PALETTE.stone, roughness: 0.82, metalness: 0 }),
    granite: new MeshStandardMaterial({ color: PALETTE.granite, roughness: 0.22, metalness: 0.05 }),
    fascia: new MeshStandardMaterial({ color: PALETTE.fascia, roughness: 0.35, metalness: 0.1 }),
    signLetters: new MeshStandardMaterial({
      color: PALETTE.signWhite,
      emissive: new Color(PALETTE.signWhite),
      emissiveIntensity: 0.55,
      roughness: 0.5,
    }),
    brick: new MeshStandardMaterial({
      map: brickRep.map,
      bumpMap: brickRep.bump,
      bumpScale: 2.2,
      roughness: 0.92,
      color: '#ffffff',
    }),
    paving: new MeshStandardMaterial({
      map: pavingRep.map,
      bumpMap: pavingRep.bump,
      bumpScale: 0.8,
      roughness: 0.78,
    }),
    kerb: new MeshStandardMaterial({ color: '#7d7a74', roughness: 0.8 }),
    asphalt: new MeshStandardMaterial({
      map: asphaltRep.map,
      bumpMap: asphaltRep.bump,
      bumpScale: 0.6,
      roughness: 0.68,
    }),
    mosaic: new MeshStandardMaterial({ map: mosaicRep.map, bumpMap: mosaicRep.bump, bumpScale: 0.6, roughness: 0.35 }),
    oak: new MeshStandardMaterial({ map: oakRep.map, bumpMap: oakRep.bump, bumpScale: 0.4, roughness: 0.48 }),
    plaster: new MeshStandardMaterial({ color: PALETTE.plaster, roughness: 0.92 }),
    ceiling: new MeshStandardMaterial({ color: PALETTE.ceiling, roughness: 0.95 }),
    neighbour: new MeshStandardMaterial({ color: '#2a2b2e', roughness: 0.9 }),
    neighbourGlass: new MeshStandardMaterial({ color: '#0b0d10', roughness: 0.15, metalness: 0.6 }),
    lampMetal: new MeshStandardMaterial({ color: '#141516', roughness: 0.5, metalness: 0.7 }),
    lampGlow: new MeshStandardMaterial({
      color: '#ffe2b8',
      emissive: new Color('#ffd29a'),
      emissiveIntensity: 2.2,
      roughness: 0.4,
    }),
    /**
     * Shop glazing: low-iron glass. Physically-based transmission is too
     * costly at storefront scale, so we use thin, reflective transparency
     * that lets the warm interior read clearly through it.
     */
    glass: new MeshPhysicalMaterial({
      color: '#c9d6d8',
      roughness: 0.03,
      metalness: 0,
      transparent: true,
      opacity: 0.12,
      reflectivity: 0.6,
      envMapIntensity: 1.6,
      depthWrite: false,
      side: DoubleSide,
    }),
    upperGlass: new MeshPhysicalMaterial({
      color: '#0e1216',
      roughness: 0.06,
      metalness: 0.2,
      envMapIntensity: 1.4,
    }),
    limestone: new MeshStandardMaterial({
      map: limeRep.map,
      bumpMap: limeRep.bump,
      bumpScale: 1.4,
      roughness: 0.74,
    }),
    limePlaster: new MeshStandardMaterial({
      map: plasterRep.map,
      bumpMap: plasterRep.bump,
      bumpScale: 0.9,
      roughness: 0.88,
      color: '#efe6d8',
    }),
    bronze: new MeshStandardMaterial({ color: PALETTE.bronze, roughness: 0.34, metalness: 1, envMapIntensity: 1.3 }),
    bronzeLattice: new MeshStandardMaterial({
      color: PALETTE.bronze,
      roughness: 0.38,
      metalness: 1,
      alphaMap: lattice,
      alphaTest: 0.5,
      side: DoubleSide,
      envMapIntensity: 1.3,
    }),
    oakSlat: new MeshStandardMaterial({ map: oakRep.map, color: '#e9c9a2', roughness: 0.55 }),
    glowPanel: new MeshStandardMaterial({
      color: '#2a1d12',
      emissive: new Color(PALETTE.glow),
      emissiveIntensity: 0.9,
      roughness: 1,
    }),
    ledLine: new MeshStandardMaterial({
      color: '#fff1dc',
      emissive: new Color('#ffd9a8'),
      emissiveIntensity: 3,
    }),
    placeholder: new MeshStandardMaterial({ color: '#8a8580', roughness: 0.7 }),
    placeholderDark: new MeshStandardMaterial({ color: '#2b2a29', roughness: 0.55 }),
  };
}

export type MaterialLib = ReturnType<typeof create>;

export function materials(): MaterialLib {
  if (!lib) lib = create();
  return lib;
}
