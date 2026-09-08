import type { CSSProperties } from 'react';

/**
 * A city rasterized to a level grid. Generated offline by
 * `tools/city-matrix/generate.py`; ship the emitted module rather than
 * hand-writing one. `cells` is base64, two bits per cell, row-major.
 */
export interface CityMatrixData {
  city?: string;
  w: number;
  h: number;
  /** Always 4 (level 0 = off, 1-3 = increasing road density). */
  levels?: number;
  cells: string;
}

export interface CityMatrixProps {
  /** The generated grid, e.g. `require('@bryanadamg/terras-ui/assets/cityMatrix.tangerang')`. */
  data: CityMatrixData;
  /**
   * Px between dot centres. A constant by design — the city is cover-fit into
   * however many cells fit, so this is the halftone screen's gauge and not a
   * fraction of the viewport. It sets dot density, NOT zoom — cover-fit shows
   * the same slice of the city at any pitch. Keep it near one grid cell per
   * dot (8 against the shipped 320-cell grid); zoom out by regenerating the
   * grid with a larger `--distance`. Default 8.
   */
  pitch?: number;
  /** Px square per dot. Default 3. */
  dotSize?: number;
  /**
   * Peak alpha of the brightest level; the two dimmer levels scale off it.
   * Defaults to `--terras-login-dot-opacity`, then 0.5.
   */
  opacity?: number;
  /** Overrides `--terras-login-dot`. */
  color?: string;
  /** Overrides `--terras-login-dot-blink`. */
  blinkColor?: string;
  /** Default true. Forced off under `prefers-reduced-motion`. */
  blink?: boolean;
  style?: CSSProperties;
}

/** Unpacks `data.cells` to one level per byte. Memoized per data object. */
export declare function decode(data: CityMatrixData): Uint8Array;

/**
 * Paints a generated city grid as a field of dots on a single `<canvas>`,
 * absolutely positioned to fill its parent (give that parent `position:
 * relative`), `pointer-events: none` and `aria-hidden`. Randomly chosen dots
 * blink; the base field is painted once per resize.
 */
declare function CityMatrix(props: CityMatrixProps): JSX.Element | null;

declare namespace CityMatrix {
  export { decode };
}

export { CityMatrix };
export default CityMatrix;
