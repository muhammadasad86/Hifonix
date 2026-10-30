export interface HandwritingStroke {
  /** polyline in font units (y down, baseline at 0) */
  d: string;
  /** path length, font units */
  len: number;
  /** nib width that fully covers the stroke, font units */
  w: number;
}

export interface HandwritingData {
  text: string;
  /** advance width, font units (1 em = 1000) */
  advance: number;
  /** ink bounds [xMin, yMin, xMax, yMax], font units, y down */
  box: number[];
  ascent: number;
  descent: number;
  /** exact glyph outlines */
  fill: string;
  /** pen strokes in writing order */
  strokes: HandwritingStroke[];
}
