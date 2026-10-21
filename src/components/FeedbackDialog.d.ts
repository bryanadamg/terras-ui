import type { ReactElement, ReactNode } from 'react';

/** The wire shape each app's `POST /feedback` accepts (the app adds `page`). */
export interface FeedbackReport {
  message: string;
  /** False unless the sender ticked the box — anonymous by default. */
  include_name: boolean;
  /**
   * Base64 image bytes, no `data:` prefix — PNG, or JPEG when PNG would be
   * too big. At most 3, each at most 4 MB decoded; already stripped of
   * EXIF/GPS and with any black-out baked in.
   */
  screenshots: string[];
}

export interface FeedbackLabels {
  title: string;
  message: string;
  attach: string;
  pasteHint: string;
  /** Under the thumbnails: why and how to black out a screenshot. */
  editHint: string;
  /** Inside the black-out editor. */
  blackoutHint: string;
  undo: string;
  done: string;
  remove: string;
  limit: string;
  tooLarge: string;
  notImage: string;
  includeName: string;
  anonymousHint: string;
  namedHint: string;
  cancel: string;
  send: string;
  sending: string;
  /** Shown when `onSubmit` rejects with no `message` of its own. */
  failed: string;
  /** Shown when `onSubmit` rejects with a `TypeError` — fetch's "never reached the server". */
  offline: string;
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

declare function FeedbackDialog(props: FeedbackDialogProps): ReactElement;

export { FeedbackDialog };
export default FeedbackDialog;
