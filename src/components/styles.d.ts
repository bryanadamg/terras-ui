import type { CSSProperties } from 'react';
import type { ChipSeg, ShellTone, ToggleTone } from './types';

/** `cssVar('win-bg', '#ece9d8')` → `"var(--terras-win-bg, #ece9d8)"`. */
export declare function cssVar(name: string, fallback?: string): string;

export declare const font: string;
export declare const fontMono: string;

/**
 * The classic type scale as `var(--terras-fs-*)` strings — `base` 11px
 * (controls, body, table head), `sm` 10px (caps labels, chips, sub-text),
 * `sub` 10.5px (sidebar sub-item), `title` 12px (title bar, lg button, cell).
 * Four steps because that's what erp paints; it has no ramp. Use these over a
 * bare number, and check erp before adding a step.
 */
export declare const fs: Record<'sub' | 'sm' | 'base' | 'title', string>;

/** Uppercase micro-label tracking (0.5px) — pairs with `fs.sm` + bold + caps. */
export declare const trackingCaps: string;

/** Two-tone 1px bevel: light top/left + dark bottom/right = raised. */
export declare function raised(light: string, dark: string): CSSProperties;

/** Outer frame of a top-level view — 2px bevel, drop shadow, 8px radius, clipped. */
export declare function bevel(extra?: CSSProperties): CSSProperties;

/** Square raised panel — the inner surface a table or form sits on. */
export declare function panel(extra?: CSSProperties): CSSProperties;

export declare function titleBar(extra?: CSSProperties, tone?: ShellTone): CSSProperties;
export declare const TITLE_TONES: Record<ShellTone, { background: string; border: string }>;

export declare function toolbar(extra?: CSSProperties): CSSProperties;
export declare const separator: CSSProperties;

/** Recessed field face — blue-gray border, white well. */
export declare function field(extra?: CSSProperties): CSSProperties;

export declare function button(extra?: CSSProperties): CSSProperties;
export declare const BTN_TONES: Record<'default' | 'primary' | 'success' | 'danger', CSSProperties>;

export interface ToggleChipFace {
  on?: boolean;
  tone?: ToggleTone;
  seg?: ChipSeg;
  flat?: boolean;
  toneIdle?: boolean;
  minWidth?: number;
}

/**
 * Pressed/unpressed chip face. Pair it with the `terras-toggle` class (plus
 * `terras-toggle-on` / `terras-toggle-flat`) so chrome.css can carry the
 * hover/press motion and the segment z-index.
 */
export declare function toggleChip(extra: CSSProperties | undefined, opts?: ToggleChipFace): CSSProperties;
/** Tone → its hover-glow colour, used as the fallback when tokens.css is absent. */
export declare const TOGGLE_TONES: Record<ToggleTone, string>;

/** Segment position for the i-th of `len` members of a flush group. */
export declare function segAt(i: number, len: number): ChipSeg;
