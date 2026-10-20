import type { ReactElement, CSSProperties, ReactNode } from 'react';

export interface EmptyStateProps {
  message: ReactNode;
  /** Muted glyph above the message — any node from your own icon set. */
  icon?: ReactNode;
  style?: CSSProperties;
  /** Renders under the message, e.g. a "create the first one" action. */
  children?: ReactNode;
}

declare function EmptyState(props: EmptyStateProps): ReactElement;

export { EmptyState };
export default EmptyState;
