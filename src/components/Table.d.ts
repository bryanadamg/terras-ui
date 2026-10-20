import type { ReactElement, CSSProperties, ReactNode, ThHTMLAttributes } from 'react';

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
  /** Optional muted glyph above the message — any node from your own icon set. */
  icon?: ReactNode;
  children: ReactNode;
}

declare function EmptyRow(props: EmptyRowProps): ReactElement;

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

declare function SortMark(props: SortMarkProps): ReactElement | null;
declare function SortableTh(props: SortableThProps): ReactElement;

export interface RowSelection<T> {
  /** key -> row, for the bulk action and each row's own `checked` test. */
  selected: Record<string, T>;
  keys: string[];
  items: T[];
  entries: [string, T][];
  count: number;
  isSelected: (row: T) => boolean;
  isSelectedKey: (key: string) => boolean;
  toggle: (row: T) => void;
  /** For rows handed to a memoised child that only knows the key. */
  toggleKey: (key: string) => void;
  deselectKey: (key: string) => void;
  /** Header checkbox: adds/removes every eligible row on the current page. */
  togglePage: () => void;
  allPageSelected: boolean;
  /** Some — but not all — of this page is selected: the indeterminate state. */
  someSelected: boolean;
  /** Eligible rows on this page; 0 means the header checkbox has nothing to do. */
  pageEligibleCount: number;
  clear: () => void;
}

/**
 * Multi-select for a bulk-action list. Keeps the row objects, survives paging;
 * select-all covers the current page only.
 */
export declare function useRowSelection<T>(
  rows: T[],
  keyOf: (row: T) => string,
  opts?: { selectable?: (row: T) => boolean },
): RowSelection<T>;

export interface RowCheckboxProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  title?: string;
  /** Names the row for screen readers: "Select WO-1042". */
  label?: string;
}

export interface SelectAllCheckboxProps {
  allSelected: boolean;
  someSelected: boolean;
  onChange: () => void;
  disabled?: boolean;
  title?: string;
}

export interface ControlCellProps {
  tdStyle?: CSSProperties;
  tdClassName?: string;
}

/** Width of the leading checkbox column, in px. */
export declare const CHECK_COL_W: number;

declare function RowCheckbox(props: RowCheckboxProps): ReactElement;
declare function SelectAllCheckbox(props: SelectAllCheckboxProps): ReactElement;
declare function RowCheckboxCell(props: RowCheckboxProps & ControlCellProps): ReactElement;
declare function SelectAllCell(props: SelectAllCheckboxProps & ControlCellProps): ReactElement;

export type RowState = 'expanded' | 'selected' | 'highlighted';

/** Row ground for one of the three row states (a `var(--terras-row-state-*)`). */
export declare function rowStateBg(state: RowState): string;

/** Width of the chevron column, in px. */
export declare const EXPANDER_COL_W: number;

export interface ExpandToggleProps {
  expanded: boolean;
  /** Same handler the row's onClick uses; the button stops propagation. */
  onToggle: () => void;
  /** What is disclosed, for the accessible name ("Show lot lineage"). Default "details". */
  label?: string;
  /** id of the panel, for aria-controls. */
  panelId?: string;
  /** `alert` recolours the open glyph when the panel holds a problem. */
  tone?: 'default' | 'alert';
  /** Replaces the chevron — it is rotated 90° when open, so pass a right-pointing glyph. */
  icon?: ReactNode;
  style?: CSSProperties;
}

export interface ExpandedRowPanelProps {
  children: ReactNode;
  id?: string;
  /** Override the selection-blue rail where it carries meaning. */
  railColor?: string;
  style?: CSSProperties;
}

export interface ExpandedRowPanelBodyProps {
  children: ReactNode;
  style?: CSSProperties;
}

/** The panel frame as a style, for a `<td>` that can't hold the component. */
export declare function expandedRowFrame(railColor?: string): CSSProperties;

declare function ExpandToggle(props: ExpandToggleProps): ReactElement;
declare function ExpanderCell(props: ExpandToggleProps & ControlCellProps): ReactElement;
declare function ExpandedRowPanel(props: ExpandedRowPanelProps): ReactElement;
declare function ExpandedRowPanelBody(props: ExpandedRowPanelBodyProps): ReactElement;

declare function Table(props: TableProps): ReactElement;
declare namespace Table {
  export {
    EmptyRow, SortableTh, SortMark, RowCheckbox, SelectAllCheckbox, RowCheckboxCell, SelectAllCell,
    ExpandToggle, ExpanderCell, ExpandedRowPanel, ExpandedRowPanelBody,
  };
}

export {
  Table, EmptyRow, SortableTh, SortMark, RowCheckbox, SelectAllCheckbox, RowCheckboxCell, SelectAllCell,
  ExpandToggle, ExpanderCell, ExpandedRowPanel, ExpandedRowPanelBody,
};
export default Table;
