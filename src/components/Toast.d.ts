import type { Context, ReactNode } from 'react';
import type { ToastTone } from './types';

// Re-exported: the tone is part of this component's public surface, and
// `types.d.ts` has no export path of its own.
export type { ToastTone };

/** Handle for one long-running operation's toast. The toast is created up front
 *  and mutated in place, instead of a toast per completed unit of work. It is
 *  sticky until it settles, so neither the dismiss timer nor the visible cap can
 *  take it while the job is still running. */
export interface ProgressToastHandle {
  /** `pct` is 0-100 (clamped). Pass a detail line to name the current unit of
   *  work — "3 of 7 · WIP CBG 9698/22". */
  update: (pct: number, detail?: string) => void;
  /** Replace with a final message and start the dismiss timer. Defaults to green. */
  finish: (message: ReactNode, tone?: ToastTone) => void;
  /** Replace with a failure message (red) and start the dismiss timer. */
  fail: (message: ReactNode) => void;
  /** Drop it now, without a final message. */
  dismiss: () => void;
}

export interface ToastContextValue {
  /** Defaults to green. Returns the new toast's id. */
  show: (message: ReactNode, tone?: ToastTone) => number;
  success: (message: ReactNode) => number;
  error: (message: ReactNode) => number;
  warn: (message: ReactNode) => number;
  info: (message: ReactNode) => number;
  progress: (message: ReactNode, detail?: string) => ProgressToastHandle;
  dismiss: (id: number) => void;
}

export interface ToastProviderProps {
  /** Slot: a node per tone. Any tone left out falls back to a text glyph —
   *  this package ships no icon set. */
  icons?: Partial<Record<ToastTone, ReactNode>>;
  children?: ReactNode;
}

export declare function useToast(): ToastContextValue;
export declare const ToastContext: Context<ToastContextValue | null>;

declare function ToastProvider(props: ToastProviderProps): JSX.Element;

export { ToastProvider };
export default ToastProvider;
