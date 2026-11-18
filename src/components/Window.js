'use strict';

// The classic outer window: bevelled frame + coloured title bar + optional
// toolbar strip + scrolling body + optional status bar. This is THE frame every
// top-level view sits in — a page whose content floats straight on the beige
// desktop background is the single biggest tell that a screen hasn't been
// themed. Mirrors terras-erp's shellTheme.tsx (`ShellWindow` / `xpTitleBar` /
// `xpToolbar` / `XPStatusBar`).
//
// Composed rather than configured: `<Window>` holds the frame, and the parts go
// inside it in whatever order a view needs.
//
//   <Window fill="page">
//     <Window.TitleBar title="Movements" right={<span>0 lines</span>} />
//     <Window.Toolbar>…filters…</Window.Toolbar>
//     <Window.Body>…table…</Window.Body>
//     <Pager page={page} total={total} pageSize={50} onPageChange={setPage} />
//   </Window>

const React = require('react');
const S = require('./styles');

// How the frame is sized. 'page' fills the routed content area (the default for
// a top-level view); 'flex' takes flex:1 under an already-sized parent; false
// lets the caller own sizing entirely.
function fillStyleFor(fill) {
    if (fill === 'flex') return { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' };
    if (fill === 'page') return { height: '100%', display: 'flex', flexDirection: 'column' };
    return { display: 'flex', flexDirection: 'column' };
}

/**
 * @param {{
 *   fill?: 'page' | 'flex' | false,
 *   style?: object,
 *   className?: string,
 *   children: React.ReactNode,
 * }} props
 */
function Window(props) {
    return React.createElement(
        'section',
        {
            className: props.className,
            style: S.bevel(Object.assign(fillStyleFor(props.fill === undefined ? 'page' : props.fill), props.style)),
        },
        props.children,
    );
}

/**
 * @param {{ title?: React.ReactNode, icon?: React.ReactNode, right?: React.ReactNode,
 *           tone?: 'blue'|'red'|'amber'|'green'|'grey', style?: object }} props
 */
function TitleBar(props) {
    return React.createElement(
        'div',
        { style: S.titleBar(props.style, props.tone) },
        React.createElement(
            'span',
            { style: { display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 } },
            props.icon || null,
            props.title,
        ),
        props.right
            ? React.createElement(
                'span',
                { style: { display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, fontWeight: 'normal' } },
                props.right,
            )
            : null,
    );
}

function Toolbar(props) {
    return React.createElement('div', { style: S.toolbar(props.style) }, props.children);
}

function Separator() {
    return React.createElement('div', { style: S.separator, 'aria-hidden': 'true' });
}

/**
 * Scrolling content area. Owns the overflow so the title bar, toolbar and status
 * bar stay pinned and only the content moves — which is also what makes the
 * table's sticky header (see chrome.css) stick to the top of the body rather
 * than scrolling off with it.
 */
function Body(props) {
    return React.createElement(
        'div',
        {
            className: 'terras-scroll' + (props.className ? ' ' + props.className : ''),
            style: Object.assign({
                flex: 1,
                minHeight: 0,
                overflow: 'auto',
                background: S.cssVar('win-face', '#f0f0e8'),
            }, props.style),
        },
        props.children,
    );
}

/**
 * Bottom strip — record counts on the left, pager or actions on the right.
 * Sunken (dark on top/left) so it reads as the floor of the window against the
 * raised toolbar at the top.
 */
function StatusBar(props) {
    return React.createElement(
        'div',
        {
            className: props.className,
            style: Object.assign({
                borderTop: '1px solid ' + S.cssVar('win-border-dark', '#808080'),
                background: S.cssVar('win-face-alt', '#ece9df'),
                padding: '3px 6px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                flexShrink: 0,
                fontFamily: S.font,
                fontSize: S.fs.base,
                color: S.cssVar('win-text-2', '#333333'),
            }, props.style),
        },
        props.children,
        props.right
            ? React.createElement(
                'span',
                { style: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 } },
                props.right,
            )
            : null,
    );
}

/**
 * The "412 orders" tally a list toolbar ends with (erp shellTheme.tsx
 * ToolbarCount). `right` pushes it to the far end of the toolbar row — the
 * common case, which sku was writing as an inline `marginLeft: 'auto'` span.
 */
function Count(props) {
    return React.createElement(
        'span',
        {
            style: Object.assign({
                flexShrink: 0,
                whiteSpace: 'nowrap',
                marginLeft: props.right ? 'auto' : undefined,
                fontFamily: S.fontData,
                fontSize: S.fs.base,
                color: S.cssVar('win-text-2', '#333333'),
            }, props.style),
        },
        props.children,
    );
}

Window.TitleBar = TitleBar;
Window.Count = Count;
Window.Toolbar = Toolbar;
Window.Separator = Separator;
Window.Body = Body;
Window.StatusBar = StatusBar;

module.exports = Window;
module.exports.Window = Window;
module.exports.TitleBar = TitleBar;
module.exports.Toolbar = Toolbar;
module.exports.Separator = Separator;
module.exports.Body = Body;
module.exports.StatusBar = StatusBar;
module.exports.Count = Count;
