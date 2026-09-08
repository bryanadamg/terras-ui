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
   * the same slice of the city at any pitch. Sub-one-grid-cell-per-dot by
   * design (5 against the shipped 320-cell grid's ~8px/cell) so the field
   * oversamples rather than aliases; zoom out by regenerating the grid with a
   * larger `--distance`. Default 5.
   */
  pitch?: number;
  /** Px square per dot. Default 2. */
  dotSize?: number;
  /**
   * Peak alpha of the brightest level; the two dimmer levels scale off it.
   * Defaults to `--terras-login-dot-opacity`, then 0.45.
   */
  opacity?: number;
  /** Overrides `--terras-login-dot`. */
  color?: string;
  /** Overrides `--terras-login-dot-blink`. */
  blinkColor?: string;
  /** Default true. Forced off under `prefers-reduced-motion`. */
  blink?: boolean;
  /**
   * Cursor trails: the pointer IGNITES the dots it sweeps over and each one
   * decays on its own clock, so the cursor leaves a wake rather than dragging a
   * halo. Dots grow (size, never brightness alone — a halftone encodes tone as
   * dot size, and growth cannot eat the contrast the UI on top needs) with a
   * small alpha lift that is masked like everything else, and blinks drift
   * toward the pointer. Default true; forced off under
   * `prefers-reduced-motion` and on coarse pointers, which have no hover. The
   * listener goes on the canvas's parent, since the canvas is pointer-events:none.
   */
  hover?: boolean;
  /**
   * Ellipses where the field fades out so UI on top of it stays readable — a
   * form column, typically. All four values are fractions of the canvas (`x`/`rx`
   * of its width, `y`/`ry` of its height); `strength` is how much is removed at
   * the centre, 0..1, default 1. The component has no idea where a form sits, so
   * the caller supplies the shape. Pass a stable array (module constant or
   * memoized) — a fresh literal each render repaints the field.
   */
  quietZones?: Array<{
    x: number;
    y: number;
    rx: number;
    ry: number;
    /** Fraction of the radius erased flat at full strength before the feather starts, 0..1. Default 0. */
    inner?: number;
    strength?: number;
  }>;
  /**
   * Which part of the grid the crop keeps, 0..1 per axis, default centred
   * (`{x: 0.5, y: 0.5}`). Cover-fit fills one axis exactly and crops the other,
   * so only the cropped axis has slack to spend: a wide viewport picks the
   * horizontal band, a portrait one picks the column. Values are clamped, so the
   * crop can never expose the grid's edge.
   */
  focus?: { x?: number; y?: number };
  /**
   * Fraction of the canvas width the dot field covers, anchored at the left
   * edge. Default 1. Under 1 this is the only way to move the city sideways —
   * cover-fit fills the width exactly, so `focus.x` has no slack to spend on a
   * wide viewport — and it crops less off the top and bottom as a side effect,
   * since a narrower box needs less scale to cover.
   */
  spanX?: number;
  /**
   * Horizontal taper, as fractions of the canvas width: untouched at `start`,
   * fully removed at `end` (`strength` 0..1 sets how much is removed, default
   * 1). Pair it with `spanX` so the lattice's own right edge sits inside the
   * faded part — a field that just stops is a visible seam.
   */
  fadeX?: { start?: number; end?: number; strength?: number };
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
