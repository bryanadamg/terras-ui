import type { CSSProperties, ReactNode } from 'react';

export interface TableProps {
  minWidth?: number | string;
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
