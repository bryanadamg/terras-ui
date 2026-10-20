import type { ReactElement, CSSProperties, ReactNode } from 'react';
import type { FilterChipOption, ToggleTone } from './types';

// Re-exported so a consuming app can type its own option/tone maps without
// reaching past the component path it already imports (`types.d.ts` has no
// runtime file, so it is not its own export subpath).
export type { FilterChipOption, ToggleTone };

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

declare function FilterChipBar(props: FilterChipBarProps): ReactElement;

export { FilterChipBar };
export default FilterChipBar;
