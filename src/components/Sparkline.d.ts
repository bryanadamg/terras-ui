import type { CSSProperties, ReactNode } from 'react';
import type { ChipFamily } from './types';

export interface SparklineProps {
  /** Evenly spaced series, oldest first. Fewer than two points renders `emptyText`. */
  values: number[];
  /** Accessible name — what the line is a trend of. */
  label: string;
  /** Status family for the stroke. Default `blue`. */
  family?: ChipFamily;
  /** px, default 120. */
  width?: number;
  /** px, default 28. */
  height?: number;
  /** Shown instead of a line when there is not enough history. */
  emptyText?: ReactNode;
  style?: CSSProperties;
}

declare function Sparkline(props: SparklineProps): JSX.Element;

export { Sparkline };
export default Sparkline;
