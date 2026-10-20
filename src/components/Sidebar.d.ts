import type { ReactElement, CSSProperties, ReactNode, Ref, UIEvent } from 'react';
import type { SidebarItemSpec, SidebarSectionSpec } from './types';

/** A slot that can adapt itself to the icon rail. Pass a plain node when the
 *  content is small enough to survive collapsing, a function when it isn't. */
export type SidebarSlot = ReactNode | ((state: { collapsed: boolean }) => ReactNode);

export interface SidebarProps {
  appName?: ReactNode;
  brandIcon?: ReactNode;
  /** Slot above the nav — a primary action button, a scan trigger, … */
  top?: SidebarSlot;
  /** Flat rows, rendered above any sections. */
  items?: SidebarItemSpec[];
  /** Grouped nav: a gradient section band followed by its indented children. */
  sections?: SidebarSectionSpec[];
  footer?: SidebarSlot;
  /** Collapse to the icon rail. Controlled — the app owns the state, the same
   *  way it owns each item's `active`. */
  collapsed?: boolean;
  /** Renders the built-in chevron in the brand band. Omit it and no toggle
   *  chrome appears, for an app driving `collapsed` from its own control. */
  onToggleCollapsed?: () => void;
  width?: string | number;
  /** Defaults to `--terras-sidebar-width-collapsed` (44px classic). */
  collapsedWidth?: string | number;
  /** Forwarded to the internal `<nav>` — for an app that persists scroll
   *  position (e.g. `sessionStorage`) across navigations. */
  navRef?: Ref<HTMLElement>;
  onNavScroll?: (e: UIEvent<HTMLElement>) => void;
  style?: CSSProperties;
}

declare function Sidebar(props: SidebarProps): ReactElement;

export { Sidebar };
export default Sidebar;
