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
  title?: string;
}

export interface SidebarSectionSpec {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  /** Trailing adornment in the section band, e.g. a chevron or a count. */
  right?: ReactNode;
  onClick?: () => void;
  items: SidebarItemSpec[];
}

/** Title-bar / panel colour, matching the five status families. */
export type ShellTone = 'blue' | 'red' | 'amber' | 'green' | 'grey';

export type ButtonTone = 'default' | 'primary' | 'success' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ChipFamily = 'gray' | 'amber' | 'blue' | 'green' | 'red';

export type WindowFill = 'page' | 'flex' | false;

export type Style = CSSProperties;
