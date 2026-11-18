'use client';
'use strict';

// Shared sidebar shell — layout + classic-theme palette only. Navigation itself
// (routing, active-route matching) stays with the consuming app: each item is a
// plain clickable div (mirrors erp's own Sidebar.tsx, which uses div+onClick and
// router.push rather than <a>/<Link>), so this works the same under Next.js
// (next/navigation) and react-router (useNavigate) without either being a
// dependency of this package.
//
// Collapsing follows the same split: this file owns what the icon rail LOOKS
// like, the app owns whether it is collapsed. `collapsed` is a controlled prop
// exactly like an item's `active` — persisting the choice, a keyboard shortcut
// and any responsive auto-collapse belong to the app. That is not only
// consistency: erp is Next.js, and seeding the initial state from localStorage
// during render is a hydration mismatch each app has to solve its own way.
//
// Written as plain React.createElement (no JSX) so no build step is needed to
// consume it — matches this repo's "no build step, hand-edited source" model.
// React is a peerDependency; this file never bundles or requires a specific version.

const React = require('react');
const S = require('./styles');
const scale = require('../scale');

const containerStyle = (collapsed, width, collapsedWidth, style) => Object.assign({
    width: collapsed
        ? (collapsedWidth || S.cssVar('sidebar-width-collapsed', '44px'))
        : (width || S.cssVar('sidebar-width', '200px')),
    transition: 'width 0.12s',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    // NO `height: 100%`. An explicit height opts the aside OUT of its flex
    // parent's align-items:stretch and then resolves against a parent that
    // usually only has `min-height` — so it collapsed to the height of its own
    // items and left the page background showing underneath. `alignSelf:
    // stretch` is what actually makes it span the row.
    alignSelf: 'stretch',
    minHeight: 0,
    background: S.cssVar('sidebar-bg', S.cssVar('win-bg', '#f3f4f6')),
    borderRight: '1px solid ' + S.cssVar('sidebar-border', '#718bb7'),
    fontFamily: S.font,
    fontSize: S.fs.base,
    color: S.cssVar('sidebar-active-color', '#003080'),
}, style);

// Brand block. Same background, height and bottom border as AppHeader, because
// the two are separate elements sitting side by side and only read as ONE
// continuous title band while they match — erp's brand block was once 40px
// against a 30px header and the band stepped down at the sidebar seam. Height
// comes from `--terras-app-header-h`; never re-type the number here.
// Glide layout (expandOnHover). The rail is not a second layout but the open
// one seen through a narrow window: every row keeps its open structure, only
// its left padding moves — from "icon centred on the rail" to its open indent —
// and labels fade rather than mount. A layout switch mid-animation is what made
// labels wrap and icons jump. `railLeft(w)` is the padding that centres a w-px
// box on the rail.
const railLeft = (w) => 'calc(' + S.cssVar('sidebar-width-collapsed', '44px') + ' / 2 - ' + (w / 2) + 'px)';
// Duration + easing of every glide transition (row padding, label fades, slot
// padding), from one custom property so the app can give the rail a feel —
// and keep its own layout (a card that makes room for the rail) on the same
// curve. Unset, it is the 0.12s default these always had.
const GLIDE = 'var(--terras-sidebar-motion, 0.12s)';
// Hover rail timing: open after 120ms of contact (a pass across the rail on the
// way somewhere else is not a request), close 200ms after the pointer leaves —
// long enough to forgive overshooting the edge while reaching for a row (which,
// with a layout that makes room for the rail, would reflow the page twice),
// short enough not to read as lag. The two flank the 0.12s width animation.
const CLOSE_DELAY = 200;
// Opacity is applied last: an element with its own resting opacity (the pin
// control's 0.85) keeps it while shown, but is fully gone on the rail — set
// first, the element's own value won and the pin hung half-visible in 44px.
const fade = (shown, extra) => Object.assign({
    transition: 'opacity ' + GLIDE,
    whiteSpace: 'nowrap',
}, extra, {
    opacity: shown ? (extra && extra.opacity != null ? extra.opacity : 1) : 0,
});

