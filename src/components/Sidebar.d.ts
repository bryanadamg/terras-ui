import type { CSSProperties, ReactNode } from 'react';
import type { SidebarItemSpec, SidebarSectionSpec } from './types';

export interface SidebarProps {
  appName?: ReactNode;
  brandIcon?: ReactNode;
  /** Slot above the nav — a primary action button, a scan trigger, … */
  top?: ReactNode;
  /** Flat rows, rendered above any sections. */
  items?: SidebarItemSpec[];
  /** Grouped nav: a gradient section band followed by its indented children. */
  sections?: SidebarSectionSpec[];
  footer?: ReactNode;
  width?: string | number;
  style?: CSSProperties;
}

declare function Sidebar(props: SidebarProps): JSX.Element;

export { Sidebar };
export default Sidebar;
