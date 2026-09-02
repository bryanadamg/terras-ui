import type { CSSProperties, ReactNode } from 'react';

export interface TabDef<K extends string = string> {
  key: K;
  /** A node, not a string, so a tab can carry a small state marker beside its text. */
  label: ReactNode;
  /** Any ReactNode — this package has no icon-set opinion. */
  icon?: ReactNode;
  title?: string;
  disabled?: boolean;
}

export interface TabsProps<K extends string = string> {
  tabs: TabDef<K>[];
  activeKey: K;
  onChange: (key: K) => void;
  /** Trailing control pushed to the far end of the strip, e.g. a refresh button. */
  right?: ReactNode;
  ariaLabel?: string;
  style?: CSSProperties;
}

declare function Tabs<K extends string = string>(props: TabsProps<K>): JSX.Element;

export { Tabs };
export default Tabs;
