import { useLayoutEffect, useMemo, useRef } from 'react';
import type { SpotLight } from 'three';
import { Block } from '../scene/Block';
import { worldPlane } from '../scene/geometry';
import { materials } from '../scene/materials';
import { ambience } from './ambience';
import { PortalWall, RoomShell } from './architecture';
import { Aavik580, type AavikModel, AbyssAB1266, AbyssDianaTC, HeadphoneStand, Plaque } from './brands';
import { ArtFrame, Credenza, GlobeLamp, PanelledWall, ShelfWall, WallWash } from './fixtures';
import { ROOMS } from './journey';
import {
  BoucleSofa,
  Books,
  CofferCeiling,
  Drape,
  GlobeSconce,
  GridShelf,
  HeadphoneWall,
  HornSpeaker,
  LeatherSofa,
  MarbleTable,
  OakCube,
  PerforatedWall,
  TubChair,
  Vessel,
} from './lounge';
import { CableCoil, Component, EquipmentRack, IsolationPlatform } from './props';

/**
 * The homepage journey as one contemporary listening lounge:
 *   splash (ivory gallery wall, horn pair) → entrance lounge → Hi-Fi listening
 *   room → Head-Fi room → Collection gallery.
 * Palette: warm ivory plaster, honey oak, walnut, travertine, caramel velvet,
 * cognac leather, bouclé, white marble, black metal accents. Light comes from
 * the architecture — coves, lit coffers, sconces, backlit shelving.
 */
type V3 = [number, number, number];

function Spot({
  pos,
  target,
  intensity,
  angle = 0.5,
  distance = 9,
  shadow = false,
  color = '#ffdcb4',
  mapSize = 1024,
}: {
  pos: V3;
  target: V3;
  intensity: number;
  angle?: number;
  distance?: number;
  shadow?: boolean;
  color?: string;
  mapSize?: number;
}) {
  const ref = useRef<SpotLight>(null);
  useLayoutEffect(() => {
    ref.current?.target.position.set(...target);
    ref.current?.target.updateMatrixWorld();
  }, [target]);
  return (
    <spotLight
      ref={ref}
      position={pos}
      color={color}
      intensity={intensity}
      angle={angle}
      penumbra={0.9}
      distance={distance}
      decay={2}
      castShadow={shadow}
      shadow-mapSize={[mapSize, mapSize]}
      shadow-bias={-0.0003}
      shadow-normalBias={0.025}
    />
  );
}

/** Rug: thin rounded slab so it reads as an object on the floor, not a decal. */
function Rug({ x, z, w, d, rotation = 0, material }: { x: number; z: number; w: number; d: number; rotation?: number; material?: ReturnType<typeof ambience>['oatmealRug'] }) {
  const a = ambience();
  return (
    <mesh position={[x, 0.008, z]} rotation={[-Math.PI / 2, 0, rotation]} material={material ?? a.oatmealRug} receiveShadow>
      <planeGeometry args={[w, d]} />
    </mesh>
  );
}

/* ───────────────────────── Splash: the gallery wall ───────────────────────── */

/**
 * First impression: a warm ivory gallery wall under a dark oak ceiling with a
 * cove line, a square-cut oak-lined portal glowing with the lounge beyond,
 * and a pair of sculptural ivory horn speakers standing either side.
 * On Start Exploring the camera glides between the horns and through.
 */
function SplashSet() {
  const m = materials();
  const a = ambience();
  const z = ROOMS.splashWall.z;
  const ceil = 3.6;
  const { w, h } = ROOMS.splashPortal;
  return (
    <group name="splash">
      <PortalWall z={z} hw={7} h={ceil} material={m.limePlaster} w={w} ph={h} depth={ROOMS.splashWall.depth} />
      {/* floor + dark oak ceiling with a cove line at the wall head */}
      <mesh geometry={worldPlane(14, 7.6, 1.2)} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, z + 3.8]} material={a.herringboneOak} receiveShadow />
      <mesh geometry={worldPlane(14, 7.6, 1.2)} rotation={[Math.PI / 2, 0, 0]} position={[0, ceil, z + 3.8]} material={a.oakDark} />
      <Block x={[-7, 7]} y={[ceil - 0.16, ceil]} z={[z, z + 0.22]} material={a.oakDark} cast={false} />
      <Block x={[-7, 7]} y={[ceil - 0.17, ceil - 0.16]} z={[z + 0.04, z + 0.18]} material={a.cove} cast={false} />
      <WallWash from={[0, ceil - 0.25, z + 0.5]} to={[0, 0.8, z]} width={13} height={0.4} intensity={10} color="#ffe2c0" />

      {/* horn pair on low oak plinths, toed in */}
      {([-1, 1] as const).map((s) => (
        <group key={s}>
          <Block x={[s * 1.95 - 0.3, s * 1.95 + 0.3]} y={[0, 0.08]} z={[z + 0.3, z + 0.9]} material={a.oak} />
          <HornSpeaker position={[s * 1.95, 0.08, z + 0.6]} rotationY={-s * 0.18} scale={0.9} />
          <Spot pos={[s * 1.95, ceil - 0.2, z + 1.9]} target={[s * 1.95, 0.95, z + 0.6]} intensity={9} angle={0.4} distance={6} />
        </group>
      ))}
      <Rug x={0} z={z + 2.2} w={4.2} d={2.6} />
    </group>
  );
}

