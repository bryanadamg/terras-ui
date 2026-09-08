'use strict';

// The Terras sign-in screen. Extracted from teras-erp's `app/login/page.tsx`,
// which stays the source of truth for the look.
//
// This is the one Terras surface that is NOT classic chrome: a deep blue field,
// the modern/display face, no bevels. It sits outside the app, so it looks the
// same whichever theme the app boots into — which is why its palette lives in
// `:root` (`--terras-login-*` / `--terras-badge-*`) rather than under
// `.ui-style-classic`.
//
// Why it is shared at all: sign-in is the only screen where all three apps show
// the SAME thing. The wordmark and the suite panel are *suite* identity, not app
// identity — `SUITE_MODULES` is one list of what Terras is, and three hand-kept
// copies of it would disagree within a release.
//
// ── The split ────────────────────────────────────────────────────────────────
// This component owns the two-step flow (username → password), the field state,
// the slide direction, focus handoff, the badge's open/close, the clock, and the
// error line. All of that is UI.
//
// The app owns AUTH: `onSubmit` performs it and returns either `true` or the
// message to show. The app also owns anything device-local — the remembered
// username it seeds `initialUsername` with, the cached name/role it answers
// `identityFor` with, and where the user goes on success. None of that can live
// here: this package has no router, no fetch, and no storage keys.
//
// `avatar` is a SLOT for the same reason. erp draws its faces with
// `@dicebear/core` + `@dicebear/collection`; terras-ui carries no runtime
// dependency but react, and a login screen is not the thing to break that for.
//
// ── One deliberate difference from erp ───────────────────────────────────────
// erp writes the mobile and desktop layouts as two full copies of the screen,
// including two copies of the form. Here the form is rendered once, by
// `renderForm`, with a `compact` flag choosing the sizes; only the two thin
// layout shells around it are separate (they genuinely differ — mobile stacks
// brand / suite / form / footer, desktop is three horizontal bands with the
// suite beside the form). Two copies of a login form is precisely how one of
// them ends up a fix behind the other.

const React = require('react');
const S = require('./styles');
const CityMatrix = require('./CityMatrix');

// The city behind the field. Bundled rather than passed in, for the same reason
// `SUITE_MODULES` is: which city sign-in shows is suite identity, so three apps
// choosing it independently is three answers to a question with one answer.
// An app can still override or drop it via the `cityMatrix` prop.
const DEFAULT_CITY_MATRIX = require('../assets/cityMatrix.tangerang');

// The display/wordmark face. Falls back through the modern stack, so the brand
// never lands in a default serif on an app that loads no display font.
const brandFont = S.cssVar('font-display', S.cssVar('font-modern', 'system-ui, sans-serif'));
const bodyFont = S.cssVar('font-modern', 'system-ui, sans-serif');

// Desktop sizes scale with the viewport. Written against `--terras-app-vw`
// rather than `100vw` because erp scales its whole UI by a zoom factor and
// publishes a divided-out `--app-vw`; see the token's comment in tokens.css.
const vw = (min, pct, max) =>
    'clamp(' + min + 'px, calc(' + S.cssVar('app-vw', '100vw') + ' * ' + pct + ' / 100), ' + max + 'px)';

const MOBILE_QUERY = '(max-width: 767px)';

const STATUS_LABEL = {
    checking: 'Checking...',
    ok: 'All systems operational',
    degraded: 'Degraded',
    offline: 'Cannot reach server',
};

/**
 * The Terras suite, in display order. Shared DATA, not just a shape: the panel
 * is a roadmap teaser of what the suite is, so every app must show the same
 * modules in the same order or the teaser contradicts itself between apps.
 *
 * Ordered with the live pair in the middle, so unrelated modules fall away
 * toward both edges. No visible labels by design — `title` gives each tile an
 * accessible/hover name without cluttering the screen. `short` is the fallback
 * face for an app that passes no icons (this package ships no icon set).
 */
const SUITE_MODULES = [
    { key: 'cms', title: 'CMS', short: 'CMS' },
    { key: 'pim', title: 'PIM', short: 'PIM' },
    { key: 'hris', title: 'HRIS', short: 'HRIS' },
    { key: 'accounting', title: 'Accounting', short: 'ACCT' },
    { key: 'mrp', title: 'MRP', short: 'MRP' },
    { key: 'inventory', title: 'Inventory', short: 'INV' },
    { key: 'scm', title: 'SCM', short: 'SCM' },
    { key: 'wms', title: 'WMS', short: 'WMS' },
    { key: 'crm', title: 'CRM', short: 'CRM' },
    { key: 'psa', title: 'PSA', short: 'PSA' },
];

// Matches on the client only — the same shape Modal uses. The first render (and
// SSR) reports false, so a narrow viewport paints the desktop shell for one
// frame and corrects on mount. The other way round would flash the mobile
// layout onto every desktop sign-in.
function useMediaQuery(query) {
    const state = React.useState(false);
    const matches = state[0];
    const setMatches = state[1];

    React.useEffect(function () {
        if (typeof window === 'undefined' || !window.matchMedia) return;
        const mql = window.matchMedia(query);
        const onChange = function () { setMatches(mql.matches); };
        onChange();
        mql.addEventListener('change', onChange);
        return function () { mql.removeEventListener('change', onChange); };
    }, [query]);

    return matches;
}

// ── Server status dot ───────────────────────────────────────────────────────

/**
 * @param {{ status?: 'checking'|'ok'|'degraded'|'offline' }} props
 */
function StatusDot(props) {
    const status = props.status || 'checking';
    const color = S.cssVar('login-status-' + status, '#c0c8d8');
    return React.createElement('span', {
        style: {
            display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
            background: color, marginRight: 6, flexShrink: 0,
            // No halo while checking: a pulsing unknown reads as a warning.
            boxShadow: status === 'checking' ? 'none' : '0 0 4px ' + color,
        },
    });
}

