import type { CSSProperties } from 'react';
import type { ShellTone } from './types';

/** `cssVar('win-bg', '#ece9d8')` → `"var(--terras-win-bg, #ece9d8)"`. */
export declare function cssVar(name: string, fallback?: string): string;

export declare const font: string;
export declare const fontMono: string;

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