const brandStyle = (collapsed, clickable, glide) => ({
    height: S.cssVar('app-header-h', '30px'),
    flexShrink: 0,
    background: S.cssVar('title-flat', '#0058e6'),
    borderBottom: '1px solid ' + S.cssVar('title-blue-border', '#003080'),
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
    color: S.cssVar('on-solid', '#ffffff'),
    display: 'flex',
    alignItems: 'center',
    justifyContent: collapsed && !glide ? 'center' : undefined,
    gap: collapsed && !glide ? 0 : 6,
    // Glide: a 20px brand mark (the size the apps pass) centred on the rail.
    padding: glide ? ('0 10px 0 ' + (collapsed ? railLeft(20) : '10px')) : (collapsed ? '0 4px' : '0 10px'),
    transition: glide ? 'padding-left ' + GLIDE : undefined,
    fontWeight: 'bold',
    fontSize: S.fs.base,
    userSelect: 'none',
    overflow: 'hidden',
    cursor: clickable ? 'pointer' : undefined,
});

// The expand/collapse chevron. Deliberately not a `Button` — this sits inside
// the title band, where a raised bevel face would read as a second window
// control next to the AppHeader's actions. Classic chrome puts a bare
// guillemet here.
const toggleStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: 14,
    lineHeight: 1,
    fontSize: S.fs.title,
    fontWeight: 'bold',
    color: S.cssVar('on-solid', '#ffffff'),
    opacity: 0.85,
    cursor: 'pointer',
};

// overflowX hidden: while the width animates between rail and full, rows that
// are momentarily wider than the box must clip, not grow a horizontal scrollbar.
const navStyle = { flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 };

const footerStyle = (collapsed) => ({
    flexShrink: 0,
    background: S.cssVar('sidebar-footer-bg', '#c0cade'),
    borderTop: '1px solid ' + S.cssVar('sidebar-footer-border', '#9098b8'),
    padding: collapsed ? '6px 4px' : '6px 8px',
    overflow: 'hidden',
});

function itemStyle(active, hovered, sub, collapsed, glide) {
    const background = hovered
        ? S.cssVar('sidebar-hover-bg', '#0058e6')
        : active
            ? S.cssVar('sidebar-active-bg', '#ffffff')
            : sub
                ? S.cssVar('sidebar-sub-bg', '#bcc9e8')
                : 'transparent';
    return {
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed && !glide ? 'center' : undefined,
        gap: collapsed && !glide ? 0 : 5,
        // Collapsed drops the `sub` indent — there is no room for it. A sub row
        // is still told apart from a flat one by `--terras-sidebar-sub-bg`,
        // which is why that tint has to stay a token and not become padding.
        // Glide keeps the open row's vertical padding in both states (rows never
        // change height) and slides only the left edge: 3px marker + padding +
        // 7px puts the 14px icon box on the rail's centre.
        padding: glide
            ? (sub ? '4px 8px 4px ' : '5px 8px 5px ') + (collapsed ? 'calc(' + railLeft(14) + ' - 3px)' : (sub ? '22px' : '14px'))
            : collapsed ? '5px 0' : (sub ? '4px 8px 4px 22px' : '5px 8px 5px 14px'),
        cursor: 'pointer',
        userSelect: 'none',
        borderLeft: active && !hovered
            ? '3px solid ' + S.cssVar('sidebar-hover-bg', '#0058e6')
            : '3px solid transparent',
        // Mirrors the 3px marker on the far side so the lone icon sits on the
        // rail's true centre instead of 1.5px right of it.
        borderRight: collapsed && !glide ? '3px solid transparent' : undefined,
        borderBottom: '1px solid ' + S.cssVar('sidebar-item-border', '#c0ccee'),
        background: background,
        color: hovered ? S.cssVar('sidebar-hover-color', '#ffffff') : S.cssVar('sidebar-active-color', '#003080'),
        fontWeight: active ? 'bold' : 'normal',
        fontSize: sub ? S.fs.sub : S.fs.base,
        transition: glide ? 'background 0.08s, padding-left ' + GLIDE : 'background 0.08s',
    };
}