/* ───────────────────────── I · Entrance lounge ───────────────────────── */

function Antechamber() {
  const m = materials();
  const a = ambience();
  const r = ROOMS.ante;
  return (
    <group name="antechamber">
      <RoomShell z0={r.z0} z1={r.z1} hw={r.hw} h={r.h} wall={m.limePlaster} floor={a.travertine} floorTile={1.2} ceiling={a.oakDark} />
      <PanelledWall x={-r.hw} face={1} z0={r.z0 - 0.1} z1={r.z1 + 0.1} h={r.h} material={a.oak} reveal={a.oakDark} wash={0} />
      <PanelledWall x={r.hw} face={-1} z0={r.z0 - 0.1} z1={r.z1 + 0.1} h={r.h} material={a.oak} reveal={a.oakDark} wash={0} />
      <CofferCeiling z0={r.z0} z1={r.z1} hw={r.hw} h={r.h} />
      <Rug x={-2.0} z={-9.4} w={2.6} d={3.2} />
      <TubChair position={[-2.7, 0, -8.7]} rotationY={Math.PI * 0.75} />
      <TubChair position={[-2.7, 0, -10.2]} rotationY={Math.PI * 0.25} material={a.boucleCharcoal} />
      <OakCube position={[-2.1, 0, -9.45]} s={0.4} />
      <GlobeLamp position={[3.2, 0, -11.2]} />
      <ArtFrame position={[r.hw - 0.08, 2.3, -8.2]} rotationY={-Math.PI / 2} w={1.3} h={1.6} />
      <Spot pos={[-1.4, r.h - 0.2, -9.4]} target={[-2.4, 0.4, -9.4]} intensity={16} angle={0.5} distance={7} />
      <PortalWall z={r.z1} hw={ROOMS.hifi.hw} h={ROOMS.hifi.h} material={m.limePlaster} />
    </group>
  );
}

/* ───────────────────────── II · Hi-Fi listening room ───────────────────────── */

/** Aavik 580 line-up on the credenza, offsets along the wall (m). */
const AAVIK_LAYOUT: { model: AavikModel; dz: number }[] = [
  { model: 'R-580', dz: 0.85 },
  { model: 'D-580', dz: 0.3 },
  { model: 'I-580', dz: -0.25 },
  { model: 'S-580', dz: -0.8 },
];

/**
 * Listening room (ref: horn-speaker lounge). Caramel velvet drapes either side
 * of a plaster bay; walnut fluted credenza carrying the Aavik system under a
 * three-globe sconce; ivory horns on black bass cabinets, toed in; a deep
 * cognac sofa with houndstooth bolsters on an oatmeal rug; honey-oak
 * herringbone floor and a lit oak coffer ceiling.
 */
