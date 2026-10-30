# Models

Drop GLB files here, then point the matching slot in `src/config/assets.ts` at them.

| Slot | Expected file | Notes |
|---|---|---|
| facadeModel | `storefront/facade.glb` | Optional. Origin at glazing line centre, ground = y 0, facing +Z, metres. |
| windowDisplayLeft / Right | `storefront/window-left.glb` … | Sits on the window bed (top at y 0.60). |
| interiorShell | `interior/studio.glb` | Milestone 2. Inner faces at x ±4.58, depth 12 m, ceiling 3.5 m. |

Export guidance: glTF 2.0 binary, Draco or Meshopt compressed, KTX2 textures ≤ 2K, real-world metres, Y-up.
