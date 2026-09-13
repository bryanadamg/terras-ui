export declare const UI_SCALES: number[];
export declare const DEFAULT_UI_SCALE: number;
export declare const STORAGE_KEY: string;
export declare const ATTRIBUTE: string;

export interface LayoutRect {
  top: number; bottom: number; left: number; right: number; width: number; height: number;
}

export declare function normalizeScale(value: unknown): number;
export declare function readUiScale(): number;
export declare function applyUiScale(scale: number): number;
export declare const bootScript: string;

export declare function uiZoom(): number;
export declare function toLayoutPx(px: number): number;
export declare function layoutRectOf(el: Element): LayoutRect;
export declare function layoutViewport(): { width: number; height: number };
export declare function layoutScroll(): { x: number; y: number };
