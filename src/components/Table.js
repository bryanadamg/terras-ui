'use strict';

// Ruled classic table. Thin wrapper over a plain <table> that tags it
// `.terras-table`, so the th/td/hover rules in chrome.css apply — a table's
// cell chrome needs descendant selectors, which inline style objects can't
// express, and threading a style prop through every <td> in a consuming app is
// exactly the drift this package exists to stop.
//
// The markup stays the caller's: <Table><thead>…</thead><tbody>…</tbody></Table>.
// Classic tables are RULED (1px grid on every cell), not zebra-striped, and the
// header is its own raised bevel that sticks to the top of the scrolling
// `<Window.Body>` it lives in.
//
// Per-cell opt-outs live in chrome.css: `terras-cell-wrap` (let text wrap) and
// `terras-cell-flush` (drop the 4px/8px padding, e.g. for an embedded chip row).

const React = require('react');
const S = require('./styles');

/**
 * @param {{ minWidth?: number|string, style?: object, className?: string, children: React.ReactNode }} props
 */
function Table(props) {
    return React.createElement(
        'table',
        {
            className: 'terras-table' + (props.className ? ' ' + props.className : ''),
            style: Object.assign(props.minWidth ? { minWidth: props.minWidth } : {}, props.style),
        },
        props.children,
    );
}

/**
 * Full-width message row for the empty / loading state of a table body. Kept
 * here so "no rows" doesn't get re-invented per page with a different height
 * and colour each time.
 */
function EmptyRow(props) {
    return React.createElement(
        'tr',
        null,
        React.createElement(
            'td',
            {
                colSpan: props.colSpan,
                className: 'terras-cell-wrap',
                style: {
                    padding: '28px 8px',
                    textAlign: 'center',
                    color: S.cssVar('win-text-3', '#666666'),
                    fontFamily: S.font,
                },
            },
            props.children,
        ),
    );
}

Table.EmptyRow = EmptyRow;

module.exports = Table;
module.exports.Table = Table;
module.exports.EmptyRow = EmptyRow;
