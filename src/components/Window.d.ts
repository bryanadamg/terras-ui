import type { ReactElement, CSSProperties, ReactNode } from 'react';
import type { ShellTone, WindowFill } from './types';

export interface WindowProps {
  /** 'page' fills the routed content area, 'flex' takes flex:1, false = caller sizes it. */
  fill?: WindowFill;
  style?: CSSProperties;
  className?: string;
  children: ReactNode;
}

export interface TitleBarProps {
  title?: ReactNode;
  icon?: ReactNode;
  right?: ReactNode;
  tone?: ShellTone;
  style?: CSSProperties;
}

export interface ToolbarProps {
  children: ReactNode;
  style?: CSSProperties;
}

export interface BodyProps {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}

export interface StatusBarProps {
  children?: ReactNode;
  right?: ReactNode;
  style?: CSSProperties;
  className?: string;
}

export interface CountProps {
  children: ReactNode;
  /** Push to the far end of the toolbar row. */
  right?: boolean;
  style?: CSSProperties;
}

declare function Count(props: CountProps): ReactElement;
declare function TitleBar(props: TitleBarProps): ReactElement;
declare function Toolbar(props: ToolbarProps): ReactElement;
declare function Separator(): ReactElement;
declare function Body(props: BodyProps): ReactElement;
declare function StatusBar(props: StatusBarProps): ReactElement;

declare function Window(props: WindowProps): ReactElement;
declare namespace Window {
  export { TitleBar, Toolbar, Separator, Body, StatusBar, Count };
}

export { Window, TitleBar, Toolbar, Separator, Body, StatusBar, Count };
export default Window;
