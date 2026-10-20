import type { ReactElement, CSSProperties, FormHTMLAttributes, ReactNode } from 'react';
import type { ShellTone } from './types';

export interface ModalProps extends Omit<FormHTMLAttributes<HTMLFormElement>, 'title' | 'style'> {
  title?: ReactNode;
  icon?: ReactNode;
  /** Second line inside the title bar — the record a dialog is acting on. */
  subtitle?: ReactNode;
  tone?: ShellTone;
  /** Also wired to the title-bar close button, the backdrop and Escape. */
  onClose?: () => void;
  /** Default true; turn off for a form with unsaved input. Inert when `modeless` (there is no backdrop). */
  closeOnBackdrop?: boolean;
  /**
   * Modeless window: no backdrop, the page behind stays interactive, and the
   * panel is dragged by its title bar. Falls back to a normal blocking dialog
   * below 768px. Mirrors terras-erp's ModalWrapper prop of the same name.
   */
  modeless?: boolean;
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

/**
 * Dispatched on `window` during every drag-move of a modeless panel. The panel
 * moves by direct DOM transform, so no resize/scroll event fires — anything
 * anchoring a portaled overlay to it must listen for this to stay glued.
 */
declare const REPOSITION_EVENT: 'terras-modal-reposition';

declare function Modal(props: ModalProps): ReactElement;
declare namespace Modal {
  export { REPOSITION_EVENT };
}

export { Modal, REPOSITION_EVENT };
export default Modal;