function HiFiRoom({ shadows }: { shadows: boolean }) {
  const m = materials();
  const a = ambience();
  const r = ROOMS.hifi;
  const wx = -r.hw;
  const cz = -18.3;
  const top = 0.58;
  const cx = wx + 0.5; // credenza centre (clear of the drape folds)
  return (
    <group name="hifi-room">
      <RoomShell z0={r.z0} z1={r.z1} hw={r.hw} h={r.h} wall={m.limePlaster} floor={a.herringboneOak} floorTile={1.2} ceiling={a.oakDark} />
      <CofferCeiling z0={r.z0} z1={r.z1} hw={r.hw} h={r.h} />

      {/* system wall: drapes either side of a plaster bay */}
      <Drape x={wx} face={1} z0={r.z1 + 0.2} z1={cz - 1.85} h={r.h} />
      <Drape x={wx} face={1} z0={cz + 1.85} z1={r.z0 - 0.2} h={r.h} />
      <WallWash from={[wx + 0.8, r.h - 0.4, cz]} to={[wx, 1.2, cz]} width={11} intensity={16} color="#ffe6cc" />
      <GlobeSconce position={[wx + 0.02, 2.25, cz]} rotationY={Math.PI / 2} />

      <Credenza position={[cx, 0, cz]} rotationY={Math.PI / 2} w={2.9} material={a.walnutVeneer} />
      {AAVIK_LAYOUT.map(({ model, dz }) => (
        <group key={model}>
          <Aavik580 position={[cx - 0.02, top, cz + dz]} rotationY={Math.PI / 2} model={model} />
          <Plaque position={[cx + 0.28, 0.505, cz + dz]} rotationY={Math.PI / 2} brand="Aavik" model={model} />
        </group>
      ))}

      <HornSpeaker position={[wx + 1.25, 0, cz + 2.45]} rotationY={Math.PI / 2 - 0.3} scale={1.15} />
      <HornSpeaker position={[wx + 1.25, 0, cz - 2.45]} rotationY={Math.PI / 2 + 0.3} scale={1.15} />

      <Rug x={-2.7} z={cz} w={4.2} d={4.6} rotation={Math.PI / 2} />
      <LeatherSofa position={[-2.45, 0, cz]} rotationY={-Math.PI / 2} w={2.5} />
      <OakCube position={[-2.45, 0, cz - 1.65]} s={0.42} />
      <Vessel position={[-2.45, 0.4, cz - 1.65]} />

      {/* opposite wall: honey-oak panelling with artwork */}
      <PanelledWall x={r.hw} face={-1} z0={r.z0 - 0.1} z1={r.z1 + 0.1} h={r.h} material={a.oak} reveal={a.oakDark} wash={0} />
      <ArtFrame position={[r.hw - 0.08, 2.4, cz]} rotationY={-Math.PI / 2} w={1.7} h={1.9} />
      <GlobeLamp position={[4.6, 0, -13.6]} light={false} />

      <Spot pos={[-2.2, r.h - 0.2, cz]} target={[cx, 0.7, cz]} intensity={30} angle={0.42} distance={10} shadow={shadows} />
      <Spot pos={[-2.6, r.h - 0.2, cz + 2.4]} target={[wx + 1.25, 1.1, cz + 2.45]} intensity={16} angle={0.28} distance={9} />
      <Spot pos={[-2.6, r.h - 0.2, cz - 2.4]} target={[wx + 1.25, 1.1, cz - 2.45]} intensity={16} angle={0.28} distance={9} />
      <PortalWall z={r.z1} hw={r.hw} h={r.h} material={m.limePlaster} />
    </group>
  );
}

/* ───────────────────────── III · Head-Fi room ───────────────────────── */

/** Which Abyss model hangs on each peg (col, row) — flagship AB-1266 at the centre. */
function pegItem(c: number, r: number) {
  if ((r === 1 || r === 2) && (c === 3 || c === 4)) return <AbyssAB1266 position={[0, 0, 0]} />;
  return <AbyssDianaTC position={[0, 0, 0]} finish={(c + r) % 2 ? 'bronze' : 'titanium'} />;
}

/**
 * Headphone room (ref: walnut headphone wall + backlit record grid +
 * perforated-oak lounge). The Abyss range hangs on brass pegs with numbered
 * discs above a floating walnut shelf; a backlit walnut record grid faces it;
 * curved bouclé tub chairs and oak cubes; the AB-1266 Phi TC on a white-marble
 * plinth; lit oak ceiling.
 */
