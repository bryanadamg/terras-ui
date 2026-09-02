import type { CSSProperties, ReactNode } from 'react';
import type { FilterChipOption } from './types';

export interface FilterChipBarProps {
  /** Plain strings, or option objects for a tally / coloured fill / per-value lock. */
  options: Array<string | FilterChipOption>;
  /** Selected value, or the selected set when the bar is multi-select. */
  value: string | string[] | null;
  /** Always receives the single value that was clicked — for a multi-select bar
   *  the caller does the add/remove. */
  onChange: (value: string) => void;
  /** Whole-bar lock (permission, busy, row locked). */
  disabled?: boolean;
  /** Extra segment(s) appended flush after the options — a clear/undo action
   *  that isn't itself a selectable value. */
  trailing?: ReactNode;
  flat?: boolean;
  ariaLabel?: string;
  style?: CSSProperties;
}

declare function FilterChipBar(props: FilterChipBarProps): JSX.Element;

export { FilterChipBar };
export default FilterChipBar;