// ── Staff ID badge ──────────────────────────────────────────────────────────

/**
 * The user's avatar, and the ID card that forms around it once a username is
 * confirmed — the same card as the Sidebar footer's user button (accent spine,
 * photo frame, name, role chip), one size up. Deliberately the same object in
 * both places: the badge you see before signing in is the badge you carry
 * inside.
 *
 * `open` drives everything through CSS transitions on ONE set of nodes, which
 * is the whole point of this component's shape. The obvious build — bare avatar
 * at the username step, card at the password step — unmounts the avatar and
 * mounts a different one, so the face blinks out at full opacity and fades back
 * in at a new size. Nothing can transition across an unmount. Here the frame
 * and the avatar inside it are never replaced: the card face fades in behind
 * them, the frame re-shapes, and the avatar glides left.
 *
 * The closed frame is scaled with `transform`, not sized in px, so the form
 * column's layout height never changes between steps — a scaled element still
 * occupies its untransformed box. Same reason the container is always a third
 * of the column: at rest the chrome is invisible and the avatar is centred
 * inside it, which is exactly where a centred bare avatar would have sat.
 *
 * Name and role must come from whatever the DEVICE cached at the last
 * successful login (`identityFor` on LoginScreen) — never a pre-auth lookup,
 * which would confirm to anyone that a given account exists. A username this
 * browser has not signed in before still gets a card; it just shows the
 * username and says the role is confirmed at sign-in. That is the honest state,
 * not a placeholder.
 *
 * Omit `open` entirely for the always-open card (the Sidebar footer), which has
 * no closed state to gate the hover glimmer on.
 *
 * @param {{
 *   open?: boolean,
 *   avatar?: React.ReactNode | ((info: {username: string, size: number}) => React.ReactNode),
 *   username?: string,
 *   fullName?: string,
 *   role?: string,
 *   compact?: boolean,
 *   style?: object,
 * }} props
 */
function IdCard(props) {
    const isStatic = props.open === undefined;
    const open = isStatic ? true : !!props.open;
    const compact = !!props.compact;
    const username = props.username || '';
    const photo = compact ? 44 : 40;
    // Closed, the frame should read at the size the bare avatar used to be.
    const idleScale = (compact ? 60 : 56) / photo;

    // Long and heavily decelerated: the travel is the moment the screen hands
    // the user their badge, so it glides to a stop rather than snapping.
    const glide = 'cubic-bezier(0.16, 0.84, 0.24, 1)';

    const avatarNode = typeof props.avatar === 'function'
        ? props.avatar({ username: username, size: photo - 10 })
        : (props.avatar || null);

    return React.createElement(
        'div',
        {
            className: 'terras-badge' + (isStatic ? ' terras-badge-static' : (open ? ' terras-badge-open' : '')),
            style: Object.assign({
                // A third of the form column, centred: the badge is an identity
                // token, not a panel, so it should not span the field below it.
                position: 'relative',
                width: '33.333%',
                alignSelf: 'center',
                display: 'flex',
                alignItems: 'stretch',
                borderRadius: S.cssVar('radius-section', '6px'),
                overflow: 'hidden',
                fontFamily: bodyFont,
            }, props.style),
        },
        // Card face: blue card stock rather than white, so it reads as issued by
        // the same system as the chrome behind it. A backdrop layer of its own,
        // with nothing inside it, so its opacity is nobody else's problem —
        // fading the card used to fade the avatar with it.
        React.createElement('div', {
            'aria-hidden': true,
            style: {
                position: 'absolute', inset: 0,
                background: S.cssVar('badge-face', 'linear-gradient(to bottom, #d6e2f6, #a8c3e7)'),
                borderTop: '1px solid ' + S.cssVar('badge-border-light', '#eaf2fd'),
                borderLeft: '1px solid ' + S.cssVar('badge-border-light', '#eaf2fd'),
                borderRight: '1px solid ' + S.cssVar('badge-border-dark', '#5f78a6'),
                borderBottom: '1px solid ' + S.cssVar('badge-border-dark', '#5f78a6'),
                borderRadius: S.cssVar('radius-section', '6px'),
                boxShadow: S.cssVar('badge-shadow', '0 2px 8px rgba(0, 10, 40, 0.28)'),
                opacity: open ? 1 : 0,
                transition: 'opacity 420ms ' + glide,
            },
        }),
        // Accent spine — the coloured edge of the ID card.
        React.createElement('div', {
            'aria-hidden': true,
            style: {
                position: 'relative', width: 4, flexShrink: 0,
                background: S.cssVar('badge-spine', 'linear-gradient(to bottom, #4a7ddb, #003080)'),
                opacity: open ? 1 : 0,
                transition: 'opacity 420ms ' + glide,
            },
        }),
        React.createElement(
            'div',
            {
                style: {
                    position: 'relative', display: 'flex', alignItems: 'center', gap: 9,
                    padding: '7px 9px', minWidth: 0, flex: 1,
                },
            },
            React.createElement(
                'div',
                {
                    style: {
                        // Closed: centred in the card, at the old bare-avatar
                        // size. Open: pinned left at card size. A percentage
                        // margin resolves against this row's content box, so
                        // "centred" is exact at any width or UI scale — no
                        // measuring, no JS.
                        marginLeft: open ? 0 : 'calc(50% - ' + (photo / 2) + 'px)',
                        transform: open ? 'none' : 'scale(' + idleScale + ')',
                        width: photo, height: photo, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: open
                            ? S.cssVar('badge-photo-bg', '#eaf1fb')
                            : S.cssVar('badge-photo-bg-idle', '#c8d8f0'),
                        border: '1px solid ' + (open
                            ? S.cssVar('badge-photo-border', '#6d84b0')
                            : S.cssVar('badge-photo-border-idle', '#8fa4c8')),
                        borderRadius: open ? 4 : 0,
                        boxShadow: 'inset 1px 1px 0 #f4f8ff',
                        transition: [
                            'margin-left 900ms ' + glide,
                            'transform 900ms ' + glide,
                            'background-color 420ms ' + glide,
                            'border-color 420ms ' + glide,
                            'border-radius 420ms ' + glide,
                        ].join(', '),
                    },
                },
                // The avatar is rendered at a FIXED size on purpose: re-rendering
                // it at a new size mid-transition is the pop this component exists
                // to avoid. The frame scales, the face rides along.
                avatarNode,
            ),
            React.createElement(
                'div',
                {
                    style: {
                        minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 1,
                        // Waits for most of the glide, so the details arrive as
                        // the avatar settles instead of racing it across the card.
                        opacity: open ? 1 : 0,
                        transition: open
                            ? 'opacity 420ms ' + glide + ' 430ms'
                            : 'opacity 140ms ' + glide,
                    },
                },
                React.createElement(
                    'span',
                    {
                        title: props.fullName || username,
                        style: {
                            fontSize: compact ? 14 : 13, fontWeight: 'bold',
                            color: S.cssVar('badge-text', '#16294f'),
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        },
                    },
                    props.fullName || username,
                ),
                React.createElement(
                    'span',
                    {
                        style: {
                            fontFamily: S.fontMono,
                            fontSize: compact ? 10.5 : 10,
                            color: S.cssVar('badge-text-2', '#3d5480'),
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        },
                    },
                    // erp signs in by username, sku by email. An address is
                    // already a whole handle, so prefixing it would read as a
                    // second @ — the sub-line only wears the sigil when the
                    // value doesn't carry one.
                    username.indexOf('@') >= 0 ? username : '@' + username,
                ),
                // Chip when the role is known, plain italic line when it is not —
                // a chip around "confirmed at sign-in" would read as a role
                // actually called that.
                props.role
                    ? React.createElement(
                        'span',
                        {
                            style: {
                                marginTop: 2, alignSelf: 'flex-start', maxWidth: '100%',
                                fontSize: compact ? 9.5 : 9, fontWeight: 'bold', letterSpacing: 0.3,
                                textTransform: 'uppercase', padding: '0 4px',
                                borderRadius: S.cssVar('radius-chip', '3px'),
                                background: S.cssVar('badge-role-bg', '#bcd0ee'),
                                border: '1px solid ' + S.cssVar('badge-role-border', '#7891bd'),
                                color: S.cssVar('badge-text', '#16294f'),
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            },
                        },
                        props.role,
                    )
                    : React.createElement(
                        'span',
                        {
                            style: {
                                marginTop: 2, fontSize: compact ? 9.5 : 9,
                                color: S.cssVar('badge-text-3', '#5b6c92'),
                                fontStyle: 'italic',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            },
                        },
                        'Role confirmed at sign-in',
                    ),
            ),
        ),
    );
}

