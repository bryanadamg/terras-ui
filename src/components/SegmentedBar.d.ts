import type { ReactElement, CSSProperties } from 'react';
import type { SegmentedAction } from './types';

export type { SegmentedAction };

export interface SegmentedBarProps {
  actions: SegmentedAction[];
  /** Whole-bar lock. */
  disabled?: boolean;
  ariaLabel?: string;
  style?: CSSProperties;
}

declare function SegmentedBar(props: SegmentedBarProps): ReactElement;

export { SegmentedBar };
export default SegmentedBar;
