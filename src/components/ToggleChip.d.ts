import type { ReactElement, ButtonHTMLAttributes, ReactNode } from 'react';
import type { ChipSeg, ToggleTone } from './types';

export type { ChipSeg, ToggleTone };

export interface ToggleChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  on: boolean;
  onClick: () => void;
  /** Fill colour when selected. */
  tone?: ToggleTone;
  /** Member of a flush segmented group — normally set for you by `FilterChipBar`. */
  seg?: ChipSeg;
  /** Flat idle face instead of the raised gradient, for a bar that should read
   *  as a data control rather than a strip of buttons. */
  flat?: boolean;
  /** Carry `tone`'s hue in the OFF state too — for a standalone toggle whose
   *  meaning IS the tone. Never in a filter row. Ignored under `flat`. */
  toneIdle?: boolean;
  minWidth?: number;
  children: ReactNode;
}

declare function ToggleChip(props: ToggleChipProps): ReactElement;

export { ToggleChip };
export default ToggleChip;
