import type { CSSProperties, ReactNode } from 'react';

export type SystemStatus = 'checking' | 'ok' | 'degraded' | 'offline';

export interface SuiteModule {
  key: string;
  /** Hover/accessible name for the tile. */
  title: string;
  /** Fallback face when no icon is supplied for this key — an acronym, 3-4 chars. */
  short?: string;
}

/**
 * The Terras suite, in display order. Shared **data**: the panel is a roadmap
 * teaser of what the suite is, so every app shows the same modules in the same
 * order. Pass your own only to add a module the package hasn't caught up with
 * yet — and add it here in the same commit.
 */
export declare const SUITE_MODULES: SuiteModule[];

export declare const STATUS_LABEL: Record<SystemStatus, string>;

export interface StatusDotProps {
  status?: SystemStatus;
}

export interface IdCardProps {
  /**
   * Open = the full card; closed = the bare avatar, chrome invisible. Animated
   * across ONE set of nodes, so the face never unmounts mid-transition.
   * Omit entirely for the always-open card (the Sidebar footer), which has no
   * closed state to gate the hover glimmer on.
   */
  open?: boolean;
  /**
   * The avatar face. A slot, not a dependency: this package carries no runtime
   * deps beyond react, and the apps draw faces with `@dicebear/*`. The function
   * form is given the badge's username and the exact px size to render at —
   * render at that size and don't re-size on `open`, or the face pops mid-glide.
   */
  avatar?: ReactNode | ((info: { username: string; size: number }) => ReactNode);
  username?: string;
  /**
   * Name and role as this DEVICE cached them at the last successful login.
   * Never a pre-auth lookup — that would confirm to anyone that a given account
   * exists. With no cached role the card says "Role confirmed at sign-in",
   * which is the honest state rather than a placeholder.
   */
  fullName?: string;
  role?: string;
  compact?: boolean;
  style?: CSSProperties;
}

export interface SuitePanelProps {
  modules?: SuiteModule[];
  /**
   * `{ [moduleKey]: node }`. This package ships no icon set, so pass whatever
   * the app already uses; a key with no icon falls back to `short`.
   */
  icons?: Record<string, ReactNode>;
  /** Keys of the modules this app *is* — they get the accent fill; the rest fade with distance. */
  active?: string[];
  compact?: boolean;
  style?: CSSProperties;
}

export interface LoginScreenProps {
  /** The wordmark. Defaults to 'Terras' — the suite, not the app. */
  appName?: string;
  /** The small caps word beside it: 'ERP', 'SKU', 'CRM'. */
  module?: ReactNode;
  /** Suite line under the wordmark. Defaults to 'Integrated Business Suite'; pass `null` to drop it. */
  tagline?: ReactNode;
  /** This app's capability list, top right. Desktop layout only. */
  blurb?: ReactNode;
  docsHref?: string;
  docsLabel?: ReactNode;
  docsIcon?: ReactNode;

  suite?: SuiteModule[];
  suiteIcons?: Record<string, ReactNode>;
  activeModules?: string[];

  /**
   * What the first field *is*. erp signs in by username, sku by email — one flow,
   * so this switches the label, the input `type`, `autocomplete`, the hint copy
   * and the fallback error message. Defaults to `'text'` (username).
   *
   * Everything else in this API keeps saying "username" for whatever the operator
   * types first, `identityType: 'email'` included — one vocabulary rather than
   * two parallel sets of props.
   */
  identityType?: 'text' | 'email';
  /** Overrides the derived label ('Username', or 'Email' when `identityType` is 'email'). */
  identityLabel?: ReactNode;
  /**
   * The remembered username, read from device storage by the app **before** this
   * mounts — it seeds the field and the badge on the first render only, so
   * render the screen after your boot gate rather than passing it in late.
   */
  initialUsername?: string;
  /**
   * Performs the sign-in. Return `true` on success (the screen stays locked —
   * the app is navigating away), or the message to show on failure. A throw or
   * rejection becomes the network message.
   */
  onSubmit: (username: string, password: string) => Promise<true | string> | true | string;
  /** Fired when the user commits a username — the hook for persisting "last username". */
  onUsernameConfirmed?: (username: string) => void;
  /** Device-cached name/role for the badge. Synchronous; must not hit the network. */
  identityFor?: (username: string) => { fullName?: string; role?: string } | null;
  avatar?: IdCardProps['avatar'];
  /** Replaces the "Forgot your password?" line under the password field. */
  passwordHelp?: ReactNode;

  /** Server health, for the footer dot. The app owns the polling. */
  status?: SystemStatus;
  /** Overrides the text beside the dot (defaults to `STATUS_LABEL[status]`). */
  statusLabel?: ReactNode;
  version?: string;
  /** Pre-formatted — this component does no date parsing beyond its own clock. */
  lastUpdated?: string;
  /** The footer clock. On by default; it paints from the second frame, never during SSR. */
  clock?: boolean;
  /** Locale for the clock. Defaults to 'en-US'. */
  locale?: string;
  style?: CSSProperties;
}

declare function StatusDot(props: StatusDotProps): JSX.Element;
declare function IdCard(props: IdCardProps): JSX.Element;
declare function SuitePanel(props: SuitePanelProps): JSX.Element;

/**
 * The Terras sign-in screen — deep blue, modern face, deliberately not classic
 * chrome, and the same in every app.
 *
 * It owns the two-step flow (username → password), the fields, the slide
 * direction, focus handoff, the badge, the clock and the error line. The app
 * owns auth (`onSubmit`), anything device-local (`initialUsername`,
 * `identityFor`), the avatar face (`avatar`) and where a signed-in user goes.
 *
 * Pass `identityType="email"` for an app that signs in by address rather than
 * username; the flow is the same and only the label, input type and copy move.
 *
 * ```tsx
 * <LoginScreen
 *   module="SKU"
 *   activeModules={['pim']}
 *   initialUsername={remembered}
 *   identityFor={recallIdentity}
 *   avatar={({ username, size }) => <PixelAvatar seed={username} size={size} />}
 *   onUsernameConfirmed={u => localStorage.setItem('terras_last_username', u)}
 *   onSubmit={async (u, p) => (await login(u, p)) === true || 'Invalid username or password'}
 *   status={status}
 *   version={version}
 * />
 * ```
 */
declare function LoginScreen(props: LoginScreenProps): JSX.Element;

declare namespace LoginScreen {
  export { StatusDot, IdCard, SuitePanel, SUITE_MODULES, STATUS_LABEL };
}

export { LoginScreen, StatusDot, IdCard, SuitePanel };
export default LoginScreen;
