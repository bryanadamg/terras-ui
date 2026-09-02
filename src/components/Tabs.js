'use strict';

// Classic tab strip. Mirrors teras-erp's components/shared/Tabs.tsx.
//
// Renders ONLY the row of tab buttons — the pane below it stays with the caller,
// because different views wrap their tabs differently (some sit directly under a
// window title bar, some under a toolbar). It is normally the first child after
// `<Window.TitleBar>`, with `<Window.Toolbar>` and `<Window.Body>` below.
//
// Two details carry the whole look and are easy to "clean up" by mistake:
//
//  1. The active tab's bottom edge is OPEN into the pane below it — its bottom
//     border is painted in the pane colour and it sits 1px lower (`marginBottom:
//     -1`) so it covers the strip's rule. That seam is what makes a tab read as
//     the front of the pane rather than a selected button. Only the TOP corners
//     are rounded, for the same reason.
//  2. The three faces are all the pane's tan, not three hues: strip (darkest) <
//     inactive tab < active tab (`--terras-win-bg`, the pane itself). See the
//     tab tokens in tokens.css for why this isn't the sidebar's blue.
//
// Hover/press motion comes from `.terras-tab` in chrome.css — a tab wipes an
// underline in rather than lifting like `.terras-btn`, since a tab seated in its
// strip has nowhere to lift to.

const React = require('react');
const S = require('./styles');

const stripStyle = (style) => Object.assign({
    background: S.cssVar('tab-strip-bg', 'linear-gradient(to bottom, #dcd9cd, #cdcabe)'),
    borderBottom: '1px solid ' + S.cssVar('tab-edge', '#a8a290'),
    display: 'flex',
    // flex-end, so a taller active tab grows upward out of the strip.
    alignItems: 'flex-end',
    // No bottom padding: the tabs sit ON the strip's rule.
    padding: '4px 8px 0',
    gap: 2,
    flexShrink: 0,
    fontFamily: S.font,
    overflowX: 'auto',
}, style);

function tabStyle(active) {
    const edge = S.cssVar('tab-edge', '#a8a290');
    const pane = S.cssVar('win-bg', '#ece9d8');
    const radius = S.cssVar('radius-btn', '3px');
    return {
        fontFamily: S.font,
        fontSize: S.fs.base,
        padding: '3px 12px 4px',
        cursor: 'pointer',
        border: '1px solid',
        // Top corners only — rounding the bottom would cut the open seam.
        borderRadius: radius + ' ' + radius + ' 0 0',
        background: active ? pane : S.cssVar('tab-face', 'linear-gradient(to bottom, #e8e6db, #d0cec4)'),
        borderColor: active
            ? edge + ' ' + edge + ' ' + pane + ' ' + edge
            : S.cssVar('tab-border-light', '#c0bdb5') + ' ' + edge + ' ' + edge + ' ' + S.cssVar('tab-border-light', '#c0bdb5'),
        color: active ? S.cssVar('win-text', '#000000') : S.cssVar('tab-text', '#444444'),
        fontWeight: active ? 'bold' : 'normal',
        // Pull the active tab down over the strip's bottom rule.
        marginBottom: active ? -1 : 0,
        position: 'relative',
        zIndex: active ? 1 : 0,
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        userSelect: 'none',
    };
}

/**
 * @param {{
 *   tabs: Array<{ key: string, label: React.ReactNode, icon?: React.ReactNode, title?: string, disabled?: boolean }>,
 *   activeKey: string,
 *   onChange: (key: string) => void,
 *   right?: React.ReactNode,   // trailing control pushed to the far end of the strip
 *   ariaLabel?: string,
 *   style?: object,
 * }} props
 *
 * `label` is a node, not a string, so a tab can carry a small state marker
 * beside its text. Text is still the norm — not an invitation to build a second
 * control inside a tab.
 */
function Tabs(props) {
    const tabs = props.tabs || [];

    return React.createElement(
        'div',
        { style: stripStyle(props.style), role: 'tablist', 'aria-label': props.ariaLabel },
        tabs.map(function (tab) {
            const active = props.activeKey === tab.key;
            return React.createElement(
                'button',
                {
                    key: tab.key,
                    type: 'button',
                    role: 'tab',
                    'aria-selected': active,
                    title: tab.title,
                    disabled: tab.disabled,
                    className: 'terras-tab' + (active ? ' terras-tab-active' : ''),
                    onClick: function () { if (!tab.disabled) props.onChange(tab.key); },
                    style: tabStyle(active),
                },
                tab.icon || null,
                tab.label,
            );
        }),
        props.right
            ? React.createElement(
                'span',
                { style: { marginLeft: 'auto', alignSelf: 'center', paddingBottom: 3 } },
                props.right,
            )
            : null,
    );
}

module.exports = Tabs;
module.exports.Tabs = Tabs;
