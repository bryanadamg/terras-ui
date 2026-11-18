'use client';
'use strict';

// Row-actions "more" menu (⋯). Mirrors erp xpTheme.tsx useFloatingMenu /
// FloatingMenu / MenuTriggerButton: one menu open at a time, keyed by row id —
// the shape of a table where only one row's menu should ever be up.
//
// Two deliberate departures from erp:
//
// - Positioning goes through `FloatingLayer` (a body portal, right-aligned under
//   the trigger, clamped and flipped into the viewport) instead of a hand-placed
//   `position: fixed` box at `zIndex: 9999`. That layer already solves the
//   interface-scale conversion and escaping a clipping table body.
// - Outside-click is decided by the trigger ELEMENT and the menu's own node, not
//   by a `.xp-menu-trigger` class the caller has to remember to add. Any button
//   can open a menu.
//
// Item icons and the trigger glyph are slots — this package ships no icon set.

const React = require('react');
const S = require('./styles');
const Tooltip = require('./Tooltip');
const scale = require('../scale');
const tokens = require('../tokens/tokens.json');

const h = React.createElement;
const MENU_ATTR = 'data-terras-menu';

/**
 * Open state for a column of row menus. `toggle(id, e)` from the trigger's
 * onClick; render `<FloatingMenu menu={menu} …/>` while `menu.openId` is set.
 * Outside click, scroll (captured — the table body is what scrolls), resize and
 * Escape all close it: a fixed layer doesn't follow its anchor.
 */
function useFloatingMenu() {
    const state = React.useState(null);
    const open = state[0];
    const setOpen = state[1];
    const close = React.useCallback(function () { setOpen(null); }, []);

    React.useEffect(function () {
        if (!open) return undefined;
        const onClick = function (e) {
            const t = e.target;
            if (open.el.contains(t)) return;
            if (t && t.closest && t.closest('[' + MENU_ATTR + ']')) return;
            close();
        };
        const onKey = function (e) { if (e.key === 'Escape') close(); };
        document.addEventListener('click', onClick);
        window.addEventListener('scroll', close, true);
        window.addEventListener('resize', close);
        window.addEventListener('keydown', onKey);
        return function () {
            document.removeEventListener('click', onClick);
            window.removeEventListener('scroll', close, true);
            window.removeEventListener('resize', close);
            window.removeEventListener('keydown', onKey);
        };
    }, [open, close]);

    const toggle = function (id, e) {
        // The row around the trigger is usually clickable too.
        e.stopPropagation();
        const el = e.currentTarget;
        setOpen(function (prev) { return prev && prev.id === id ? null : { id: id, el: el }; });
    };

    return {
        openId: open ? open.id : null,
        anchorEl: open ? open.el : null,
        isOpen: function (id) { return !!open && open.id === id; },
        toggle: toggle,
        close: close,
    };
}

/**
 * The dropdown. Pass the hook's return as `menu`; it renders nothing while the
 * menu is closed or every item is hidden. An item click runs the item, then
 * closes the menu.
 */
function FloatingMenu(props) {
    const menu = props.menu;
    const anchor = menu && menu.anchorEl;
    const visible = (props.items || []).filter(function (i) { return !i.hidden; });
    const rect = React.useMemo(function () {
        return anchor ? scale.layoutRectOf(anchor) : null;
    }, [anchor]);
    if (!anchor || !rect || !visible.length) return null;

    return h(Tooltip.FloatingLayer, {
        rect: rect,
        anchorEl: anchor,
        placement: 'bottom',
        align: 'end',
        offset: 2,
        interactive: true,
        // Menus sit on the overlay layer: above modals (a row menu inside a
        // dialog must clear it), below tooltips.
        zIndex: tokens.zIndex.overlay,
    }, h('div', {
        role: 'menu',
        [MENU_ATTR]: '',
        style: {
            minWidth: props.minWidth === undefined ? 175 : props.minWidth,
            background: S.cssVar('menu-bg', '#ffffff'),
            border: '1px solid ' + S.cssVar('win-border-dark', '#808080'),
            boxShadow: '2px 2px 4px rgba(0,0,0,.25)',
        },
    }, visible.map(function (item) {
        return h('button', {
            type: 'button',
            key: item.key,
            role: 'menuitem',
            title: item.title,
            disabled: item.disabled,
            className: 'terras-menu-item' + (item.danger ? ' terras-menu-item-danger' : ''),
            onClick: function () {
                item.onClick();
                menu.close();
            },
            style: {
                display: 'flex', alignItems: 'center', gap: 7, width: '100%', textAlign: 'left',
                border: 'none', padding: '6px 10px', fontSize: S.fs.base, fontFamily: S.font,
                cursor: item.disabled ? 'default' : 'pointer',
                color: item.danger ? S.cssVar('menu-danger-text', '#aa0000') : S.cssVar('menu-text', '#222222'),
            },
        }, item.icon || null, item.label);
    })));
}

/**
 * The "⋯" trigger — a borderless 20px icon button that frames itself on hover
 * (chrome.css `.terras-menu-trigger`). `icon` replaces the glyph.
 */
function MenuTriggerButton(props) {
    const title = props.title === undefined ? 'More actions' : props.title;
    return h(Tooltip, { content: title, placement: 'side' }, h('button', {
        type: 'button',
        className: 'terras-btn terras-menu-trigger',
        onClick: props.onClick,
        'aria-label': title,
        'aria-haspopup': 'menu',
        'aria-expanded': props.expanded === undefined ? undefined : !!props.expanded,
        style: {
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 20, height: 20, padding: 0, cursor: 'pointer',
            color: S.cssVar('menu-trigger-text', '#555555'), fontSize: S.fs.title, fontFamily: S.font, lineHeight: 1,
        },
    }, props.icon === undefined ? '⋯' : props.icon));
}

module.exports = {
    useFloatingMenu: useFloatingMenu,
    FloatingMenu: FloatingMenu,
    MenuTriggerButton: MenuTriggerButton,
};
