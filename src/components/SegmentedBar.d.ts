import type { CSSProperties } from 'react';
import type { SegmentedAction } from './types';

export interface SegmentedBarProps {
  actions: SegmentedAction[];
  /** Whole-bar lock. */
  disabled?: boolean;
  ariaLabel?: string;
  style?: CSSProperties;
}

declare function SegmentedBar(props: SegmentedBarProps): JSX.Element;

export { SegmentedBar };
export default SegmentedBar;
