import type { ReactElement, ButtonHTMLAttributes, CSSProperties, MouseEvent, ReactNode } from 'react';

/** Five tones — erp's action columns use all five; `warning` is the one `Button` lacks. */
export type ActionTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

export interface ActionButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'title' | 'onClick'> {
  tone?: ActionTone;
  /** Any node from your own icon set. */
  icon?: ReactNode;
  /** Optional text; icon-only when omitted. */
  label?: ReactNode;
  /** Becomes a styled Tooltip (beside an icon-only button, below a labelled one). */
  title?: string;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
}

declare function ActionButton(props: ActionButtonProps): ReactElement;

export { ActionButton };
export default ActionButton;
