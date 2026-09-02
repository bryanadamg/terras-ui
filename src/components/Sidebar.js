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

const containerStyle = (width, style) => Object.assign({
    width: width || 'var(--terras-sidebar-width, 200px)',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--terras-sidebar-bg, var(--terras-win-bg, #f3f4f6))',
    borderRight: '1px solid var(--terras-sidebar-border, var(--terras-win-border-dark, #e5e7eb))',
    height: '100%',
    fontFamily: 'var(--terras-font-classic, var(--terras-font-modern))',
    fontSize: 11,
}, style);

const headerStyle = {
    padding: '10px 12px',
    fontWeight: 'bold',
    fontSize: 13,
    color: 'var(--terras-sidebar-active-color, #003080)',
    borderBottom: '1px solid var(--terras-sidebar-border, #718bb7)',
};

const navStyle = { flex: 1, overflowY: 'auto', minHeight: 0 };

const footerStyle = {
    borderTop: '1px solid var(--terras-sidebar-border, #718bb7)',
    padding: 10,
};

function itemStyle(active, hovered) {
    const background = hovered
        ? 'var(--terras-sidebar-hover-bg, #0058e6)'
        : active
            ? 'var(--terras-sidebar-active-bg, #ffffff)'
            : 'transparent';
    return {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 10px 5px 14px',
        cursor: 'pointer',
        userSelect: 'none',
        borderLeft: active && !hovered ? '3px solid var(--terras-sidebar-hover-bg, #0058e6)' : '3px solid transparent',
        borderBottom: '1px solid var(--terras-sidebar-item-border, #c0ccee)',
        background: background,
        color: hovered ? 'var(--terras-sidebar-hover-color, #ffffff)' : 'var(--terras-sidebar-active-color, #003080)',
        fontWeight: active ? 'bold' : 'normal',
        transition: 'background 0.08s',
    };
}

/**
 * One nav item. `item`: { key, label, icon?, active, onClick, onHover?, title? }.
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
            style: itemStyle(!!item.active, props.hovered),
            title: item.title,
            role: 'button',
            'aria-current': item.active ? 'page' : undefined,
        },
        item.icon || null,
        React.createElement('span', null, item.label),
    );
}

/**
 * Sidebar shell: header (appName) + scrollable item list + optional footer.
 * Only renders the classic-theme palette (see tokens.css `--terras-sidebar-*`) —
 * this is the primary Terras brand; a modern-theme variant is not built yet.
 *
 * @param {{
 *   appName?: React.ReactNode,
 *   items: Array<{ key: string, label: React.ReactNode, icon?: React.ReactNode, active?: boolean, onClick: () => void, title?: string }>,
 *   footer?: React.ReactNode,
 *   width?: string | number,
 *   style?: object,
 * }} props
 */
function Sidebar(props) {
    const items = props.items || [];
    const hoverState = React.useState(null);
    const hoveredKey = hoverState[0];
    const setHoveredKey = hoverState[1];

    return React.createElement(
        'aside',
        { style: containerStyle(props.width, props.style) },
        props.appName ? React.createElement('div', { style: headerStyle }, props.appName) : null,
        React.createElement(
            'nav',
            { style: navStyle },
            items.map(function (item) {
                return React.createElement(SidebarItem, {
                    key: item.key,
                    item: item,
                    hovered: hoveredKey === item.key,
                    onHover: function () { setHoveredKey(item.key); },
                    onLeave: function () { setHoveredKey(null); },
                });
            }),
        ),
        props.footer ? React.createElement('div', { style: footerStyle }, props.footer) : null,
    );
}

module.exports = Sidebar;
module.exports.Sidebar = Sidebar;
