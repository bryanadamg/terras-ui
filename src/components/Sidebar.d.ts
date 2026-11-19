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
  /** Grouped nav: a section band followed by its indented children. */
  sections?: SidebarSectionSpec[];
  /** Slot after the last nav row, inside the scrolling list — a credit line,
   *  a version stamp. Scrolls with the nav; `footer` stays pinned below it. */
  navEnd?: SidebarSlot;
  footer?: SidebarSlot;
  /** Collapse to the icon rail. Controlled — the app owns the state, the same
   *  way it owns each item's `active`. */
  collapsed?: boolean;
  /** Renders the built-in chevron in the brand band. Omit it and no toggle
   *  chrome appears, for an app driving `collapsed` from its own control. */
  onToggleCollapsed?: () => void;
  /** Hover-to-expand: `collapsed` becomes "not pinned". The rail rests at icon
   *  width and opens while the pointer (after 120ms) or keyboard focus is in
   *  it, closing 200ms after both leave — or at once when the pointer leaves
   *  rightward at speed. With `onToggleCollapsed`, the band's
   *  control pins and unpins it (`pinIcon`, or » / «). */
  expandOnHover?: boolean;
  /** With `expandOnHover`: start opening before contact, when the pointer is
   *  within this many layout px of the rail's edge and heading into it (its
   *  last move, carried four moves ahead, reaches the edge). Slowing into,
   *  pausing or working beside the rail never opens it.
   *  Default 0 = contact only. */
  approachDistance?: number;
  /** With `expandOnHover` + `onToggleCollapsed`: draws the band's pin control —
   *  a slot, since this package carries no icon set. `pinned` is `!collapsed`;
   *  the control is `aria-pressed` while pinned. Without it, » (pin) and «
   *  (unpin). */
  pinIcon?: (state: { pinned: boolean }) => ReactNode;
  /** With `approachDistance`: proximity inside the zone, 0 (far edge or
   *  beyond) → 1 (touching the rail), in hundredths — also written as the
   *  `--terras-sidebar-approach` custom property on the <aside>. For growing
   *  the rail with the cursor's distance; the package itself draws nothing
   *  from it. Back to 0 once the rail opens or the pointer leaves the zone. */
  onApproach?: (progress: number) => void;
  /** The width the rail is drawn at changed — `true` when it shows full width,
   *  pinned or hover-opened. For a layout that has to follow it. Also fires on
   *  mount with the initial state. */
  onExpandedChange?: (expanded: boolean) => void;
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
