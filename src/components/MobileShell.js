'use strict';

// The phone shell: the app's header on top, the routed page in the middle, and
// a tab bar at the bottom in the SIDEBAR palette — the tab bar is the phone's
// sidebar, so it wears the rail's blues rather than a grey taskbar. erp
// (components/mobile/MobileShell.tsx) and sku (layout/MobileShell.tsx, "after
// erp's") each hand-kept a copy; this is the one they share.
//
// Header, icons and navigation are slots and callbacks: erp routes with Next
// and bootstrap-icons, sku with react-router and lucide. Menu-open is
// controlled, not owned, because sku retitles its header while the sheet is up.

const React = require('react');
const S = require('./styles');

const h = React.createElement;

const BG = S.cssVar('sidebar-bg', '#f6f8fc');
const NAV = S.cssVar('sidebar-active-color', '#10276b');
const RULE = S.cssVar('sidebar-item-border', '#e3e8f1');
const ACTIVE = S.cssVar('sidebar-section-bg', '#1f4fd1');

const iconSlot = (icon) => (icon ? h('span', { style: { lineHeight: 0, display: 'inline-flex' } }, icon) : null);

function Tab(props) {
    const t = props.tab;
    return h('button', {
        type: 'button',
        onClick: t.onClick,
        'aria-current': t.active ? 'page' : undefined,
        style: {
            flex: 1,
            minWidth: 0,
            minHeight: 54,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
            padding: '6px 2px 8px',
            border: 'none',
            borderRight: props.last ? 'none' : '1px solid ' + RULE,
            background: t.active ? ACTIVE : 'transparent',
            color: t.active ? S.cssVar('on-solid', '#ffffff') : NAV,
            boxShadow: t.active ? 'inset 0 1px 0 rgba(255,255,255,0.3)' : 'none',
            fontFamily: 'inherit',
            fontSize: S.fs.sub,
            fontWeight: t.active ? 'bold' : 'normal',
            cursor: 'pointer',
        },
    }, iconSlot(t.icon), t.label);
}

function MenuRow(props) {
    const it = props.item;
    return h('button', {
        type: 'button',
        onClick: props.onClick,
        'aria-current': it.active ? 'page' : undefined,
        style: {
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            minHeight: 44,
            padding: '0 14px',
            border: 'none',
            borderBottom: '1px solid ' + RULE,
            background: it.active ? S.cssVar('sidebar-active-bg', '#ffffff') : 'transparent',
            color: NAV,
            fontFamily: 'inherit',
            fontSize: S.fs.title,
            fontWeight: it.active ? 'bold' : 'normal',
            textAlign: 'left',
            cursor: 'pointer',
        },
    }, iconSlot(it.icon), it.label);
}

function MobileShell(props) {
    const rest = Object.assign({}, props);
    ['header', 'children', 'tabs', 'menu', 'menuOpen', 'onMenuOpenChange', 'menuLabel', 'menuIcon', 'bodyStyle', 'style']
        .forEach((k) => { delete rest[k]; });

    const tabs = props.tabs || [];
    const menu = props.menu;
    const open = !!(menu && props.menuOpen);
    const setOpen = (v) => { if (props.onMenuOpenChange) props.onMenuOpenChange(v); };
    const close = () => { if (open) setOpen(false); };

    let all = tabs.map((t) => Object.assign({}, t, {
        active: !open && !!t.active,
        onClick: () => { close(); t.onClick(); },
    }));
    if (menu) {
        all = all.concat({
            key: '__menu',
            label: props.menuLabel || 'Menu',
            icon: props.menuIcon,
            // Lit for any page the tabs don't name, so the bar always says where you are.
            active: open || !tabs.some((t) => t.active),
            onClick: () => setOpen(!open),
        });
    }

    const sheet = open && h('nav', {
        'aria-label': 'Menu',
        // Above the page's sticky table headers, which stack their own.
        style: { position: 'absolute', inset: 0, overflowY: 'auto', background: BG, zIndex: 50 },
    }, menu.map((section) => h('div', { key: section.key },
        h('div', { style: S.titleBar({ padding: '6px 10px', fontSize: S.fs.base }) },
            h('span', { style: { textTransform: 'uppercase', letterSpacing: S.trackingCaps } }, section.label)),
        section.items.map((it) => h(MenuRow, {
            key: it.key,
            item: it,
            onClick: () => { setOpen(false); it.onClick(); },
        })))));

    return h('div', Object.assign(rest, {
        style: Object.assign({
            display: 'flex',
            flexDirection: 'column',
            // The DYNAMIC viewport, so the tab bar clears a phone's browser
            // toolbar. `--terras-app-vh` would be wrong here: scale.css points
            // it at the large-viewport `--app-vh`. `--app-dvh` is scale.css's
            // own zoom-corrected var; an app without scale.css gets 100dvh.
            height: 'var(--app-dvh, 100dvh)',
            overflow: 'hidden',
            fontFamily: S.font,
        }, props.style),
    }),
    props.header || null,
    // The sheet covers the page without unmounting it — a half-typed pick
    // survives a look at the menu. It is the scroller's SIBLING in a
    // non-scrolling frame: inside the scroller it would scroll away with the
    // page and open above the visible area on a scrolled-down page.
    h('div', { style: { position: 'relative', flex: 1, minHeight: 0 } },
        h('div', {
            style: Object.assign({ height: '100%', overflowY: 'auto', overflowX: 'hidden', boxSizing: 'border-box' }, props.bodyStyle),
        }, props.children),
        sheet || null),
    h('nav', {
        'aria-label': 'Primary',
        style: { display: 'flex', flexShrink: 0, background: BG, borderTop: '2px solid ' + NAV },
    }, all.map((t, i) => h(Tab, { key: t.key, tab: t, last: i === all.length - 1 }))));
}

// Phone width: the same 767px line scale.css drops the root zoom at, so
// "mobile" means one thing to the stylesheet and the shell. False on the
// server (erp renders through Next), the real answer on a client's first render.
const QUERY = '(max-width: 767px)';
const hasMM = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function';
function subscribe(onChange) {
    if (!hasMM()) return () => {};
    const mq = window.matchMedia(QUERY);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
}
const snapshot = () => hasMM() && window.matchMedia(QUERY).matches;
const serverSnapshot = () => false;

function useIsMobile() {
    return React.useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

module.exports = MobileShell;
module.exports.MobileShell = MobileShell;
module.exports.useIsMobile = useIsMobile;
