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
//
// `stickyCols` freezes the leading columns — Excel's freeze panes. See
// pinLeadingCells below for why the offsets are measured rather than declared.

const React = require('react');
const S = require('./styles');

const STICKY = 'terras-sticky-col';
const STICKY_LAST = 'terras-sticky-col-last';

/**
 * Pin the first `count` columns of every row at their measured x-offsets.
 *
 * `position: sticky` needs a `left` per column, and a column's left is the sum
 * of the widths before it — arithmetic CSS cannot do and a caller should not
 * have to. Declaring fixed widths for the frozen columns would let this be
 * pure CSS, but a catalogue's code and name columns are content-sized, so the
 * widths are only knowable after layout. Hence: measure, then write `left`
 * onto the cells.
 *
 * The cells belong to the caller's markup, so this touches the DOM directly
 * rather than cloning elements. Safe in practice because `left` and these two
 * classes are ours alone — React has no competing value for them and so never
 * clears them on re-render.
 *
 * A row whose cell spans ACROSS the freeze boundary is left alone: pinning a
 * cell wider than the frozen region would park it over the scrolling columns.
 * That is the grouped-header case (a `colSpan` band above several columns),
 * and skipping the row is the honest outcome — the band scrolls, the columns
 * beneath it do not.
 */
function pinLeadingCells(table, count) {
    const rows = table.querySelectorAll('tr');
    for (let r = 0; r < rows.length; r++) {
        const cells = rows[r].children;
        let left = 0;
        let column = 0;
        for (let c = 0; c < cells.length && column < count; c++) {
            const cell = cells[c];
            const span = cell.colSpan || 1;
            if (column + span > count) break;
            cell.classList.add(STICKY);
            if (column + span === count) cell.classList.add(STICKY_LAST);
            cell.style.left = left + 'px';
            // offsetWidth rounds to whole pixels; accumulating the rounded
            // values is what keeps a column's left flush with the previous
            // column's painted right edge instead of drifting a subpixel per
            // column into a hairline gap.
            left += cell.offsetWidth;
            column += span;
        }
    }
}

function unpinCells(table) {
    const pinned = table.querySelectorAll('.' + STICKY);
    for (let i = 0; i < pinned.length; i++) {
        pinned[i].classList.remove(STICKY, STICKY_LAST);
        pinned[i].style.left = '';
    }
}

/**
 * @param {{ minWidth?: number|string, stickyCols?: number, style?: object, className?: string, children: React.ReactNode }} props
 */
function Table(props) {
    const ref = React.useRef(null);
    const stickyCols = props.stickyCols || 0;

    // Layout effect, not effect: the offsets are read from laid-out cells and
    // written back as styles, so doing it before paint avoids a frame of
    // unpinned columns every time the rows change.
    React.useLayoutEffect(function () {
        const table = ref.current;
        if (!table) return undefined;
        unpinCells(table);
        if (stickyCols <= 0) return undefined;

        // Measured twice over: once now, and again whenever the table's own box
        // changes. A column's width moves with the window, with the longest
        // value on the current page, and with a font that has finished loading —
        // all of which resize the table and none of which re-render it.
        pinLeadingCells(table, stickyCols);
        if (typeof ResizeObserver === 'undefined') return undefined;
        const observer = new ResizeObserver(function () {
            unpinCells(table);
            pinLeadingCells(table, stickyCols);
        });
        observer.observe(table);
        return function () {
            observer.disconnect();
            unpinCells(table);
        };
    }, [stickyCols, props.children]);

    return React.createElement(
        'table',
        {
            ref: ref,
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
