/**
 * Live screen-space rectangle (CSS px) of the 3D storefront logo, written
 * every frame by <SignAnchor> inside the Canvas and read by the DOM intro so
 * the full-screen logo can land exactly on the sign. Mutable by design: it
 * updates at frame rate without triggering React renders.
 */
export const signAnchor = {
  ready: false,
  left: 0,
  top: 0,
  width: 0,
  height: 0,
};
