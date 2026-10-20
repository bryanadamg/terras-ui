import type { ReactElement, ReactNode } from 'react';

/** Dialog intent, not a `ButtonTone` — `warning` is erp's own non-decision:
 *  the confirm button falls back to the plain face, there is no orange
 *  button anywhere in erp, so this maps to `Button`'s `default` tone. */
export type ConfirmTone = 'danger' | 'primary' | 'success' | 'warning';

export interface ConfirmModalProps {
  title: ReactNode;
  message: ReactNode;
  onClose: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  tone?: ConfirmTone;
  icon?: ReactNode;
  width?: number | string;
}

declare function ConfirmModal(props: ConfirmModalProps): ReactElement;

export { ConfirmModal };
export default ConfirmModal;
