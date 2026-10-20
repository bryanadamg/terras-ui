import type { ReactElement, CSSProperties, ReactNode } from 'react';

export interface DetailGridProps {
  /** Stacked layout only. Default 2. */
  columns?: number;
  /** Label left, value right, one pair per line. */
  inline?: boolean;
  style?: CSSProperties;
  children: ReactNode;
}

export interface DetailProps {
  label: ReactNode;
  /** Renders the muted em dash when empty, so the field holds its place. */
  value?: ReactNode;
  /** Span every column — notes, addresses, anything that wraps. */
  wide?: boolean;
  mono?: boolean;
}

/** The muted placeholder for an empty value (U+2014). */
export declare const EMPTY_DASH: string;

declare function Detail(props: DetailProps): ReactElement;
declare function DetailGrid(props: DetailGridProps): ReactElement;
declare namespace DetailGrid {
  export { Detail };
}

export { DetailGrid, Detail };
export default DetailGrid;