// Group heading — a solid gradient band, not a quiet uppercase label. It is the
// classic sidebar's strongest structural cue; dropping it is what makes a
// themed sidebar still read as a generic modern nav rail. That is also why the
// band survives collapsing: it shrinks to its icon, or to a bare 6px stripe
// when the section has no icon, rather than disappearing and letting two
// unrelated groups of glyphs run together.
function sectionStyle(highlighted, collapsed, bare, glide) {
    return {
        background: highlighted
            ? S.cssVar('sidebar-section-bg-hover', 'linear-gradient(to right, #2a7cff, #0058e6)')
            : S.cssVar('sidebar-section-bg', 'linear-gradient(to right, #0058e6, #003080)'),
        color: S.cssVar('on-solid', '#ffffff'),
        fontWeight: 'bold',
        fontSize: S.fs.sm,
        height: bare ? 6 : undefined,
        // Glide: the band's icon (~10px of glyph) centred on the rail.
        padding: glide
            ? '4px 8px 4px ' + (collapsed ? railLeft(10) : '8px')
            : bare ? 0 : (collapsed ? '4px 0' : '4px 8px'),
        letterSpacing: S.trackingCaps,
        textTransform: 'uppercase',
        borderTop: '1px solid ' + S.cssVar('sidebar-section-border-top', '#7090cc'),
        borderBottom: '1px solid ' + S.cssVar('sidebar-section-border-bottom', '#003080'),
        display: 'flex',
        justifyContent: collapsed && !glide ? 'center' : 'space-between',
        alignItems: 'center',
        gap: collapsed && !glide ? 0 : 6,
        cursor: 'pointer',
        userSelect: 'none',
        transition: glide ? 'background 0.08s, padding-left ' + GLIDE : 'background 0.08s',
    };
}

// A `top` / `footer` slot may be a plain node or a render function, so an app
// can hand back something rail-safe instead of having its primary action button
// clipped to 44px. Called with the state rather than a bare boolean so the
// argument reads at the call site.
function slot(node, collapsed) {
    return typeof node === 'function' ? node({ collapsed: collapsed }) : node;
}

// Falls back to the label so a bare icon still names itself on hover. Only when
// the label is a string — a ReactNode label has no meaningful `title` text, and
// `[object Object]` is worse than no tooltip.
function tooltip(item, collapsed) {
    if (item.title) return item.title;
    if (collapsed && typeof item.label === 'string') return item.label;
    return undefined;
}

/**
 * One nav item. `item`: { key, label, icon?, active, sub?, onClick, title? }.
 * `icon` is any ReactNode (a bootstrap-icon <i>, a lucide-react component, ...) —
 * this component has no icon-set opinion.
 */
function SidebarItem(props) {
    const item = props.item;
    const collapsed = props.collapsed;
    return React.createElement(
        'div',
        {
            onClick: item.onClick,
            onMouseEnter: props.onHover,
            onMouseLeave: props.onLeave,
            style: itemStyle(!!item.active, props.hovered, !!item.sub, collapsed, props.glide),
            title: tooltip(item, collapsed),
            role: 'button',
            'aria-current': item.active ? 'page' : undefined,
        },
        item.icon
            ? React.createElement(
                'span',
                { style: { width: 14, display: 'flex', justifyContent: 'center', flexShrink: 0, lineHeight: 0 } },
                item.icon,
            )
            : null,
        props.glide
            // Always mounted, faded on the rail: mounting it as the rail starts
            // to widen is what wrapped it across three lines for a frame.
            ? React.createElement('span', { style: fade(!collapsed, { overflow: 'hidden', textOverflow: 'ellipsis' }) }, item.label)
            : collapsed
                ? null
                : React.createElement('span', { style: { overflow: 'hidden', textOverflow: 'ellipsis' } }, item.label),
    );
}

