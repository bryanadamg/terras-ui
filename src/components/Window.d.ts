import type { CSSProperties, ReactNode } from 'react';
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

declare function TitleBar(props: TitleBarProps): JSX.Element;
declare function Toolbar(props: ToolbarProps): JSX.Element;
declare function Separator(): JSX.Element;
declare function Body(props: BodyProps): JSX.Element;
declare function StatusBar(props: StatusBarProps): JSX.Element;

declare function Window(props: WindowProps): JSX.Element;
declare namespace Window {
  export { TitleBar, Toolbar, Separator, Body, StatusBar };
}

export { Window, TitleBar, Toolbar, Separator, Body, StatusBar };
export default Window;
