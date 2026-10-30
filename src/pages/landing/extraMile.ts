import { span } from '../../ui/chrome/scroll';

/**
 * Timeline values for the black "Going the extra mile…" scene, shared by both
 * landing stories (Figma prototype, both pages):
 *
 *   A  shots small, faint, blurred                      (--g fades them in)
 *   B  shots in place, "Going the extra mile…"           --a
 *   C  shots grow, copy → "Community & Support",
 *      two soft shots surface                            --c
 *   D  first shots grow away and fade; the soft shots
 *      sharpen and grow to 50 %                          --cd
 *   E  everything grows and dissolves while the
 *      newsletter panel slides in from the right         --de
 */
export function extraMileVars(g: number, a: number, c: number, cd: number, de: number) {
  return {
    '--g': g,
    '--a': a,
    '--c': c,
    '--cd': cd,
    '--de': de,
    '--o1': a * (1 - span(c, 0, 0.55)),
    '--o2': span(c, 0.45, 1),
  };
}
