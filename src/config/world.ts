/**
 * World dimensions — single source of truth (metres, Y-up).
 *
 * Street runs along X. The shopfront glazing line sits at z = 0 and faces +Z
 * (the pavement). The studio interior occupies z < 0. Every facade / interior
 * component derives its geometry from these values, so matching the real
 * storefront reference is a matter of editing numbers here, not geometry code.
 *
 * Exterior direction: contemporary Middle Eastern artisan luxury — deep limestone
 * portal, frameless glazing, oak reveals, bronze arch entrance, plaster upper storey.
 */
export const WORLD = {
  facade: {
    width: 10, // party wall to party wall
    pilasterWidth: 0.42, // limestone portal jamb width (inner face = interior wall line)
    pilasterDepth: 0.6, // portal projection in front of the glazing line
    shopfrontHeight: 3.55, // top of glazing / underside of portal header
    fasciaHeight: 1.0, // limestone portal header (signage band)
    fasciaDepth: 0.6, // header front face = portal front
    corniceDepth: 0.62,
    corniceHeight: 0.03, // bronze coping on the header
    upperHeight: 4.0, // plaster upper storey above the portal
    parapetHeight: 0.2,
    stallRiserHeight: 0.36, // low limestone plinth under the glazing
    mullion: 0.05, // slim black frame section
    transomHeight: 2.62, // arch spring line / lobby soffit
  },
  entrance: {
    width: 1.62, // structural opening at glazing line
    doorLeafWidth: 1.06,
    doorHeight: 2.5,
    recessDepth: 0.85, // lobby set-back; door plane at z = -recessDepth
  },
  street: {
    pavementDepth: 5.2,
    kerbHeight: 0.12,
    roadDepth: 9,
    extent: 70, // half-length along X
  },
  interior: {
    width: 9.16, // inner face of pilasters
    depth: 12,
    height: 3.5,
  },
} as const;

export const DERIVED = (() => {
  const f = WORLD.facade;
  const e = WORLD.entrance;
  const halfW = f.width / 2;
  const shopHalfW = halfW - f.pilasterWidth;
  const fasciaTop = f.shopfrontHeight + f.fasciaHeight;
  const corniceTop = fasciaTop + f.corniceHeight;
  const eaves = corniceTop + f.upperHeight;
  return {
    halfW,
    shopHalfW,
    fasciaTop,
    corniceTop,
    eaves,
    buildingTop: eaves + f.parapetHeight,
    doorZ: -e.recessDepth,
    entranceHalfW: e.width / 2,
  };
})();
