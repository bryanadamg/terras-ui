'use strict';

// "Nothing here" for a pane that isn't a table body — a recessed white well
// with a muted glyph over an italic line. Mirrors erp xpTheme.tsx XPEmptyState.
// Inside a <tbody>, use `Table.EmptyRow` instead: it keeps the table's columns.
//
// The glyph is a slot: erp draws `bi-inbox` from bootstrap-icons, sku and crm
// draw lucide, and this package ships no icon set. Omit it and the well carries
// the message alone.

const React = require('react');
const S = require('./styles');

/**
 * @param {{ message: React.ReactNode, icon?: React.ReactNode, style?: object, children?: React.ReactNode }} props
 * `children` renders under the message — an action ("Create the first order").
 */
function EmptyState(props) {
    const hasIcon = props.icon !== undefined && props.icon !== null;
    return React.createElement(
        'div',
        {
            style: Object.assign({
                background: S.cssVar('table-bg', '#ffffff'),
                // Recessed: dark top/left, light bottom/right — `raised` swapped.
            }, S.raised(S.cssVar('win-border-dark', '#808080'), S.cssVar('win-border-light', '#ffffff')), {
                padding: '28px 16px',
                textAlign: 'center',
                fontFamily: S.font,
                color: S.cssVar('win-text-3', '#666666'),
            }, props.style),
        },
        hasIcon
            ? React.createElement('span', {
                'aria-hidden': true,
                style: { fontSize: 22, lineHeight: 1, color: '#a0a0a0', display: 'block', marginBottom: 6 },
            }, props.icon)
            : null,
        React.createElement('div', { style: { fontSize: S.fs.base, fontStyle: 'italic' } }, props.message),
        props.children,
    );
}

module.exports = EmptyState;
module.exports.EmptyState = EmptyState;