// ── Product suite panel ─────────────────────────────────────────────────────

/**
 * @param {{
 *   modules?: Array<{key: string, title: string, short?: string}>,
 *   icons?: Object,                 // { [key]: ReactNode } — this package ships no icon set
 *   active?: string[],              // keys of the modules this app IS
 *   compact?: boolean,
 *   style?: object,
 * }} props
 */
function SuitePanel(props) {
    const modules = props.modules && props.modules.length ? props.modules : SUITE_MODULES;
    const icons = props.icons || {};
    const activeKeys = props.active || [];
    const compact = !!props.compact;
    const tileSize = compact ? 40 : 56;
    const iconSize = compact ? 16 : 20;

    const hoverState = React.useState(null);
    const hovered = hoverState[0];
    const setHovered = hoverState[1];
    const firstActiveRef = React.useRef(null);

    const activeIndices = [];
    modules.forEach(function (m, i) {
        if (activeKeys.indexOf(m.key) >= 0) activeIndices.push(i);
    });

    React.useEffect(function () {
        // The row can overflow on a narrow screen; the app's own modules are the
        // part that must be on screen, so scroll them into the middle.
        if (firstActiveRef.current && firstActiveRef.current.scrollIntoView) {
            firstActiveRef.current.scrollIntoView({ inline: 'center', block: 'nearest' });
        }
    }, []);

    return React.createElement(
        'div',
        {
            style: Object.assign({
                display: 'flex', flexWrap: 'nowrap', justifyContent: 'center',
                gap: compact ? 8 : 10, overflowX: 'auto', overflowY: 'hidden',
                paddingTop: compact ? 34 : 40, paddingBottom: 6, maxWidth: '100%',
                fontFamily: bodyFont,
            }, props.style),
        },
        modules.map(function (m, i) {
            const isActive = activeKeys.indexOf(m.key) >= 0;
            // Distance from the nearest live module: the further a module is from
            // what this app actually is, the further back it sits. With nothing
            // active there is no anchor to fade away from, so the whole row reads
            // flat rather than dividing by an empty set.
            const distance = activeIndices.length
                ? Math.min.apply(null, activeIndices.map(function (a) { return Math.abs(i - a); }))
                : 0;
            const opacity = isActive ? 1 : Math.max(0.2, 1 - distance * 0.2);
            const isHovered = hovered === m.key;
            const baseScale = isActive ? 1 : 1 - distance * 0.04;

            return React.createElement(
                'div',
                {
                    key: m.key,
                    // z-index for the hover pop lives in chrome.css, so the
                    // hovered tile can rise past its neighbours' scaled edges.
                    className: 'terras-suite-tile',
                    ref: i === activeIndices[0] ? firstActiveRef : undefined,
                    onMouseEnter: function () { setHovered(m.key); },
                    onMouseLeave: function () { setHovered(null); },
                    style: { flexShrink: 0 },
                },
                // Hover name. A tooltip rather than a printed label: ten labelled
                // tiles is a nav bar, and this row is not navigable.
                React.createElement(
                    'div',
                    {
                        style: {
                            position: 'absolute', bottom: '115%', left: '50%',
                            transform: 'translateX(-50%) translateY(' + (isHovered ? 0 : 4) + 'px)',
                            opacity: isHovered ? 1 : 0,
                            transition: 'opacity 0.15s ease, transform 0.15s ease',
                            pointerEvents: 'none', whiteSpace: 'nowrap',
                            fontSize: compact ? 10 : 11, fontWeight: 600,
                            color: S.cssVar('login-text', '#ffffff'),
                            background: S.cssVar('login-tip-bg', 'rgba(10, 20, 60, 0.92)'),
                            border: '1px solid ' + S.cssVar('login-tip-border', 'rgba(166, 202, 240, 0.4)'),
                            borderRadius: 4, padding: '3px 8px',
                        },
                    },
                    m.title,
                ),
                React.createElement(
                    'div',
                    {
                        title: m.title,
                        style: {
                            width: tileSize, height: tileSize,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderRadius: S.cssVar('radius-section', '6px'),
                            opacity: isHovered ? 1 : opacity,
                            transform: 'scale(' + (isHovered ? baseScale * 1.15 : baseScale) + ')',
                            transformOrigin: 'center bottom',
                            transition: 'transform 0.15s ease, opacity 0.15s ease, box-shadow 0.15s ease',
                            background: isActive
                                ? S.cssVar('login-tile-active-bg', 'rgba(74, 144, 217, 0.28)')
                                : S.cssVar('login-tile-bg', 'rgba(255, 255, 255, 0.05)'),
                            border: isActive
                                ? '2px solid ' + S.cssVar('login-accent', '#4a90d9')
                                : '1px solid ' + S.cssVar('login-tile-border', 'rgba(166, 202, 240, 0.2)'),
                            boxShadow: isActive
                                ? '0 0 8px ' + S.cssVar('login-tile-glow', 'rgba(74, 144, 217, 0.6)')
                                : isHovered
                                    ? '0 0 8px ' + S.cssVar('login-tile-hover-glow', 'rgba(166, 202, 240, 0.4)')
                                    : 'none',
                            // Not a control: the row is a roadmap teaser, not a
                            // module switcher, so it never offers a pointer.
                            cursor: 'default',
                            fontSize: icons[m.key] ? iconSize : (compact ? 10 : 12),
                            fontWeight: 700,
                            letterSpacing: 0.5,
                            color: isActive || isHovered
                                ? S.cssVar('login-text', '#ffffff')
                                : S.cssVar('login-tile-icon', '#5f7aa8'),
                        },
                    },
                    // No icon set ships with this package, so a tile with no icon
                    // supplied falls back to the module's short form rather than
                    // rendering an empty box.
                    icons[m.key] || m.short || m.title,
                ),
            );
        }),
    );
}

