'use strict';

// The compact FLAT button of a table's action column. Mirrors erp xpTheme.tsx
// XPActionButton. Deliberately not `Button`: a raised two-tone bevel reads as
// chunky and glossy at this size, so an action column gets one border over a
// soft gradient. A button inside a window's toolbar or footer is still `Button`.
//
// Icon-only buttons are the densest tooltip consumer there is — a whole column
// of them — so `title` becomes a styled `Tooltip`, placed BESIDE an icon-only
// button (below it is the next row's button, which the bubble would cover just
// as the user aims at it) and below a labelled one.

const React = require('react');
const S = require('./styles');
const Tooltip = require('./Tooltip');

const TONES = ['neutral', 'primary', 'success', 'warning', 'danger'];

/**
 * @param {{ tone?: 'neutral'|'primary'|'success'|'warning'|'danger', icon?: React.ReactNode,
 *   label?: React.ReactNode, title?: string, onClick: (e) => void, disabled?: boolean,
 *   className?: string, style?: object }} props
 */
function ActionButton(props) {
    const tone = TONES.indexOf(props.tone) >= 0 ? props.tone : 'neutral';
    const rest = Object.assign({}, props);
    ['tone', 'icon', 'label', 'title', 'className', 'style', 'children'].forEach(function (k) { delete rest[k]; });

    const btn = React.createElement(
        'button',
        Object.assign({ type: 'button' }, rest, {
            className: 'terras-btn' + (props.className ? ' ' + props.className : ''),
            // Named for a screen reader even when icon-only; the Tooltip only describes.
            'aria-label': props['aria-label'] || (props.label ? undefined : props.title),
            style: Object.assign({
                fontFamily: S.font,
                fontSize: S.fs.base,
                lineHeight: 1,
                padding: '2px 4px',
                cursor: props.disabled ? 'default' : 'pointer',
                background: S.cssVar('action-' + tone + '-bg'),
                border: '1px solid ' + S.cssVar('action-' + tone + '-border'),
                color: S.cssVar('action-' + tone + '-fg'),
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                borderRadius: S.cssVar('radius-btn', '3px'),
            }, props.style),
        }),
        props.icon,
        props.label,
    );
    if (!props.title) return btn;
    return React.createElement(Tooltip, { content: props.title, placement: props.label ? 'bottom' : 'side' }, btn);
}

module.exports = ActionButton;
module.exports.ActionButton = ActionButton;
