import type { MouseEvent, ReactNode } from 'react';

export interface FloatingMenuState {
  /** Row id whose menu is open, or null. */
  openId: string | null;
  anchorEl: HTMLElement | null;
  isOpen: (id: string) => boolean;
  /** Call from the trigger's onClick; stops the click reaching the row. */
  toggle: (id: string, e: MouseEvent<HTMLElement>) => void;
  close: () => void;
}

export declare function useFloatingMenu(): FloatingMenuState;

export interface FloatingMenuItem {
  key: string;
  label: ReactNode;
  /** Any node from your own icon set. */
  icon?: ReactNode;
  /** Runs, then the menu closes. */
  onClick: () => void;
  danger?: boolean;
  title?: string;
  /** Dropped from the list — permission-gated items. */
  hidden?: boolean;
  disabled?: boolean;
}

export interface FloatingMenuProps {
  menu: FloatingMenuState;
  items: FloatingMenuItem[];
  minWidth?: number;
}

export interface MenuTriggerButtonProps {
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  /** Tooltip + accessible name. Default "More actions". */
  title?: string;
  /** Replaces the ⋯ glyph. */
  icon?: ReactNode;
  /** Sets aria-expanded. */
  expanded?: boolean;
}

export declare function FloatingMenu(props: FloatingMenuProps): JSX.Element | null;
export declare function MenuTriggerButton(props: MenuTriggerButtonProps): JSX.Element;
