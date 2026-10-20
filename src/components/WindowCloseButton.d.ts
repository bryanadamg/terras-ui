import type { ReactElement, ButtonHTMLAttributes } from 'react';

export interface WindowCloseButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  onClose: () => void;
  /** Overrides on the 21px box (size, margin). The face is not a prop. */
  style?: object;
}

declare function WindowCloseButton(props: WindowCloseButtonProps): ReactElement;

export { WindowCloseButton };
export default WindowCloseButton;
