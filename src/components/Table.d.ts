import type { CSSProperties, ReactNode } from 'react';

export interface TableProps {
  minWidth?: number | string;
  /**
   * Freeze this many leading columns while the rest scroll horizontally —
   * Excel's freeze panes, for a table too wide to read without losing which
   * row you are on. Offsets are measured from the laid-out cells, so the
   * frozen columns can be content-sized.
   *
   * A row whose cell spans across the boundary (a `colSpan` group header) is
   * left unfrozen rather than pinned too wide.
   */
  stickyCols?: number;
  style?: CSSProperties;
  className?: string;
  children: ReactNode;
}

export interface EmptyRowProps {
  colSpan: number;
  children: ReactNode;
}

declare function EmptyRow(props: EmptyRowProps): JSX.Element;

declare function Table(props: TableProps): JSX.Element;
declare namespace Table {
  export { EmptyRow };
}

export { Table, EmptyRow };
export default Table;
