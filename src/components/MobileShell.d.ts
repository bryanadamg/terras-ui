import type { ReactElement, ReactNode, CSSProperties, HTMLAttributes } from 'react';

export interface MobileNavItem {
  key: string;
  label: ReactNode;
  /** Any ReactNode — this package has no icon-set opinion. */
  icon?: ReactNode;
  active?: boolean;
  onClick: () => void;
}

export interface MobileNavSection {
  key: string;
  label: ReactNode;
  items: MobileNavItem[];
}

export interface MobileShellProps extends HTMLAttributes<HTMLDivElement> {
  /** The app's header, rendered as-is above the page. */
  header?: ReactNode;
  /** The routed page. Stays mounted while the menu sheet is open. */
  children?: ReactNode;
  /** Bottom tabs. While the menu is open none shows active. */
  tabs: MobileNavItem[];
  /** Full-menu sections. Given → a trailing menu tab is added, lit while the
   *  sheet is open or when no tab is active. */
  menu?: MobileNavSection[];
  /** Controlled. Picking a tab or a row asks to close it. */
  menuOpen?: boolean;
  onMenuOpenChange?: (open: boolean) => void;
  /** The menu tab's label. Default 'Menu'. */
  menuLabel?: ReactNode;
  menuIcon?: ReactNode;
  /** The scrolling page area. */
  bodyStyle?: CSSProperties;
}

/** Phone shell: header slot, scrolling page, sidebar-palette tab bar, optional menu sheet. */
declare function MobileShell(props: MobileShellProps): ReactElement;

/** True at phone width, `(max-width: 767px)`. False on the server. */
declare function useIsMobile(): boolean;

export { MobileShell, useIsMobile };
export default MobileShell;
