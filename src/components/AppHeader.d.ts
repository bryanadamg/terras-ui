import type { ReactElement, CSSProperties, ReactNode } from 'react';

export interface AppHeaderProps {
  title?: ReactNode;
  icon?: ReactNode;
  /** Global controls pinned to the right edge (language, sign out, …). */
  right?: ReactNode;
  style?: CSSProperties;
}

declare function AppHeader(props: AppHeaderProps): ReactElement;

export { AppHeader };
export default AppHeader;