function HeadfiRoom({ shadows }: { shadows: boolean }) {
  const m = materials();
  const a = ambience();
  const r = ROOMS.salon;
  const wx = r.hw;
  return (
    <group name="headfi-room">
      <RoomShell z0={r.z0} z1={r.z1} hw={r.hw} h={r.h} wall={m.limePlaster} floor={a.herringboneOak} floorTile={1.2} ceiling={a.oakDark} />
      <CofferCeiling z0={r.z0} z1={r.z1} hw={r.hw} h={r.h} bay={1.4} />

      <HeadphoneWall
        x={wx}
        face={-1}
        z0={-32.0}
        z1={-27.6}
        y0={0.3}
        y1={3.55}
        cols={8}
        rows={4}
        items={pegItem}
        shelfY={0.98}
        shelf={
          <>
            {[-28.5, -31.1].map((z, i) => (
              <group key={z}>
                <HeadphoneStand position={[wx - 0.2, 0.98, z]} h={0.34} rotationY={-Math.PI / 2 + (i ? 0.4 : -0.4)}>
                  <AbyssDianaTC position={[0, 0, 0]} finish={i ? 'bronze' : 'titanium'} />
                </HeadphoneStand>
                <Plaque position={[wx - 0.36, 0.9, z]} rotationY={-Math.PI / 2} brand="Abyss" model={i ? 'Diana TC · Dark Bronze' : 'Diana TC · Titanium Gray'} />
              </group>
            ))}
          </>
        }
      />
      <WallWash from={[wx - 1.2, r.h - 0.3, -29.8]} to={[wx, 1.6, -29.8]} width={4.8} intensity={14} color="#ffdcb4" />

      {/* opposite: backlit walnut record grid */}
      <ShelfWall x={-r.hw} face={1} z0={-34.4} z1={-25.2} y0={0} y1={3.3} cols={11} rows={5} strips />

      <Rug x={0.3} z={-29.8} w={3.0} d={4.2} />
      <TubChair position={[0.7, 0, -28.75]} rotationY={Math.PI / 2 + 0.2} />
      <TubChair position={[0.7, 0, -30.85]} rotationY={Math.PI / 2 - 0.2} />
      <OakCube position={[0.55, 0, -29.8]} s={0.38} />

      {/* hero: AB-1266 Phi TC on white marble */}
      <Block x={[1.95, 2.65]} y={[0, 0.94]} z={[-32.85, -32.15]} material={a.whiteMarble} tile={1} aligned />
      <HeadphoneStand position={[2.3, 0.94, -32.5]} h={0.44} rotationY={-Math.PI / 2 + 0.6}>
        <AbyssAB1266 position={[0, 0, 0]} />
      </HeadphoneStand>
      <Plaque position={[1.93, 0.84, -32.5]} rotationY={-Math.PI / 2} brand="Abyss" model="AB-1266 Phi TC" />

      <Spot pos={[0.4, r.h - 0.15, -29.8]} target={[wx, 2.2, -29.8]} intensity={16} angle={0.75} distance={8} shadow={shadows} />
      <Spot pos={[2.3, r.h - 0.15, -31.4]} target={[2.3, 1.0, -32.5]} intensity={10} angle={0.3} distance={6} />
      <PortalWall z={r.z1} hw={ROOMS.atelier.hw} h={ROOMS.atelier.h} material={m.limePlaster} />
    </group>
  );
}

/* ───────────────────────── IV · Collection gallery ───────────────────────── */

/**
 * Collection (ref: editorial shelving lounge + perforated oak). A black-metal
 * grid display in front of a softly lit ivory wall, holding the collection
 * like a gallery: cables, isolation platforms, books, ceramics. Walnut racks
 * either side; perforated-oak side walls; charcoal bouclé sofas facing over a
 * white-marble table; travertine floor.
 */
