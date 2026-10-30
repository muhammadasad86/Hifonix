/** True when a WebGL2 context can be created (R3F / three r16x requirement). */
export function supportsWebGL2(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** Coarse device tier used to scale DPR, shadows and texture sizes. */
export function deviceTier(): 'high' | 'low' {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const lowMem = (nav.deviceMemory ?? 8) <= 4;
  const lowCpu = (navigator.hardwareConcurrency ?? 8) <= 4;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  return lowMem || (lowCpu && coarse) ? 'low' : 'high';
}