// ── Documentation pill ──────────────────────────────────────────────────────

function DocsPill(props) {
    if (!props.href) return null;
    return React.createElement(
        'a',
        {
            href: props.href,
            className: 'terras-login-pill',
            style: {
                fontSize: props.compact ? 12 : vw(9, 0.9, 11),
                color: S.cssVar('login-pill', '#a8cef2'),
                textDecoration: 'none',
                border: '1px solid ' + S.cssVar('login-pill-border', 'rgba(122, 176, 232, 0.3)'),
                borderRadius: S.cssVar('radius-btn', '3px'),
                padding: props.compact ? '4px 10px' : vw(2, 0.4, 4) + ' ' + vw(6, 1, 10),
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                whiteSpace: 'nowrap',
            },
        },
        props.icon || null,
        props.label || 'View Documentation',
    );
}

// ── The screen ──────────────────────────────────────────────────────────────

/**
 * The `username` in these props is "whatever the operator types first" — a
 * username in erp, an email address in sku (`identityType: 'email'`). One
 * vocabulary rather than two sets of props; only the label, the input type and
 * the copy change.
 *
 * @param {{
 *   appName?: string,                 // the wordmark; defaults to 'Terras'
 *   module?: React.ReactNode,         // the small caps word beside it ('ERP', 'SKU')
 *   tagline?: React.ReactNode,        // suite line under the wordmark
 *   blurb?: React.ReactNode,          // this app's capability list, top-right (desktop only)
 *   docsHref?: string,
 *   docsLabel?: React.ReactNode,
 *   docsIcon?: React.ReactNode,
 *
 *   suite?: Array<{key: string, title: string, short?: string}>,
 *   suiteIcons?: Object,              // { [key]: ReactNode }
 *   activeModules?: string[],
 *
 *   identityType?: 'text'|'email',    // what the first field IS; drives label, type, autocomplete, copy
 *   identityLabel?: React.ReactNode,  // override the derived 'Username' / 'Email'
 *   initialUsername?: string,         // read from device storage BEFORE this mounts
 *   onSubmit: (username: string, password: string) => Promise<true|string> | true | string,
 *   onUsernameConfirmed?: (username: string) => void,
 *   identityFor?: (username: string) => ({fullName?: string, role?: string}|null),
 *   avatar?: React.ReactNode | ((info: {username: string, size: number}) => React.ReactNode),
 *   passwordHelp?: React.ReactNode,
 *
 *   status?: 'checking'|'ok'|'degraded'|'offline',
 *   statusLabel?: React.ReactNode,
 *   version?: string,
 *   lastUpdated?: string,
 *   clock?: boolean,                  // default true
 *   locale?: string,                  // default 'en-US'
 *   cityMatrix?: object|null,         // omitted = bundled Tangerang; null = no city
 *   cityMatrixBlink?: boolean,        // default true; forced off under reduced-motion
 *   style?: object,
 * }} props
 */
