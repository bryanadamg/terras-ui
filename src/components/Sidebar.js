'use strict';

// Shared sidebar shell — layout + classic-theme palette only. Navigation itself
// (routing, active-route matching) stays with the consuming app: each item is a
// plain clickable div (mirrors erp's own Sidebar.tsx, which uses div+onClick and
// router.push rather than <a>/<Link>), so this works the same under Next.js
// (next/navigation) and react-router (useNavigate) without either being a
// dependency of this package.
//
// Written as plain React.createElement (no JSX) so no build step is needed to
// consume it — matches this repo's "no build step, hand-edited source" model.
// React is a peerDependency; this file never bundles or requires a specific version.

const React = require('react');
const S = require('./styles');

const containerStyle = (width, style) => Object.assign({
    width: width || S.cssVar('sidebar-width', '200px'),
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
    fontSize: 11,
    color: S.cssVar('sidebar-active-color', '#003080'),
}, style);

// Brand block. Same background, height and bottom border as AppHeader, because
// the two are separate elements sitting side by side and only read as ONE
// continuous title band while they match — erp's brand block was once 40px
// against a 30px header and the band stepped down at the sidebar seam. Height
// comes from `--terras-app-header-h`; never re-type the number here.
const brandStyle = {
    height: S.cssVar('app-header-h', '30px'),
    flexShrink: 0,
    background: S.cssVar('title-flat', '#0058e6'),
    borderBottom: '1px solid ' + S.cssVar('title-blue-border', '#003080'),
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '0 10px',
    fontWeight: 'bold',
    fontSize: 11,
    userSelect: 'none',
    overflow: 'hidden',
};

const navStyle = { flex: 1, overflowY: 'auto', minHeight: 0 };

const footerStyle = {
    flexShrink: 0,
    background: S.cssVar('sidebar-footer-bg', '#c0cade'),
    borderTop: '1px solid ' + S.cssVar('sidebar-footer-border', '#9098b8'),
    padding: '6px 8px',
};

function itemStyle(active, hovered, sub) {
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
        gap: 5,
        padding: sub ? '4px 8px 4px 22px' : '5px 8px 5px 14px',
        cursor: 'pointer',
        userSelect: 'none',
        borderLeft: active && !hovered
            ? '3px solid ' + S.cssVar('sidebar-hover-bg', '#0058e6')
            : '3px solid transparent',
        borderBottom: '1px solid ' + S.cssVar('sidebar-item-border', '#c0ccee'),
        background: background,
        color: hovered ? S.cssVar('sidebar-hover-color', '#ffffff') : S.cssVar('sidebar-active-color', '#003080'),
        fontWeight: active ? 'bold' : 'normal',
        fontSize: sub ? 10.5 : 11,
        transition: 'background 0.08s',
    };
}

// Group heading — a solid gradient band, not a quiet uppercase label. It is the
// classic sidebar's strongest structural cue; dropping it is what makes a
// themed sidebar still read as a generic modern nav rail.
function sectionStyle(highlighted) {
    return {
        background: highlighted
            ? S.cssVar('sidebar-section-bg-hover', 'linear-gradient(to right, #2a7cff, #0058e6)')
            : S.cssVar('sidebar-section-bg', 'linear-gradient(to right, #0058e6, #003080)'),
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 10,
        padding: '4px 8px',
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        borderTop: '1px solid ' + S.cssVar('sidebar-section-border-top', '#7090cc'),
        borderBottom: '1px solid ' + S.cssVar('sidebar-section-border-bottom', '#003080'),
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 6,
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'background 0.08s',
    };
}

/**
 * One nav item. `item`: { key, label, icon?, active, sub?, onClick, title? }.
 * `icon` is any ReactNode (a bootstrap-icon <i>, a lucide-react component, ...) —
 * this component has no icon-set opinion.
 */
function SidebarItem(props) {
    const item = props.item;
    return React.createElement(
        'div',
        {
            onClick: item.onClick,
            onMouseEnter: props.onHover,
            onMouseLeave: props.onLeave,
            style: itemStyle(!!item.active, props.hovered, !!item.sub),
            title: item.title,
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
        React.createElement('span', { style: { overflow: 'hidden', textOverflow: 'ellipsis' } }, item.label),
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
 * @param {{
 *   appName?: React.ReactNode,
 *   brandIcon?: React.ReactNode,
 *   top?: React.ReactNode,          // slot above the nav, e.g. a primary action button
 *   items?: Array<{ key: string, label: React.ReactNode, icon?: React.ReactNode, active?: boolean, sub?: boolean, onClick: () => void, title?: string }>,
 *   sections?: Array<{ key: string, label: React.ReactNode, icon?: React.ReactNode, right?: React.ReactNode, onClick?: () => void, items: Array<object> }>,
 *   footer?: React.ReactNode,
 *   width?: string | number,
 *   style?: object,
 * }} props
 */
function Sidebar(props) {
    const items = props.items || [];
    const sections = props.sections || [];
    const hoverState = React.useState(null);
    const hoveredKey = hoverState[0];
    const setHoveredKey = hoverState[1];

    const renderItem = function (item) {
        return React.createElement(SidebarItem, {
            key: item.key,
            item: item,
            hovered: hoveredKey === item.key,
            onHover: function () { setHoveredKey(item.key); },
            onLeave: function () { setHoveredKey(null); },
        });
    };

    return React.createElement(
        'aside',
        { style: containerStyle(props.width, props.style) },
        props.appName || props.brandIcon
            ? React.createElement(
                'div',
                { style: brandStyle },
                props.brandIcon || null,
                props.appName
                    ? React.createElement(
                        'span',
                        { style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } },
                        props.appName,
                    )
                    : null,
            )
            : null,
        props.top ? React.createElement('div', { style: { padding: '8px 8px 4px', flexShrink: 0 } }, props.top) : null,
        React.createElement(
            'nav',
            { className: 'terras-scroll', style: navStyle },
            items.map(renderItem),
            sections.map(function (section) {
                const childActive = (section.items || []).some(function (i) { return i.active; });
                return React.createElement(
                    React.Fragment,
                    { key: section.key },
                    React.createElement(
                        'div',
                        {
                            style: sectionStyle(hoveredKey === section.key || childActive),
                            onClick: section.onClick,
                            onMouseEnter: function () { setHoveredKey(section.key); },
                            onMouseLeave: function () { setHoveredKey(null); },
                            role: section.onClick ? 'button' : undefined,
                        },
                        React.createElement(
                            'span',
                            { style: { display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 } },
                            section.icon || null,
                            section.label,
                        ),
                        section.right || null,
                    ),
                    (section.items || []).map(function (i) {
                        return renderItem(Object.assign({ sub: true }, i));
                    }),
                );
            }),
        ),
        props.footer ? React.createElement('div', { style: footerStyle }, props.footer) : null,
    );
}

module.exports = Sidebar;
module.exports.Sidebar = Sidebar;