/**
 * Sidebar shell: brand band + scrollable nav + optional footer.
 * Only renders the classic-theme palette (see tokens.css `--terras-sidebar-*`) —
 * this is the primary Terras brand; a modern-theme variant is not built yet.
 *
 * Pass `items` for a flat list, `sections` for grouped nav, or both (flat items
 * render first, above the groups — that's where a Dashboard / Home row goes).
 *
 * Collapsing is controlled: pass `collapsed` and own the state. Pass
 * `onToggleCollapsed` too and the brand band grows the built-in chevron; leave
 * it off and no toggle chrome renders at all, for an app that would rather
 * drive the state from its own AppHeader action.
 *
 * `expandOnHover` turns `collapsed` into "not pinned": the rail rests at icon
 * width and opens while the pointer (after 120ms) or keyboard focus is inside
 * it, closing 200ms after both leave. The open/closed state is the component's
 * own — transient, like its row hover — and `onExpandedChange` reports the width
 * it is drawn at, for an app whose layout has to follow it. With
 * `onToggleCollapsed`, the band's control pins it: on a hover-opened band it
 * pins it open, on a pinned one it unpins it back to the rail. `pinIcon({ pinned })`
 * draws that control (pressed while pinned); without it, » and «.
 *
 * `approachDistance` (layout px) lets it start opening before contact: a
 * pointer within that distance of the rail's edge and moving toward it opens
 * it at once, so the rail is already widening as the cursor arrives. "Moving
 * toward it" means its speed would carry it onto the rail within a few events —
 * the zone overlaps whatever sits beside the rail (a table's first column), and
 * slowing into that, pausing or working there must not throw it open.
 * Within the zone it also reports proximity, 0 → 1, as the
 * `--terras-sidebar-approach` property on the <aside> and through `onApproach`,
 * so the app can grow the rail with the cursor's distance (best over a gutter,
 * where growing moves nothing); meeting the cursor then opens it outright.
 *
 * @param {{
 *   appName?: React.ReactNode,
 *   brandIcon?: React.ReactNode,
 *   top?: React.ReactNode | ((state: { collapsed: boolean }) => React.ReactNode),
 *   items?: Array<{ key: string, label: React.ReactNode, icon?: React.ReactNode, active?: boolean, sub?: boolean, onClick: () => void, onMouseEnter?: () => void, onMouseLeave?: () => void, title?: string }>,
 *   sections?: Array<{ key: string, label: React.ReactNode, icon?: React.ReactNode, right?: React.ReactNode, active?: boolean, onClick?: () => void, onMouseEnter?: () => void, onMouseLeave?: () => void, items: Array<object> }>,
 *   navEnd?: React.ReactNode | ((state: { collapsed: boolean }) => React.ReactNode),
 *   footer?: React.ReactNode | ((state: { collapsed: boolean }) => React.ReactNode),
 *   collapsed?: boolean,
 *   onToggleCollapsed?: () => void,
 *   expandOnHover?: boolean,
 *   approachDistance?: number,
 *   pinIcon?: (state: { pinned: boolean }) => React.ReactNode,
 *   onApproach?: (progress: number) => void,
 *   onExpandedChange?: (expanded: boolean) => void,
 *   width?: string | number,
 *   collapsedWidth?: string | number,
 *   navRef?: React.Ref<HTMLElement>,
 *   onNavScroll?: (e: React.UIEvent) => void,
 *   style?: object,
 * }} props
 */
