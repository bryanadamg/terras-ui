import type { CSSProperties, FormHTMLAttributes, ReactNode } from 'react';
import type { ShellTone } from './types';

export interface ModalProps extends Omit<FormHTMLAttributes<HTMLFormElement>, 'title' | 'style'> {
  title?: ReactNode;
  icon?: ReactNode;
  /** Second line inside the title bar — the record a dialog is acting on. */
  subtitle?: ReactNode;
  tone?: ShellTone;
  onClose?: () => void;
  /** Default true; turn off for a form with unsaved input. */
  closeOnBackdrop?: boolean;
  width?: number | string;
  /** Stacking tier, for a dialog opened from a dialog. */
  layer?: 1 | 2 | 3;
  footer?: ReactNode;
  /** 'form' so the dialog can submit natively (pair with onSubmit). */
  as?: 'div' | 'form';
  style?: CSSProperties;
  bodyStyle?: CSSProperties;
  children: ReactNode;
}

declare function Modal(props: ModalProps): JSX.Element;

export { Modal };
export default Modal;
