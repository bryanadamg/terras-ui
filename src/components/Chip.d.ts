import type { CSSProperties, ReactNode } from 'react';
import type { ChipFamily } from './types';

export interface ChipProps {
  family?: ChipFamily;
  /** Filled face instead of the tint, for a chip that has to shout. */
  solid?: boolean;
  /** Monospace + tabular, for code / reference chips stacked in a column. */
  mono?: boolean;
  title?: string;
  style?: CSSProperties;
  children: ReactNode;
}

declare function Chip(props: ChipProps): JSX.Element;

export declare const FAMILIES: ChipFamily[];
export { Chip };
export default Chip;
