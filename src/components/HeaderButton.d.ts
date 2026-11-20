import type { ReactElement, ButtonHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';

export interface HeaderButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Any ReactNode — this package has no icon-set opinion. */
  icon?: ReactNode;
  children?: ReactNode;
}

/** Ghost button for the app header band (AppHeader's `right` slot). */
declare function HeaderButton(props: HeaderButtonProps): ReactElement;

export interface HeaderSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** `<option>` elements. */
  children?: ReactNode;
}

/** Native select in the same ghost face, for the header band (e.g. language). */
declare function HeaderSelect(props: HeaderSelectProps): ReactElement;

export { HeaderButton, HeaderSelect };
export default HeaderButton;
