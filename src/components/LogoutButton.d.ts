import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface LogoutButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Any ReactNode — this package has no icon-set opinion. */
  icon?: ReactNode;
  /** Defaults to the string `LOGOUT`. Pass your own node to control how the
   *  label collapses on a narrow header (app-local Tailwind/Bootstrap class). */
  children?: ReactNode;
}

declare function LogoutButton(props: LogoutButtonProps): JSX.Element;

export { LogoutButton };
export default LogoutButton;
