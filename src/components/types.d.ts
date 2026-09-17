// Shared prop shapes for the Terras UI components.
//
// The components themselves are hand-written CommonJS + React.createElement (no
// build step, see CLAUDE.md), so these declarations are hand-written too and
// must be kept in step with the .js by hand — same rule as tokens.json ↔
// tokens.css. When you add a prop, add it here in the same commit.

import type { CSSProperties, ReactNode } from 'react';

export interface SidebarItemSpec {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  active?: boolean;
  /** Indented, tinted nav row — a child of a section header. */
  sub?: boolean;
  onClick: () => void;
  /** App-level hover hook (e.g. a debounced route/data prefetch) — separate
   *  from the component's own hover state, which only drives paint. */
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  title?: string;
}

export interface SidebarSectionSpec {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  /** Trailing adornment in the section band, e.g. a chevron or a count. */
  right?: ReactNode;
  /** The section's own page is current (e.g. its mini-dashboard route) —
   *  distinct from a child item being active; a section can be "where you
   *  are" with no child row selected. */
  active?: boolean;
  onClick?: () => void;
  items: SidebarItemSpec[];
}

/** Title-bar / panel colour, matching the five status families. */
export type ShellTone = 'blue' | 'red' | 'amber' | 'green' | 'grey';

export type ButtonTone = 'default' | 'primary' | 'success' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ChipFamily = 'gray' | 'amber' | 'blue' | 'green' | 'red';

/** Selected-fill colour for a ToggleChip. Four tones, no grey — this says
 *  "pressed", not "what state is this row in" (that is `ChipFamily`). */
export type ToggleTone = 'blue' | 'green' | 'red' | 'amber';

/** Toast colour. The same four words as `ToggleTone` on purpose — the named
 *  methods (`success`/`error`/`warn`/`info`) carry the semantics, so the tone
 *  stays a colour and this package keeps one tone vocabulary. */
export type ToastTone = 'green' | 'red' | 'amber' | 'blue';

/** Position inside a segmented (flush) group. */
export type ChipSeg = 'first' | 'mid' | 'last' | 'only';

export interface FilterChipOption {
  value: string;
  /** Defaults to `value`. */
  label?: ReactNode;
  /** Renders a tally after the label — "PENDING (4)". */
  count?: number;
  /** Selected fill when the value carries its own semantics (In=green, Out=red). */
  tone?: ToggleTone;
  title?: string;
  /** Locks just this segment — distinct from the bar-level `disabled`. */
  disabled?: boolean;
}

export interface SegmentedAction {
  key: string;
  label: ReactNode;
  onClick: () => void;
  title?: string;
  disabled?: boolean;
}

export type WindowFill = 'page' | 'flex' | false;

export type Style = CSSProperties;
