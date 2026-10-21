import type { ReactElement, CSSProperties, RefObject } from 'react';

export interface SkeletonBarProps {
  width?: number | string;
  /** px, default 9. */
  height?: number;
}

export interface TableSkeletonProps {
  /** Row count when `fillHeight` is unknown — `SKEL_PAGE_ROWS` for a full page. Default 6. */
  rows?: number;
  /** Column count — measure it with `useTableSkeletonMetrics`, don't count by hand. */
  cols: number;
  /** Only when the real cells carry their own inline style; `.terras-table` rules apply either way. */
  tdStyle?: CSSProperties;
  /** Measured height of a real row, in px. */
  rowHeight?: number;
  /** Free height below the header, in px — rows are generated to fill it. */
  fillHeight?: number;
  /** Ground for every second row, for a table whose real rows are zebra-striped
   *  (erp's list views: `'#f5f3ee'`). Omit for a ruled `.terras-table`. */
  stripe?: string;
}

export interface TableSkeletonMetrics {
  /** Height of a real row in layout px — undefined until one has been measured. */
  rowHeight?: number;
  /** Column count read from the table's own <thead>. */
  cols?: number;
  /** Free height under the header inside the scroll container, in px. */
  fillHeight?: number;
}

export interface ListSkeletonProps {
  rows?: number;
  padding?: string;
}

export interface PanelSkeletonProps {
  sections?: number;
  /** Label/value rows per section. */
  rows?: number;
  caption?: boolean;
}

export interface CardGridSkeletonProps {
  count?: number;
  /** Must match the real grid's minmax() floor. */
  minWidth?: number;
  gap?: number;
  /** Draw the title strip cards carry across their top. */
  headerStrip?: boolean;
  bodyLines?: number;
  /** Draw a progress-bar-shaped block under the lines. */
  bar?: boolean;
  bodyHeight?: number;
}

export interface TableBlockSkeletonProps {
  cols?: number;
  rows?: number;
  header?: boolean;
  rowHeight?: number;
  /** Ground for every second row, as on `TableSkeleton`. */
  stripe?: string;
}

export interface LoadingProps {
  /** Default "Loading..."; pass null for the bare track. */
  label?: string | null;
  /** Cover the viewport on the window background. */
  fullScreen?: boolean;
  style?: CSSProperties;
}

/** Rows to draw for a full-page list before its free height is measured. */
export declare const SKEL_PAGE_ROWS: number;

export declare function SkeletonBar(props: SkeletonBarProps): ReactElement;
export declare function TableSkeleton(props: TableSkeletonProps): ReactElement;
export declare function useTableSkeletonMetrics(
  key: string,
  bodyRef: RefObject<HTMLElement | null>,
  hasRows: boolean,
): TableSkeletonMetrics;
export declare function ListSkeleton(props: ListSkeletonProps): ReactElement;
export declare function PanelSkeleton(props: PanelSkeletonProps): ReactElement;
export declare function CardGridSkeleton(props: CardGridSkeletonProps): ReactElement;
export declare function TableBlockSkeleton(props: TableBlockSkeletonProps): ReactElement;
export declare function Loading(props: LoadingProps): ReactElement;
