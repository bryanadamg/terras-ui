import type { ReactElement, CSSProperties, ReactNode } from 'react';

export interface AccessDeniedProps {
  /** Defaults to a plain lock glyph — this package ships no icon set. */
  icon?: ReactNode;
  title?: ReactNode;
  /** Permission codes the route needs; rendered into the generated message. */
  codes?: string[];
  /** Overrides the generated "ask an administrator for ..." line. */
  message?: ReactNode;
  /** Omit and no button renders — this package has no router opinion. */
  onBack?: () => void;
  backLabel?: string;
  style?: CSSProperties;
}

declare function AccessDenied(props: AccessDeniedProps): ReactElement;

export { AccessDenied };
export default AccessDenied;
