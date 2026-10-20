import type { CSSProperties, FocusEvent, MouseEvent, ReactElement, ReactNode } from 'react';

/** A rect in layout px (divided through the interface scale). */
export interface AnchorRect {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

/** Hover dwell before a text bubble opens (ms). */
export declare const TIP_DELAY: number;
/** Dwell before clipped text is echoed (ms). */
export declare const POPOUT_DELAY: number;

export interface HoverAnchorOptions {
  /** ms; a function is read after `shouldOpen` has run. Default `TIP_DELAY`. */
  delay?: number | (() => number);
  enabled?: boolean;
  /** Return false to suppress this open (e.g. only when the label is clipped). */
  shouldOpen?: (el: HTMLElement) => boolean;
}

export interface HoverAnchor {
  rect: AnchorRect | null;
  anchorEl: HTMLElement | null;
  isOpen: boolean;
  close: () => void;
  openFrom: (el: HTMLElement) => void;
  handlers: {
    onMouseEnter: (e: MouseEvent) => void;
    onMouseLeave: () => void;
    onFocus: (e: FocusEvent) => void;
    onBlur: () => void;
  };
}

export declare function useHoverAnchor(opts?: HoverAnchorOptions): HoverAnchor;

export type FloatingPlacement = 'bottom' | 'top' | 'over' | 'side';

export interface FloatingLayerProps {
  rect: AnchorRect;
  /** The live trigger — preferred over `rect` when connected. */
  anchorEl?: HTMLElement | null;
  /** `side` sits beside the anchor (right, flipping left). Default `bottom`. */
  placement?: FloatingPlacement;
  /** `end` right-aligns the layer to the anchor (a menu under a trailing button). */
  align?: 'start' | 'center' | 'end';
  offset?: number;
  /** Defaults to the tooltip layer, above every modal. */
  zIndex?: number;
  /** Take the pointer — for a menu. Hover surfaces stay pointer-transparent. */
  interactive?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

export declare function FloatingLayer(props: FloatingLayerProps): ReactElement | null;

export interface TooltipSurfaceProps {
  children: ReactNode;
  maxWidth?: number;
  id?: string;
}

export declare function TooltipSurface(props: TooltipSurfaceProps): ReactElement;

export interface TooltipProps {
  content: ReactNode;
  /** ONE element — cloned with hover/focus handlers, no wrapper added. */
  children: ReactElement;
  placement?: 'bottom' | 'top' | 'side';
  align?: 'start' | 'center';
  delay?: number;
  disabled?: boolean;
  maxWidth?: number;
}

/** True when the element's content is clipped by its own box. */
export declare function isClipped(el: HTMLElement | null): boolean;

/**
 * Mount once near the app root: parks every native `title` (so the OS never
 * draws it) and echoes clipped single-line text on hover.
 */
export declare function GlobalTooltip(): ReactElement | null;

declare function Tooltip(props: TooltipProps): ReactElement;

export { Tooltip };
export default Tooltip;