function CollectionGallery({ shadows }: { shadows: boolean }) {
  const m = materials();
  const a = ambience();
  const r = ROOMS.atelier;
  const back = r.z1;
  const sz = back + 0.62; // shelf front plane
  const X0 = -2.4;
  const X1 = 2.4;
  const Y0 = 0.42;
  const Y1 = 3.62;
  const cols = 4;
  const rows = 4;
  const cell = (c: number, rr: number): V3 => [X0 + ((X1 - X0) * (c + 0.5)) / cols, Y0 + ((Y1 - Y0) * rr) / rows + 0.012, sz - 0.2];
  const shelfItems = useMemo(
    () => [
      { c: 0, r: 0, k: 'books', s: 1 },
      { c: 1, r: 0, k: 'platform' },
      { c: 2, r: 0, k: 'component' },
      { c: 3, r: 0, k: 'coil' },
      { c: 0, r: 1, k: 'coil-b' },
      { c: 1, r: 1, k: 'vessel' },
      { c: 2, r: 1, k: 'books', s: 3 },
      { c: 3, r: 1, k: 'platform' },
      { c: 0, r: 2, k: 'platform' },
      { c: 1, r: 2, k: 'books', s: 5 },
      { c: 2, r: 2, k: 'coil' },
      { c: 3, r: 2, k: 'vessel' },
      { c: 0, r: 3, k: 'vessel' },
      { c: 1, r: 3, k: 'coil-b' },
      { c: 2, r: 3, k: 'platform' },
      { c: 3, r: 3, k: 'books', s: 7 },
    ],
    [],
  );
  return (
    <group name="collection">
      <RoomShell z0={r.z0} z1={r.z1} hw={r.hw} h={r.h} wall={m.limePlaster} floor={a.travertine} floorTile={1.2} ceiling={a.oakDark} />
      <CofferCeiling z0={r.z0} z1={r.z1} hw={r.hw} h={r.h} />
      {/* back wall: plaster, with a softly lit ivory field behind the grid */}
      <Block x={[-r.hw, r.hw]} y={[0, r.h]} z={[back - 0.4, back]} material={m.limePlaster} tile={2} aligned />
      <Block x={[X0 - 0.1, X1 + 0.1]} y={[Y0, Y1 + 0.1]} z={[back, back + 0.02]} material={a.litIvory} cast={false} />
      <Block x={[X0 - 0.05, X1 + 0.05]} y={[0, Y0]} z={[back, sz + 0.02]} material={a.oak} />
      <GridShelf z={sz} x0={X0} x1={X1} y0={Y0} y1={Y1} cols={cols} rows={rows}>
        {shelfItems.map((it) => {
          const p = cell(it.c, it.r);
          const key = `${it.c}${it.r}`;
          if (it.k === 'books') return <Books key={key} position={[p[0] - 0.42, p[1], p[2]]} n={16} seed={it.s} />;
          if (it.k === 'platform')
            return (
              <group key={key}>
                <IsolationPlatform position={p} w={0.62} d={0.32} />
                <Component position={[p[0], p[1] + 0.094, p[2]]} h={0.1} finish={it.c % 2 ? 'silver' : 'black'} knobs={1} display={false} />
              </group>
            );
          if (it.k === 'component') return <Component key={key} position={[p[0], p[1], p[2] + 0.02]} h={0.1} finish="black" knobs={1} display={false} />;
          if (it.k === 'coil')
            return (
              <group key={key}>
                <CableCoil position={[p[0] - 0.2, p[1], p[2]]} r={0.14} />
                <CableCoil position={[p[0] + 0.22, p[1], p[2]]} r={0.12} bronze />
              </group>
            );
          if (it.k === 'coil-b') return <Books key={key} position={[p[0] - 0.4, p[1], p[2]]} n={8} seed={it.c * 3 + it.r} />;
          return (
            <group key={key}>
              <Vessel position={[p[0] - 0.18, p[1], p[2]]} scale={1.7} />
              <Vessel position={[p[0] + 0.2, p[1], p[2]]} scale={1.15} />
            </group>
          );
        })}
      </GridShelf>

      {/* perforated oak side walls */}
      <PerforatedWall x={-r.hw} face={1} z0={-45.6} z1={-36.8} y0={0.3} y1={3.9} />
      <PerforatedWall x={r.hw} face={-1} z0={-45.6} z1={-36.8} y0={0.3} y1={3.9} />

      <EquipmentRack position={[-3.45, 0, back + 1.3]} rotationY={0.4} />
      <EquipmentRack position={[3.45, 0, back + 1.3]} rotationY={-0.4} />

      {/* lounge: bouclé sofas facing over a marble table */}
      <Rug x={0} z={back + 4.1} w={5.0} d={3.4} />
      <BoucleSofa position={[-2.15, 0, back + 4.1]} rotationY={Math.PI / 2} w={2.2} />
      <BoucleSofa position={[2.15, 0, back + 4.1]} rotationY={-Math.PI / 2} w={2.2} />
      <MarbleTable position={[0, 0, back + 4.1]} r={0.62} />
      <Books position={[-0.3, 0.418, back + 4.05]} rotationY={Math.PI / 2} n={3} seed={11} />
      <CableCoil position={[0.2, 0.418, back + 4.15]} r={0.1} bronze />

      <Spot pos={[0, r.h - 0.2, back + 3.6]} target={[0, 1.9, sz - 0.2]} intensity={22} angle={0.55} distance={9} shadow={shadows} />
      <Spot pos={[-2.1, r.h - 0.2, back + 3.2]} target={[-3.45, 0.9, back + 1.3]} intensity={16} angle={0.36} distance={8} />
      <Spot pos={[2.1, r.h - 0.2, back + 3.2]} target={[3.45, 0.9, back + 1.3]} intensity={16} angle={0.36} distance={8} />
    </group>
  );
}

export function Gallery({ shadows }: { shadows: boolean }) {
  return (
    <group>
      <SplashSet />
      <Antechamber />
      <HiFiRoom shadows={shadows} />
      <HeadfiRoom shadows={shadows} />
      <CollectionGallery shadows={shadows} />
    </group>
  );
}
