import type { CSSProperties, ReactNode, ThHTMLAttributes } from 'react';

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

/** Current sort: which column, ascending (1) or descending (-1); null = unsorted. */
export type SortState = { key: string; dir: 1 | -1 } | null;

/** unsorted -> asc -> desc -> unsorted; a different column starts at asc. */
export declare function nextSortState(prev: SortState, key: string): SortState;

/** Sort state for a list the server sorts (the view holds one page). */
export declare function useServerSort(initial?: SortState): {
  sort: SortState;
  setSort: (next: SortState | ((prev: SortState) => SortState)) => void;
  toggleSort: (key: string) => void;
};

/**
 * Client-side sort over the whole set. `columns` maps key -> accessor; empty
 * values sort last in both directions.
 */
export declare function useSortable<T>(
  rows: T[],
  columns: Record<string, (row: T) => unknown>,
  initialSort?: SortState,
): { sorted: T[]; sort: SortState; toggle: (key: string) => void };

export interface SortMarkProps {
  sort: SortState | undefined;
  colKey: string;
}

export interface SortableThProps extends ThHTMLAttributes<HTMLTableCellElement> {
  sort?: SortState;
  /** null/absent renders a plain, inert header. */
  colKey?: string | null;
  onSort?: (key: string) => void;
  children?: ReactNode;
}

declare function SortMark(props: SortMarkProps): JSX.Element | null;
declare function SortableTh(props: SortableThProps): JSX.Element;

declare function Table(props: TableProps): JSX.Element;
declare namespace Table {
  export { EmptyRow, SortableTh, SortMark };
}

export { Table, EmptyRow, SortableTh, SortMark };
export default Table;