function LoginScreen(props) {
    const compact = useMediaQuery(MOBILE_QUERY);
    // undefined = the bundled city; null/false = no city at all.
    const matrixData = props.cityMatrix === undefined ? DEFAULT_CITY_MATRIX : props.cityMatrix;

    const usernameState = React.useState(props.initialUsername || '');
    const username = usernameState[0];
    const setUsername = usernameState[1];

    const passwordState = React.useState('');
    const password = passwordState[0];
    const setPassword = passwordState[1];

    const stepState = React.useState('username');
    const step = stepState[0];
    const setStep = stepState[1];

    // Which way the step panes slide. Forward on Next, mirrored on Back, so the
    // motion says "advancing" vs "returning" rather than just "something moved".
    const dirState = React.useState('forward');
    const stepDir = dirState[0];
    const setStepDir = dirState[1];

    const confirmedState = React.useState('');
    const confirmed = confirmedState[0];
    const setConfirmed = confirmedState[1];

    const errorState = React.useState('');
    const error = errorState[0];
    const setError = errorState[1];

    const busyState = React.useState(false);
    const busy = busyState[0];
    const setBusy = busyState[1];

    // Null until mounted: `new Date()` during render differs between the server
    // and the client, which is a hydration mismatch. The clock simply isn't
    // painted for the first frame.
    const clockState = React.useState(null);
    const now = clockState[0];
    const setNow = clockState[1];

    const usernameRef = React.useRef(null);
    const passwordRef = React.useRef(null);

    const showClock = props.clock !== false;
    const locale = props.locale || 'en-US';

    // The first field's vocabulary. erp signs in by username, sku by email; the
    // flow is identical, so this is a label + input type + three strings rather
    // than a second component.
    const byEmail = props.identityType === 'email';
    const identityLabel = props.identityLabel === undefined
        ? (byEmail ? 'Email' : 'Username')
        : props.identityLabel;
    const invalidMessage = byEmail
        ? 'Invalid email or password'
        : 'Invalid username or password';

    React.useEffect(function () {
        if (!showClock) return;
        setNow(new Date());
        const t = setInterval(function () { setNow(new Date()); }, 1000);
        return function () { clearInterval(t); };
    }, [showClock]);

    React.useEffect(function () {
        if (step !== 'password') return;
        // Deferred rather than immediate: the pane is mid-slide, and focusing a
        // node that is still transforming scrolls the column on some browsers.
        const t = setTimeout(function () {
            if (passwordRef.current) passwordRef.current.focus();
        }, 50);
        return function () { clearTimeout(t); };
    }, [step]);

    // Whose badge is shown. Deliberately NOT the live field value — driving it
    // from keystrokes would morph the face on every character typed. It settles
    // on the remembered user at boot, then on whoever is confirmed.
    const badgeUser = confirmed || props.initialUsername || '';
    const identity = (props.identityFor && badgeUser ? props.identityFor(badgeUser) : null) || {};

    const confirmUsername = function (name) {
        setStepDir('forward');
        setConfirmed(name);
        setStep('password');
        setError('');
        if (props.onUsernameConfirmed) props.onUsernameConfirmed(name);
    };

    const goBack = function () {
        setStepDir('back');
        setStep('username');
        setUsername(confirmed || username);
        setConfirmed('');
        setPassword('');
        setError('');
        setTimeout(function () {
            if (usernameRef.current) usernameRef.current.focus();
        }, 50);
    };

    const submitPassword = function (e) {
        e.preventDefault();
        setBusy(true);
        setError('');
        Promise.resolve()
            .then(function () { return props.onSubmit(confirmed, password); })
            .then(function (result) {
                // `true` means the app is navigating away; anything else is the
                // message to show. Leaving `busy` set on success is deliberate —
                // the button must not go live again under a route change.
                if (result === true) return;
                setError(typeof result === 'string' && result ? result : invalidMessage);
                setBusy(false);
            })
            .catch(function () {
                setError('Cannot reach server — check your connection');
                setBusy(false);
            });
    };

    const submitUsername = function (e) {
        e.preventDefault();
        const name = username.trim();
        if (name) confirmUsername(name);
    };

    const fmtTime = function (d) {
        return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    };
    const fmtDate = function (d) {
        return d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    };

    // Both layout branches render the same pane class; the animation itself
    // lives in chrome.css.
    const stepClass = 'terras-login-step' + (stepDir === 'back' ? ' terras-login-step-back' : '');

    // ── Wordmark ────────────────────────────────────────────────────────────
    // "Terras" is the suite; the module word is only what you are signing into,
    // so it rides small and muted beside the wordmark rather than sharing its
    // weight.
    const wordmark = function (opts) {
        return React.createElement(
            'div',
            {
                style: {
                    display: 'flex', alignItems: 'baseline',
                    justifyContent: opts.center ? 'center' : undefined,
                    gap: opts.compact ? 6 : vw(4, 0.5, 9),
                    marginBottom: opts.compact ? 4 : undefined,
                },
            },
            React.createElement(
                'span',
                {
                    style: {
                        fontFamily: brandFont,
                        fontSize: opts.compact ? 30 : vw(21, 3.6, 44),
                        fontWeight: 600, letterSpacing: -0.1,
                        color: S.cssVar('login-text', '#ffffff'),
                    },
                },
                props.appName || 'Terras',
            ),
            props.module
                ? React.createElement(
                    'span',
                    {
                        style: {
                            fontFamily: brandFont,
                            fontSize: opts.compact ? 11 : vw(9, 1.2, 15),
                            fontWeight: 500,
                            letterSpacing: opts.compact ? 2 : 3,
                            textTransform: 'uppercase',
                            color: S.cssVar('login-module', '#7f9ecb'),
                        },
                    },
                    props.module,
                )
                : null,
        );
    };

    const taglineNode = React.createElement(
        'div',
        {
            style: {
                fontSize: compact ? 11 : vw(8, 1.1, 13),
                color: S.cssVar('login-tagline', '#a0c2f5'),
                letterSpacing: compact ? 4 : 5,
                textTransform: 'uppercase',
            },
        },
        props.tagline === undefined ? 'Integrated Business Suite' : props.tagline,
    );

    const hint = React.createElement(
        'div',
        {
            // Keyed on `step` so the copy re-mounts and fades in rather than
            // swapping mid-sentence under the reader.
            key: step,
            className: 'terras-login-identity',
            style: {
                fontSize: compact ? 13 : vw(9, 1.2, 14),
                color: S.cssVar('login-hint', '#b8ccf0'),
                letterSpacing: compact ? undefined : 1,
                textAlign: compact ? 'center' : undefined,
            },
        },
        step === 'username'
            ? (compact ? 'Enter your ' : 'Type your ') + (byEmail ? 'email address' : 'username') + ' to sign in'
            : 'Enter your password to continue',
    );

    // ── The form, rendered ONCE for both layouts ────────────────────────────
    const renderForm = function (small) {
        const fieldH = small ? 48 : vw(24, 3, 36);
        const labelFs = small ? 12 : vw(9, 1.1, 12);
        const inputFs = small ? 16 : vw(9, 1.1, 13);
        const helpFs = small ? 12 : vw(8, 0.9, 11);
        const btnFs = small ? 15 : vw(8, 1, 12);

        const inputStyle = function (isPassword) {
            return {
                width: '100%',
                height: fieldH,
                background: S.cssVar('login-field-bg', 'rgba(255, 255, 255, 0.15)'),
                border: '1px solid ' + (isPassword
                    ? S.cssVar('login-field-border-pw', 'rgba(232, 200, 112, 0.5)')
                    : S.cssVar('login-field-border', 'rgba(166, 202, 240, 0.6)')),
                borderRadius: S.cssVar('radius-btn', '3px'),
                color: S.cssVar('login-text', '#ffffff'),
                padding: small ? '0 14px' : '0 8px',
                fontFamily: bodyFont,
                fontSize: inputFs,
                // The browser's own ring is a modern focus halo that reads as
                // foreign here; `.terras-login-input:focus-visible` in chrome.css
                // redraws it in this palette.
                outline: 'none',
                boxSizing: 'border-box',
            };
        };

        return React.createElement(
            'form',
            {
                onSubmit: step === 'password' ? submitPassword : submitUsername,
                style: { width: '100%', display: 'flex', flexDirection: 'column', gap: small ? 12 : 8 },
            },
            step === 'username'
                ? React.createElement(
                    'div',
                    { className: stepClass },
                    React.createElement(
                        'label',
                        {
                            htmlFor: 'terras-login-username',
                            style: {
                                display: 'block', marginBottom: small ? 6 : 4,
                                fontSize: labelFs, color: S.cssVar('login-label', '#c0d8f8'),
                            },
                        },
                        identityLabel,
                    ),
                    React.createElement('input', {
                        id: 'terras-login-username',
                        className: 'terras-login-input',
                        'data-testid': 'username-input',
                        ref: usernameRef,
                        type: byEmail ? 'email' : 'text',
                        autoComplete: byEmail ? 'email' : 'username',
                        // Desktop only: a focused field on mobile raises the
                        // keyboard over the screen the user has not read yet.
                        autoFocus: !small,
                        required: true,
                        value: username,
                        onChange: function (e) { setUsername(e.target.value); },
                        style: inputStyle(false),
                    }),
                )
                : null,
            step === 'password'
                ? React.createElement(
                    'div',
                    { className: stepClass },
                    React.createElement(
                        'label',
                        {
                            htmlFor: 'terras-login-password',
                            style: {
                                display: 'block', marginBottom: small ? 6 : 4,
                                fontSize: labelFs, color: S.cssVar('login-label-pw', '#e8c870'),
                            },
                        },
                        'Password',
                    ),
                    React.createElement('input', {
                        id: 'terras-login-password',
                        className: 'terras-login-input',
                        'data-testid': 'password-input',
                        ref: passwordRef,
                        type: 'password',
                        autoComplete: 'current-password',
                        required: true,
                        value: password,
                        onChange: function (e) { setPassword(e.target.value); },
                        style: inputStyle(true),
                    }),
                    React.createElement(
                        'div',
                        {
                            style: {
                                fontSize: helpFs, marginTop: small ? 8 : 6,
                                color: S.cssVar('login-muted', '#9fb8dc'),
                            },
                        },
                        props.passwordHelp === undefined
                            ? 'Forgot your password? Contact your supervisor or IT.'
                            : props.passwordHelp,
                    ),
                )
                : null,
            error
                ? React.createElement(
                    'div',
                    {
                        'data-testid': 'login-error',
                        role: 'alert',
                        style: {
                            fontSize: small ? 13 : vw(8, 1, 11),
                            color: S.cssVar('login-error-text', '#ff9080'),
                            background: S.cssVar('login-error-bg', 'rgba(180, 40, 20, 0.25)'),
                            border: '1px solid ' + S.cssVar('login-error-border', 'rgba(180, 40, 20, 0.4)'),
                            borderRadius: S.cssVar('radius-btn', '3px'),
                            padding: small ? '10px 12px' : '4px 8px',
                        },
                    },
                    React.createElement('div', null, error),
                    // The way out of a wrong-username dead end. A failed sign-in
                    // never says WHICH half was wrong, so the screen has to offer
                    // the other one back.
                    React.createElement(
                        'button',
                        {
                            type: 'button',
                            onClick: goBack,
                            style: {
                                background: 'none', border: 'none', padding: 0,
                                marginTop: small ? 6 : 4,
                                color: S.cssVar('login-error-link', '#ffc0b0'),
                                textDecoration: 'underline',
                                fontFamily: bodyFont,
                                fontSize: small ? 12 : vw(8, 0.9, 11),
                                cursor: 'pointer',
                            },
                        },
                        byEmail ? 'Try a different email' : 'Try a different username',
                    ),
                )
                : null,
            React.createElement(
                'div',
                {
                    style: {
                        display: 'flex',
                        justifyContent: step === 'password' ? 'space-between' : 'flex-end',
                        gap: small ? 10 : 8, marginTop: 4,
                    },
                },
                step === 'password'
                    ? React.createElement(
                        'button',
                        {
                            type: 'button',
                            onClick: goBack,
                            style: {
                                background: S.cssVar('login-back', 'linear-gradient(to bottom, #607090, #404860)'),
                                border: '1px solid ' + S.cssVar('login-back-border', 'rgba(100, 130, 180, 0.4)'),
                                borderRadius: S.cssVar('radius-btn', '3px'),
                                color: S.cssVar('login-text', '#ffffff'),
                                fontFamily: bodyFont,
                                fontSize: small ? 14 : btnFs,
                                padding: small ? '0 20px' : vw(3, 0.5, 6) + ' ' + vw(10, 2, 20),
                                minHeight: small ? 48 : undefined,
                                flex: small ? 1 : undefined,
                                cursor: 'pointer',
                            },
                        },
                        'Back',
                    )
                    : null,
                React.createElement(
                    'button',
                    {
                        type: 'submit',
                        'data-testid': 'login-submit',
                        disabled: busy,
                        style: {
                            background: busy
                                ? S.cssVar('login-submit-busy', 'linear-gradient(to bottom, #3a6090, #1a3a6a)')
                                : S.cssVar('login-submit', 'linear-gradient(to bottom, #4a90d9, #2563c4)'),
                            border: '1px solid ' + S.cssVar('login-submit-border', '#0a246a'),
                            borderRadius: S.cssVar('radius-btn', '3px'),
                            color: S.cssVar('login-text', '#ffffff'),
                            fontFamily: bodyFont,
                            fontSize: small ? 15 : btnFs,
                            fontWeight: small ? 600 : undefined,
                            padding: small ? '0 20px' : vw(3, 0.5, 6) + ' ' + vw(10, 2, 20),
                            minHeight: small ? 48 : undefined,
                            flex: small ? 1 : undefined,
                            cursor: busy ? 'not-allowed' : 'pointer',
                            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                        },
                    },
                    busy ? 'Signing in...' : step === 'username' ? 'Next' : 'Sign In',
                ),
            ),
        );
    };

    const badge = function (small) {
        // Always mounted, both layouts: the avatar is the photo on the card that
        // forms around it, and swapping components at the step change is exactly
        // what made it flash. The card carries the name, so there is no separate
        // name line anywhere on the screen.
        return React.createElement(IdCard, {
            compact: small,
            open: step === 'password',
            avatar: props.avatar,
            username: badgeUser,
            fullName: identity.fullName,
            role: identity.role,
        });
    };

    const statusLine = React.createElement(
        'div',
        { style: { display: 'flex', alignItems: 'center', justifyContent: compact ? 'center' : undefined, gap: 4 } },
        React.createElement(StatusDot, { status: props.status }),
        props.statusLabel === undefined
            ? (STATUS_LABEL[props.status || 'checking'])
            : props.statusLabel,
        props.version
            ? React.createElement('span', { style: { marginLeft: 8, opacity: 0.6 } }, 'v' + props.version)
            : null,
    );

    const screenStyle = Object.assign({
        minHeight: S.cssVar('app-vh', '100dvh'),
        width: '100%',
        background: S.cssVar('login-bg', 'linear-gradient(135deg, #0d1f5c 0%, #1a3fa8 40%, #0a246a 100%)'),
        fontFamily: bodyFont,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        // For the dot-matrix canvas: `relative` gives it a containing block, and
        // `isolate` forces a stacking context so its z-index:-1 lands between
        // this element's own gradient and the content, rather than escaping
        // behind an ancestor. Without `isolate` the city can vanish under the
        // host page in an app that wraps sign-in in its own positioned shell.
        position: 'relative',
        isolation: 'isolate',
    }, props.style);

    // z-index:-1 rather than 0: negative-index positioned children paint above
    // the root's background but below non-positioned block descendants, so every
    // existing child stays on top without needing a stacking fix of its own.
    const cityNode = matrixData
        ? React.createElement(CityMatrix, {
            data: matrixData,
            blink: props.cityMatrixBlink,
            style: { zIndex: -1 },
        })
        : null;

    if (compact) {
        return React.createElement(
            'div',
            { style: screenStyle },
            cityNode,
            React.createElement(
                'div',
                { style: { padding: '32px 28px 20px', textAlign: 'center' } },
                wordmark({ compact: true, center: true }),
                taglineNode,
            ),
            React.createElement(
                'div',
                { style: { padding: '0 28px 8px', display: 'flex', justifyContent: 'center' } },
                React.createElement(SuitePanel, {
                    compact: true,
                    modules: props.suite,
                    icons: props.suiteIcons,
                    active: props.activeModules,
                }),
            ),
            React.createElement(
                'div',
                {
                    style: {
                        flex: 1, display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        gap: 20, padding: '0 28px 40px',
                    },
                },
                badge(true),
                hint,
                renderForm(true),
            ),
            React.createElement(
                'div',
                {
                    style: {
                        padding: '0 28px 24px', textAlign: 'center', lineHeight: 1.6,
                        fontSize: 12, color: S.cssVar('login-text-2', '#a8bee0'),
                    },
                },
                now ? fmtTime(now) + ' · ' + fmtDate(now) : null,
                props.docsHref
                    ? React.createElement(
                        'div',
                        { style: { marginTop: 8 } },
                        React.createElement(DocsPill, {
                            compact: true, href: props.docsHref,
                            label: props.docsLabel, icon: props.docsIcon,
                        }),
                    )
                    : null,
                React.createElement(
                    'div',
                    { style: { marginTop: 10, fontSize: 10, color: S.cssVar('login-text-3', '#7f97c0') } },
                    statusLine,
                    props.lastUpdated
                        ? React.createElement('div', { style: { marginTop: 2, opacity: 0.6 } }, 'Last updated ' + props.lastUpdated)
                        : null,
                ),
            ),
        );
    }

    const stripeBase = {
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'clamp(16px, calc(' + S.cssVar('app-vh', '100dvh') + ' * 3 / 100), 40px) 6%',
    };

    return React.createElement(
        'div',
        { style: screenStyle },
        cityNode,
        // ── Top stripe ──────────────────────────────────────────────────────
        React.createElement(
            'div',
            {
                style: Object.assign({}, stripeBase, {
                    background: S.cssVar('login-stripe-top', 'linear-gradient(to bottom, rgba(255,255,255,0.08) 0%, transparent 100%)'),
                    borderBottom: '1px solid ' + S.cssVar('login-stripe-top-border', 'rgba(166, 202, 240, 0.15)'),
                }),
            },
            React.createElement(
                'div',
                { style: { display: 'flex', flexDirection: 'column', gap: 2 } },
                wordmark({}),
                taglineNode,
            ),
            React.createElement(
                'div',
                {
                    style: {
                        textAlign: 'right', display: 'flex', flexDirection: 'column',
                        alignItems: 'flex-end', gap: 4,
                    },
                },
                props.blurb
                    ? React.createElement(
                        'div',
                        {
                            style: {
                                fontSize: vw(7, 0.9, 11),
                                color: S.cssVar('login-muted', '#9fb8dc'),
                                lineHeight: 1.9, letterSpacing: 1,
                            },
                        },
                        props.blurb,
                    )
                    : null,
                React.createElement(DocsPill, {
                    href: props.docsHref, label: props.docsLabel, icon: props.docsIcon,
                }),
            ),
        ),
        // ── Centre: suite | rule | form ─────────────────────────────────────
        React.createElement(
            'div',
            { style: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' } },
            React.createElement(
                'div',
                {
                    style: {
                        flex: 1, display: 'flex', flexDirection: 'column',
                        alignItems: 'center', gap: 16, padding: '0 4%',
                    },
                },
                React.createElement(SuitePanel, {
                    modules: props.suite,
                    icons: props.suiteIcons,
                    active: props.activeModules,
                }),
                React.createElement('div', {
                    style: {
                        width: '60%', height: 1,
                        background: 'linear-gradient(to right, transparent, ' +
                            S.cssVar('login-divider', 'rgba(166, 202, 240, 0.35)') + ', transparent)',
                    },
                }),
                hint,
            ),
            React.createElement('div', {
                style: {
                    width: 1, alignSelf: 'stretch', margin: '0 2%',
                    background: 'linear-gradient(to bottom, transparent, ' +
                        S.cssVar('login-divider', 'rgba(166, 202, 240, 0.35)') + ', transparent)',
                },
            }),
            React.createElement(
                'div',
                {
                    style: {
                        minWidth: '38%', maxWidth: 420, padding: '0 5%',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                    },
                },
                badge(false),
                renderForm(false),
            ),
        ),
        // ── Bottom stripe: status/version + clock ───────────────────────────
        React.createElement(
            'div',
            {
                style: Object.assign({}, stripeBase, {
                    background: S.cssVar('login-stripe-bottom', 'linear-gradient(to top, rgba(0,0,60,0.7) 0%, transparent 100%)'),
                    borderTop: '1px solid ' + S.cssVar('login-stripe-bottom-border', 'rgba(166, 202, 240, 0.1)'),
                }),
            },
            React.createElement(
                'div',
                {
                    style: {
                        fontSize: vw(8, 1, 12),
                        color: S.cssVar('login-text-2', '#a8bee0'),
                        lineHeight: 1.6,
                    },
                },
                statusLine,
                props.lastUpdated
                    ? React.createElement('div', { style: { opacity: 0.6 } }, 'Last updated ' + props.lastUpdated)
                    : null,
            ),
            React.createElement(
                'div',
                {
                    style: {
                        textAlign: 'right', lineHeight: 1.6,
                        fontSize: vw(8, 1, 12),
                        color: S.cssVar('login-text-2', '#a8bee0'),
                    },
                },
                now ? fmtTime(now) : null,
                now ? React.createElement('br') : null,
                now ? fmtDate(now) : null,
            ),
        ),
    );
}

LoginScreen.SuitePanel = SuitePanel;
LoginScreen.IdCard = IdCard;
LoginScreen.StatusDot = StatusDot;
LoginScreen.SUITE_MODULES = SUITE_MODULES;
LoginScreen.STATUS_LABEL = STATUS_LABEL;

module.exports = LoginScreen;
module.exports.LoginScreen = LoginScreen;
module.exports.SuitePanel = SuitePanel;
module.exports.IdCard = IdCard;
module.exports.StatusDot = StatusDot;
module.exports.SUITE_MODULES = SUITE_MODULES;
module.exports.STATUS_LABEL = STATUS_LABEL;
