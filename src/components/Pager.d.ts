import type { CSSProperties, ReactNode } from 'react';

export interface PagerProps {
  /** 1-based. Clamped into `1..pages`, so a stale page past a shrunken total
   *  renders the last page rather than an empty window. */
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  /** Render nothing when `total` is 0. Default: always render. */
  hideWhenEmpty?: boolean;
  /** Replaces the default "from-to of total" text — e.g. a selection count. */
  leftContent?: ReactNode;
  /**
   * Drop the strip and stretch to fill a `Window.StatusBar` the caller is
   * already rendering (summary left, nav right, the bar's own `right` slot left
   * free). Without it the Pager *is* a `Window.StatusBar`.
   */
  inline?: boolean;
  /** Defaults "‹ Prev" / "Next ›" — pass a node to use your own icon set. */
  prevLabel?: ReactNode;
  nextLabel?: ReactNode;
  /** Defaults to "Pagination". */
  ariaLabel?: string;
  style?: CSSProperties;
  /** Passed through in both forms — e.g. the app's own `no-print`. */
  className?: string;
}

declare function Pager(props: PagerProps): JSX.Element | null;

export { Pager };
export default Pager;
