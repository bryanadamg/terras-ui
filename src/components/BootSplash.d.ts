import type { CSSProperties } from 'react';

export interface BootStep {
  /** Matched against `phase`. */
  phase: string;
  label: string;
}

export interface BootSplashProps {
  /**
   * The checkpoint the boot sequence has reached — one of `steps[].phase`.
   * An unrecognised value shows the first step rather than an empty bar.
   */
  phase: string;
  /**
   * The ordered checkpoints. Defaults to erp's four
   * (`hydrating` / `session` / `verifying` / `ready`). The last one is terminal:
   * the splash unmounts there, so it never paints 100%.
   */
  steps?: BootStep[];
  /** Defaults to 'Terras'. */
  appName?: string;
  /** Line under the name; defaults to 'Starting…'. */
  subtitle?: string;
  style?: CSSProperties;
}

/**
 * Holds the two timing guards that keep the splash from flashing: nothing shows
 * for the first 250ms of a boot, and once shown it stays for at least 400ms.
 * Call it unconditionally with "is the app still booting", then render the
 * splash only while it returns true and render **nothing** when it is false but
 * boot is still running.
 *
 * ```tsx
 * const booting = !mounted || loading
 * const showBoot = useBootIndicator(booting)
 * if (showBoot) return <BootSplash phase={mounted ? bootPhase : 'hydrating'} />
 * if (booting) return null
 * ```
 */
export declare function useBootIndicator(active: boolean): boolean;

export declare const DEFAULT_STEPS: BootStep[];

declare function BootSplash(props: BootSplashProps): JSX.Element;

declare namespace BootSplash {
  export { useBootIndicator, DEFAULT_STEPS };
}

export { BootSplash };
export default BootSplash;
