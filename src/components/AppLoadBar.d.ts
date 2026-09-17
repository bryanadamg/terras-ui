import type { CSSProperties, ReactNode } from 'react';
import type { ProgressTone } from './ProgressBar';

export interface AppLoadBarProps {
  done: number;
  /** Renders nothing while `total` is 0 or `done >= total`. */
  total: number;
  label?: ReactNode;
  tone?: ProgressTone;
  style?: CSSProperties;
}

declare function AppLoadBar(props: AppLoadBarProps): JSX.Element | null;

export { AppLoadBar };
export default AppLoadBar;
