import type { ReactNode } from 'react';

/** The wire shape each app's `POST /feedback` accepts (the app adds `page`). */
export interface FeedbackReport {
  message: string;
  /** False unless the sender ticked the box — anonymous by default. */
  include_name: boolean;
}

export interface FeedbackLabels {
  title: string;
  message: string;
  includeName: string;
  anonymousHint: string;
  namedHint: string;
  cancel: string;
  send: string;
  sending: string;
  /** Shown when `onSubmit` rejects with no `message` of its own. */
  failed: string;
}

export interface FeedbackDialogProps {
  onClose: () => void;
  /** Resolve to close the dialog; reject to show the error's `message` in it. */
  onSubmit: (report: FeedbackReport) => Promise<unknown>;
  /** Partial — English defaults fill the rest. */
  labels?: Partial<FeedbackLabels>;
  /** Title-bar icon slot — this package has no icon-set opinion. */
  icon?: ReactNode;
}

declare function FeedbackDialog(props: FeedbackDialogProps): JSX.Element;

export { FeedbackDialog };
export default FeedbackDialog;
