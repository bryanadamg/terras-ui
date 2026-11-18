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
const brandStyle = (collapsed, clickable) => ({
    height: S.cssVar('app-header-h', '30px'),
    flexShrink: 0,
    background: S.cssVar('title-flat', '#0058e6'),
    borderBottom: '1px solid ' + S.cssVar('title-blue-border', '#003080'),
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
    color: S.cssVar('on-solid', '#ffffff'),
    display: 'flex',
    alignItems: 'center',
    justifyContent: collapsed ? 'center' : undefined,
    gap: collapsed ? 0 : 6,
    padding: collapsed ? '0 4px' : '0 10px',
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

function itemStyle(active, hovered, sub, collapsed) {
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
        justifyContent: collapsed ? 'center' : undefined,
        gap: collapsed ? 0 : 5,
        // Collapsed drops the `sub` indent — there is no room for it. A sub row
        // is still told apart from a flat one by `--terras-sidebar-sub-bg`,
        // which is why that tint has to stay a token and not become padding.
        padding: collapsed ? '5px 0' : (sub ? '4px 8px 4px 22px' : '5px 8px 5px 14px'),
        cursor: 'pointer',
        userSelect: 'none',
        borderLeft: active && !hovered
            ? '3px solid ' + S.cssVar('sidebar-hover-bg', '#0058e6')
            : '3px solid transparent',
        // Mirrors the 3px marker on the far side so the lone icon sits on the
        // rail's true centre instead of 1.5px right of it.
        borderRight: collapsed ? '3px solid transparent' : undefined,
        borderBottom: '1px solid ' + S.cssVar('sidebar-item-border', '#c0ccee'),
        background: background,
        color: hovered ? S.cssVar('sidebar-hover-color', '#ffffff') : S.cssVar('sidebar-active-color', '#003080'),
        fontWeight: active ? 'bold' : 'normal',
        fontSize: sub ? S.fs.sub : S.fs.base,
        transition: 'background 0.08s',
    };
}

// Group heading — a solid gradient band, not a quiet uppercase label. It is the
// classic sidebar's strongest structural cue; dropping it is what makes a
// themed sidebar still read as a generic modern nav rail. That is also why the
// band survives collapsing: it shrinks to its icon, or to a bare 6px stripe
// when the section has no icon, rather than disappearing and letting two
// unrelated groups of glyphs run together.
function sectionStyle(highlighted, collapsed, bare) {
    return {
        background: highlighted
            ? S.cssVar('sidebar-section-bg-hover', 'linear-gradient(to right, #2a7cff, #0058e6)')
            : S.cssVar('sidebar-section-bg', 'linear-gradient(to right, #0058e6, #003080)'),
        color: S.cssVar('on-solid', '#ffffff'),
        fontWeight: 'bold',
        fontSize: S.fs.sm,
        height: bare ? 6 : undefined,
        padding: bare ? 0 : (collapsed ? '4px 0' : '4px 8px'),
        letterSpacing: S.trackingCaps,
        textTransform: 'uppercase',
        borderTop: '1px solid ' + S.cssVar('sidebar-section-border-top', '#7090cc'),
        borderBottom: '1px solid ' + S.cssVar('sidebar-section-border-bottom', '#003080'),
        display: 'flex',
        justifyContent: collapsed ? 'center' : 'space-between',
        alignItems: 'center',
        gap: collapsed ? 0 : 6,
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'background 0.08s',
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
            style: itemStyle(!!item.active, props.hovered, !!item.sub, collapsed),
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
        collapsed
            ? null
            : React.createElement('span', {
                // nowrap under expandOnHover: the rail widens over 0.12s, and a
                // label that wraps mid-animation makes every row jump in height.
                style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: props.nowrap ? 'nowrap' : undefined },
            }, item.label),
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
 * it, closing 300ms after both leave. The open/closed state is the component's
 * own — transient, like its row hover — and `onExpandedChange` reports the width
 * it is drawn at, for an app whose layout has to follow it. With
 * `onToggleCollapsed`, the chevron in a hover-opened band pins it open (») and
 * the chevron of a pinned one lets it collapse back to the rail («).
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
    const peekState = React.useState(false);
    const peek = hoverMode && peekState[0];
    const setPeek = peekState[1];
    const peekTimer = React.useRef(0);
    const pointerInside = React.useRef(false);
    const schedulePeek = function (open, delay) {
        clearTimeout(peekTimer.current);
        peekTimer.current = setTimeout(function () { setPeek(open); }, delay);
    };
    React.useEffect(function () {
        return function () { clearTimeout(peekTimer.current); };
    }, []);
    const collapsed = !!props.collapsed && !peek;

    const onExpandedChange = props.onExpandedChange;
    React.useEffect(function () {
        if (onExpandedChange) onExpandedChange(!collapsed);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [collapsed]);

    const hoverHandlers = props.expandOnHover ? {
        onMouseEnter: function () { pointerInside.current = true; schedulePeek(true, 120); },
        onMouseLeave: function () { pointerInside.current = false; schedulePeek(false, 300); },
        onFocus: function () { schedulePeek(true, 0); },
        onBlur: function (e) {
            if (!pointerInside.current && !e.currentTarget.contains(e.relatedTarget)) schedulePeek(false, 300);
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
            nowrap: !!props.expandOnHover,
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
    const showBrand = props.appName || props.brandIcon || onToggle;

    return React.createElement(
        'aside',
        Object.assign({ style: containerStyle(collapsed, props.width, props.collapsedWidth, props.style) }, hoverHandlers),
        showBrand
            ? React.createElement(
                'div',
                {
                    style: brandStyle(collapsed, brandIsToggle),
                    onClick: brandIsToggle ? onToggle : undefined,
                    title: brandIsToggle ? 'Expand sidebar' : undefined,
                    role: brandIsToggle ? 'button' : undefined,
                    'aria-expanded': brandIsToggle ? false : undefined,
                },
                collapsed
                    ? (props.brandIcon || (onToggle ? React.createElement('span', { style: toggleStyle }, '»') : null))
                    : React.createElement(
                        React.Fragment,
                        null,
                        props.brandIcon || null,
                        props.appName
                            ? React.createElement(
                                'span',
                                { style: { flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } },
                                props.appName,
                            )
                            : React.createElement('span', { style: { flex: 1 } }),
                        onToggle
                            ? React.createElement(
                                'span',
                                {
                                    style: toggleStyle,
                                    onClick: onToggle,
                                    title: peek ? 'Keep sidebar open' : 'Collapse sidebar',
                                    role: 'button',
                                    'aria-label': peek ? 'Keep sidebar open' : 'Collapse sidebar',
                                    'aria-pressed': peek ? false : undefined,
                                    'aria-expanded': peek ? undefined : true,
                                },
                                peek ? '»' : '«',
                            )
                            : null,
                    ),
            )
            : null,
        top
            ? React.createElement(
                'div',
                { style: { padding: collapsed ? '8px 4px 4px' : '8px 8px 4px', flexShrink: 0, overflow: 'hidden' } },
                top,
            )
            : null,
        React.createElement(
            'nav',
            { className: 'terras-scroll', style: navStyle, ref: props.navRef, onScroll: props.onNavScroll },
            items.map(renderItem),
            sections.map(function (section) {
                const childActive = (section.items || []).some(function (i) { return i.active; });
                const bare = collapsed && !section.icon;
                return React.createElement(
                    React.Fragment,
                    { key: section.key },
                    React.createElement(
                        'div',
                        {
                            // `section.active`: the section's OWN page is current (e.g. a
                            // mini-dashboard route), distinct from `childActive` — a section
                            // can be "where you are" with no child row selected at all.
                            style: sectionStyle(hoveredKey === section.key || childActive || !!section.active, collapsed, bare),
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
                        collapsed
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
                                    { style: { display: 'flex', alignItems: 'center', gap: 5, minWidth: 0, whiteSpace: props.expandOnHover ? 'nowrap' : undefined } },
                                    section.icon || null,
                                    section.label,
                                ),
                                section.right || null,
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
        footer ? React.createElement('div', { style: footerStyle(collapsed) }, footer) : null,
    );
}

module.exports = Sidebar;
module.exports.Sidebar = Sidebar;
