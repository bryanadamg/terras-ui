import type { ReactElement, ReactNode } from 'react';
import type { ChipFamily, Style } from './types';

/** Same five families as the status chips — `gray` reads as "not started". */
export type ProgressTone = ChipFamily;

export interface ProgressBarProps {
  /** 0-100. Clamped. */
  pct: number;
  /** Defaults to the number: >=100 green, >0 amber, else gray. Override when the
   *  bar means something other than completion (blue for "in progress"). */
  tone?: ProgressTone;
  /** Diagonal-stripe fill, in the tone's own dark/light pair. */
  hatched?: boolean;
  /** Track height in px. Default 10. */
  height?: number;
  width?: number | string;
  title?: string;
  /** Second segment stacked after the primary fill ("planned" after "done"). */
  secondaryPct?: number;
  secondaryTone?: ProgressTone;
  /** Third segment, stacked after the secondary. Ignored unless `secondaryPct` is set. */
  tertiaryPct?: number;
  tertiaryTone?: ProgressTone;
  /** Threshold tick drawn over the track — a line, not a fill. */
  markerPct?: number;
  markerTitle?: string;
  /** 'outside' = trailing "NN%" beside the bar; 'inside' = centred overlay; 'none' (default) = bar only. */
  label?: 'outside' | 'inside' | 'none';
  /** Slot. Wraps the track (and the marker) in your own tooltip; defaults to the
   *  native `title=` attribute. This package ships no tooltip. */
  tooltip?: (children: ReactElement, content: string) => ReactNode;
  style?: Style;
}

/** The solid colour a segment paints, for a legend beside the bar. */
export declare function progressToneColor(tone?: ProgressTone): string;

declare function ProgressBar(props: ProgressBarProps): ReactElement;

export { ProgressBar };
export default ProgressBar;
