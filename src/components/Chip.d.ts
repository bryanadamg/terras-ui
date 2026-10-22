import type { ReactElement, CSSProperties, HTMLAttributes, ReactNode } from 'react';
import type { ChipFamily } from './types';

/** Any other span attribute passes through — `title`, handlers, `aria-*`. */
export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  family?: ChipFamily;
  /** Filled face instead of the tint, for a chip that has to shout. */
  solid?: boolean;
  /** Monospace + tabular, for code / reference chips stacked in a column. */
  mono?: boolean;
  style?: CSSProperties;
  children: ReactNode;
}

declare function Chip(props: ChipProps): ReactElement;

export declare const FAMILIES: ChipFamily[];
export { Chip };
export default Chip;