function Sidebar(props) {
    const items = props.items || [];
    const sections = props.sections || [];
    const onToggle = props.onToggleCollapsed;

    // Hover-to-expand. `peek` is the hover-opened state, meaningful only while
    // the rail is unpinned; `collapsed` below is what is actually drawn.
    const hoverMode = !!props.expandOnHover && !!props.collapsed;
    // The glide layout follows the option, not the state: a pinned sidebar uses
    // it too, so unpinning back to the rail animates the same way.
    const glide = !!props.expandOnHover;
    const peekState = React.useState(false);
    const peek = hoverMode && peekState[0];
    const setPeek = peekState[1];
    const peekTimer = React.useRef(0);
    const peekPending = React.useRef(null);
    const pointerInside = React.useRef(false);
    // One countdown per change of mind. Asking again for the change already
    // pending keeps the running timer instead of restarting it — restarting is
    // what let a cursor that kept moving away hold the rail open until it stopped
    // (1.8s after leaving, measured, instead of the close delay).
    const schedulePeek = function (open, delay) {
        if (peekPending.current === open) return;
        clearTimeout(peekTimer.current);
        peekPending.current = open;
        peekTimer.current = setTimeout(function () { peekPending.current = null; setPeek(open); }, delay);
    };
    React.useEffect(function () {
        return function () { clearTimeout(peekTimer.current); };
    }, []);
    const collapsed = !!props.collapsed && !peek;
    const asideRef = React.useRef(null);
    const peekRef = React.useRef(false);
    peekRef.current = peek;

    // Approach: watch the pointer outside the rail. Only while unpinned and only
    // with a distance set — otherwise no listener at all.
    const approach = hoverMode && props.approachDistance > 0 ? props.approachDistance : 0;
    // Proximity, 0 (at the zone's far edge or beyond) → 1 (touching the rail).
    // Written as `--terras-sidebar-approach` on the <aside> and handed to
    // `onApproach`, so the app can grow the rail with it. Only reported when it
    // moves by a hundredth, not on every pointer event.
    const progress = React.useRef(0);
    const onApproachRef = React.useRef(props.onApproach);
    onApproachRef.current = props.onApproach;
    const report = function (p) {
        const v = Math.round(p * 100) / 100;
        if (v === progress.current) return;
        progress.current = v;
        if (asideRef.current) asideRef.current.style.setProperty('--terras-sidebar-approach', String(v));
        if (onApproachRef.current) onApproachRef.current(v);
    };
    React.useEffect(function () {
        if (!approach) return undefined;
        let lastX = null;
        // The rail's resting edge. Distance is measured from it, not from the
        // live edge: a rail grown by the app's approach styling would otherwise
        // chase the cursor. Re-read whenever the rail is at rest.
        let restRight = null;
        const onMove = function (e) {
            const el = asideRef.current;
            if (!el) return;
            if (pointerInside.current) { lastX = null; report(0); return; }
            const r = scale.layoutRectOf(el);
            if (progress.current === 0 || restRight === null) restRight = r.right;
            const x = scale.toLayoutPx(e.clientX);
            const y = scale.toLayoutPx(e.clientY);
            const d = x - restRight;
            const inBand = y >= r.top && y <= r.bottom;
            // d <= 0 counts as near: a rail that widened under a still cursor
            // has it inside before any mouseenter fires.
            const near = inBand && d <= approach;
            // Open (hover- or approach-opened): no proximity to show, but a
            // pointer that wandered out of reach still has to close it.
            if (peekRef.current) {
                lastX = x;
                report(0);
                if (!near) schedulePeek(false, CLOSE_DELAY);
                return;
            }
            report(near ? Math.min(1, 1 - d / approach) : 0);
            // Heading INTO the rail, not just leftward: the last move carried
            // four events ahead has to reach its edge. A pointer aiming for
            // something beside the rail (a table's first column) slows as it
            // arrives, so its projection falls short; one aiming for the rail
            // keeps its speed.
            const dx = lastX === null ? 0 : x - lastX;
            const toward = dx <= -2 && x + dx * 4 <= restRight;
            lastX = x;
            if (near && (d <= 0 || toward)) schedulePeek(true, 0);
        };
        window.addEventListener('pointermove', onMove, { passive: true });
        return function () { window.removeEventListener('pointermove', onMove); report(0); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [approach]);

    const onExpandedChange = props.onExpandedChange;
    React.useEffect(function () {
        // Opened: proximity is spent. In the same commit as the width change, so
        // the app's approach growth hands over to the full width in one move.
        if (!collapsed) report(0);
        if (onExpandedChange) onExpandedChange(!collapsed);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [collapsed]);

    const hoverHandlers = props.expandOnHover ? {
        // No contact delay after an approach: the rail grew toward the cursor
        // until it met it, which is already the deliberate move the delay
        // waits for — and waiting would let the grown rail sit half-open.
        onMouseEnter: function () { pointerInside.current = true; schedulePeek(true, progress.current > 0 ? 0 : 120); },
        onMouseLeave: function () { pointerInside.current = false; schedulePeek(false, CLOSE_DELAY); },
        onFocus: function () { schedulePeek(true, 0); },
        onBlur: function (e) {
            if (!pointerInside.current && !e.currentTarget.contains(e.relatedTarget)) schedulePeek(false, CLOSE_DELAY);
        },
    } : null;
    const hoverState = React.useState(null);
    const hoveredKey = hoverState[0];
    const setHoveredKey = hoverState[1];

    const renderItem = function (item) {
        return React.createElement(SidebarItem, {
            key: item.key,
            item: item,
            collapsed: collapsed,
            glide: !!props.expandOnHover,
            hovered: hoveredKey === item.key,
            // Two listeners fire on the same enter/leave: this component's own
            // (style only) and the item's optional `onMouseEnter`/`onMouseLeave`
            // (app-level, e.g. debounced route prefetch) — kept separate so the
            // app callback never has to know this component also uses hover for
            // paint, and vice versa.
            onHover: function () {
                setHoveredKey(item.key);
                if (item.onMouseEnter) item.onMouseEnter();
            },
            onLeave: function () {
                setHoveredKey(null);
                if (item.onMouseLeave) item.onMouseLeave();
            },
        });
    };

    const top = slot(props.top, collapsed);
    const navEnd = slot(props.navEnd, collapsed);
    const footer = slot(props.footer, collapsed);

    // Collapsed, the band IS the control: the whole 44×30 strip is the hit
    // target and it keeps showing `brandIcon`, so the rail does not trade its
    // identity for an affordance. Only a sidebar with no brand mark at all
    // falls back to drawing the chevron itself.
    // Not under expandOnHover: the rail opens on hover before a click could land,
    // so the band would pin by surprise. Pinning there is the open band's ».
    const brandIsToggle = collapsed && !!onToggle && !props.expandOnHover;

    // Under expandOnHover the band's control pins: `pinIcon({ pinned })` draws it
    // (an app slot — this package carries no icon set), falling back to » / «.
    const pinned = !props.collapsed;
    const toggleLabel = props.expandOnHover
        ? (pinned ? 'Unpin sidebar' : 'Pin sidebar open')
        : 'Collapse sidebar';
    const toggleGlyph = props.expandOnHover && props.pinIcon
        ? props.pinIcon({ pinned: pinned })
        : (peek ? '»' : '«');
    const showBrand = props.appName || props.brandIcon || onToggle;

    return React.createElement(
        'aside',
        Object.assign({
            ref: asideRef,
            // `terras-sidebar-glide`: chrome.css drops the glide transitions under
            // prefers-reduced-motion (inline transitions can't be media-queried).
            className: glide ? 'terras-sidebar-glide' : undefined,
            // The drawn state, in the same commit that changes the layout — for
            // an app that switches --terras-sidebar-motion by direction, so the
            // glide inside picks up the new curve as it starts rather than a
            // render later (app state fed by onExpandedChange lags by one).
            'data-collapsed': glide ? String(collapsed) : undefined,
            style: containerStyle(collapsed, props.width, props.collapsedWidth, props.style),
        }, hoverHandlers),
        showBrand
            ? React.createElement(
                'div',
                {
                    style: brandStyle(collapsed, brandIsToggle, glide),
                    onClick: brandIsToggle ? onToggle : undefined,
                    title: brandIsToggle ? 'Expand sidebar' : undefined,
                    role: brandIsToggle ? 'button' : undefined,
                    'aria-expanded': brandIsToggle ? false : undefined,
                },
                collapsed && !glide
                    ? (props.brandIcon || (onToggle ? React.createElement('span', { style: toggleStyle }, '»') : null))
                    : React.createElement(
                        React.Fragment,
                        null,
                        props.brandIcon || null,
                        props.appName
                            ? React.createElement(
                                'span',
                                { style: (glide ? fade : function (_, x) { return Object.assign({}, x, { whiteSpace: 'nowrap' }); })(!collapsed, { flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }) },
                                props.appName,
                            )
                            : React.createElement('span', { style: { flex: 1 } }),
                        onToggle
                            ? React.createElement(
                                'span',
                                {
                                    // Faded and inert on the glide rail, where it has
                                    // no room and the rail opens on hover anyway.
                                    style: glide ? fade(!collapsed, Object.assign({}, toggleStyle, { pointerEvents: collapsed ? 'none' : undefined })) : toggleStyle,
                                    onClick: onToggle,
                                    title: toggleLabel,
                                    role: 'button',
                                    'aria-label': toggleLabel,
                                    // Hover mode: a pin, pressed while pinned. Otherwise
                                    // the plain collapse control it has always been.
                                    'aria-pressed': props.expandOnHover ? pinned : undefined,
                                    'aria-expanded': props.expandOnHover ? undefined : true,
                                },
                                toggleGlyph,
                            )
                            : null,
                    ),
            )
            : null,
        top
            ? React.createElement(
                'div',
                { style: { padding: collapsed ? '8px 4px 4px' : '8px 8px 4px', flexShrink: 0, overflow: 'hidden', transition: glide ? 'padding ' + GLIDE : undefined } },
                top,
            )
            : null,
        React.createElement(
            'nav',
            { className: 'terras-scroll', style: navStyle, ref: props.navRef, onScroll: props.onNavScroll },
            items.map(renderItem),
            sections.map(function (section) {
                const childActive = (section.items || []).some(function (i) { return i.active; });
                const bare = collapsed && !section.icon && !glide;
                return React.createElement(
                    React.Fragment,
                    { key: section.key },
                    React.createElement(
                        'div',
                        {
                            // `section.active`: the section's OWN page is current (e.g. a
                            // mini-dashboard route), distinct from `childActive` — a section
                            // can be "where you are" with no child row selected at all.
                            style: sectionStyle(hoveredKey === section.key || childActive || !!section.active, collapsed, bare, glide),
                            onClick: section.onClick,
                            // Same split as an item's: paint here, the app's own
                            // hook (e.g. prefetching the section's home page) after.
                            onMouseEnter: function () {
                                setHoveredKey(section.key);
                                if (section.onMouseEnter) section.onMouseEnter();
                            },
                            onMouseLeave: function () {
                                setHoveredKey(null);
                                if (section.onMouseLeave) section.onMouseLeave();
                            },
                            role: section.onClick ? 'button' : undefined,
                            title: collapsed && typeof section.label === 'string' ? section.label : undefined,
                        },
                        collapsed && !glide
                            // `section.right` is dropped, not shrunk: it holds a count
                            // badge or chevron that has nowhere to sit on a 44px rail.
                            ? (section.icon
                                ? React.createElement(
                                    'span',
                                    { style: { width: 14, display: 'flex', justifyContent: 'center', flexShrink: 0, lineHeight: 0 } },
                                    section.icon,
                                )
                                : null)
                            : React.createElement(
                                React.Fragment,
                                null,
                                React.createElement(
                                    'span',
                                    { style: { display: 'flex', alignItems: 'center', gap: 5, minWidth: 0, whiteSpace: glide ? 'nowrap' : undefined } },
                                    section.icon || null,
                                    glide ? React.createElement('span', { style: fade(!collapsed, { overflow: 'hidden' }) }, section.label) : section.label,
                                ),
                                // Glide: zero-width on the rail so it can't crowd the icon.
                                glide && section.right
                                    // max-width animates with the fade: snapped, the
                                    // chevron jumped ~58px while still visible on close.
                                    ? React.createElement('span', { style: fade(!collapsed, { flexShrink: 0, overflow: 'hidden', maxWidth: collapsed ? 0 : 40, transition: 'opacity ' + GLIDE + ', max-width ' + GLIDE }) }, section.right)
                                    : section.right || null,
                            ),
                    ),
                    (section.items || []).map(function (i) {
                        return renderItem(Object.assign({ sub: true }, i));
                    }),
                );
            }),
            // Inside the <nav>, so it scrolls with the list and sits after the
            // last row — erp's "Powered by" credit — rather than taking room in
            // the footer, which holds only the account card.
            navEnd,
        ),
        footer ? React.createElement('div', { style: Object.assign(footerStyle(collapsed), glide ? { transition: 'padding ' + GLIDE } : null) }, footer) : null,
    );
}

module.exports = Sidebar;
module.exports.Sidebar = Sidebar;
