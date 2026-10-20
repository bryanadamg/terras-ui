import type { ReactElement, ButtonHTMLAttributes, ReactNode } from 'react';
import type { ButtonSize, ButtonTone } from './types';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: ButtonTone;
  size?: ButtonSize;
  /** Any ReactNode — this package has no icon-set opinion. */
  icon?: ReactNode;
  block?: boolean;
}

declare function Button(props: ButtonProps): ReactElement;

export { Button };
export default Button;
