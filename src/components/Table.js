'use client';
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
// pinLeadingCells below for why the offsets are measured rather than declared,
// and chrome.css for why the table's borders are separate rather than collapsed.

const React = require('react');
const S = require('./styles');
const scale = require('../scale');

const STICKY = 'terras-sticky-col';
const STICKY_LAST = 'terras-sticky-col-last';

/**
 * Pin the first `count` columns of every row at their measured x-offsets.
 *
 * `position: sticky` needs a `left` per column, and a column's left is where
 * that column already sits in the laid-out table — something CSS cannot state
 * and a caller should not have to. Declaring fixed widths for the frozen
 * columns would let this be pure CSS, but a catalogue's code and name columns
 * are content-sized, so the widths are only knowable after layout. Hence:
 * measure, then write `left` onto the cells.
 *
 * Each cell is measured against the table's own left edge rather than by
 * accumulating the widths before it. Reading the offset the browser already
 * computed cannot drift; a running total has to re-derive the geometry and gets
 * one rounding, one border or one collapsed edge away from the truth per
 * column, which shows up as a hairline gap between the frozen columns.
 *
 * Measurement needs the cells UNPINNED (`unpinCells` first, which every caller
 * here does): a cell already carrying a `left` is displaced by it, so its own
 * offset would be read back through the last pin instead of from the layout.
 * Hence also the two passes — every read finishes before the first write, so
 * no cell is measured after a sibling has moved.
 *
 * Which cell sits in which column is NOT its index among its row's children: a
 * `rowSpan` above reaches down and occupies a column in this row without
 * putting a cell in it, so the row's first child can be column 1. Counting
 * children instead of columns pinned one column too many under every spanning
 * cell — freezing a column that should scroll, and putting the freeze seam in a
 * different place on those rows than on the rest. So the scan carries the
 * occupancy of the rows above it, per row group, since a span cannot cross one.
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
    // Rects are SCREEN px, `style.left` is LAYOUT px — the same unit only at
    // zoom 1, so every pin would sit short by the interface scale. Measured raw
    // and divided once here rather than through scale.layoutRectOf() per cell:
    // that would re-probe the zoom inside the loop, and the ratio cannot change
    // mid-measure. See ../scale.js.
    const z = scale.uiZoom();
    const origin = table.getBoundingClientRect().left;
    const groups = table.querySelectorAll('thead, tbody, tfoot');
    const pins = [];
    for (let g = 0; g < groups.length; g++) {
        const rows = groups[g].querySelectorAll('tr');
        // occupied[c] — how many more rows, this one included, a `rowSpan` from
        // above still covers column c. Reset per group: a span cannot cross
        // from one row group into the next.
        const occupied = [];
        for (let r = 0; r < rows.length; r++) {
            const cells = rows[r].children;
            let column = 0;
            for (let c = 0; c < cells.length; c++) {
                while (occupied[column] > 0) column++;
                if (column >= count) break;
                const cell = cells[c];
                const span = cell.colSpan || 1;
                if (column + span > count) break;
                // Fractional, not rounded: the frozen block then reproduces the
                // table's own geometry exactly, seams included.
                pins.push({
                    cell: cell,
                    left: (cell.getBoundingClientRect().left - origin) / z,
                    last: column + span === count,
                });
                // `rowSpan` 0 means "to the end of the row group" — never ends.
                const down = cell.rowSpan === 0 ? Infinity : cell.rowSpan || 1;
                if (down > 1) {
                    for (let k = column; k < column + span; k++) occupied[k] = down;
                }
                column += span;
            }
            for (let k = 0; k < count; k++) {
                if (occupied[k] > 0) occupied[k]--;
            }
        }
    }
    for (let i = 0; i < pins.length; i++) {
        const pin = pins[i];
        pin.cell.classList.add(STICKY);
        if (pin.last) pin.cell.classList.add(STICKY_LAST);
        pin.cell.style.left = pin.left + 'px';
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
 * and colour each time. `icon` is an optional glyph slot above the message
 * (erp listViewTheme.tsx TableEmpty's `icon`), for a list whose empty state
 * carries one.
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
            props.icon !== undefined && props.icon !== null
                ? React.createElement('span', {
                    'aria-hidden': true,
                    style: { display: 'block', fontSize: 18, lineHeight: 1, opacity: 0.45, marginBottom: 6 },
                }, props.icon)
                : null,
            props.children,
        ),
    );
}

// ── Sorting ─────────────────────────────────────────────────────────────────
// Mirrors erp xpTheme.tsx (useSortable / useServerSort / nextSortState /
// SortMark) and listViewTheme.tsx (SortableTh). The sort STATE is the app's:
// these hooks are plain useState, and `nextSortState` is exported on its own
// for a view whose sort lives in a URL param or a data context instead.

const isNil = function (v) { return v === null || v === undefined || v === ''; };

function compareValues(a, b) {
    if (isNil(a) && isNil(b)) return 0;
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    const na = Number(a);
    const nb = Number(b);
    if (!isNaN(na) && !isNaN(nb) && String(a).trim() !== '' && String(b).trim() !== '') return na - nb;
    return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * The header-click transition: unsorted -> asc -> desc -> unsorted, and a click
 * on a different column starts that column at asc.
 */
function nextSortState(prev, key) {
    if (!prev || prev.key !== key) return { key: key, dir: 1 };
    return prev.dir === 1 ? { key: key, dir: -1 } : null;
}

/**
 * Sort state for a list the SERVER sorts. A windowed list must change a query
 * param rather than reorder its one page in memory — sorting a page client-side
 * puts the wrong rows on page 1 entirely.
 */
function useServerSort(initial) {
    const state = React.useState(initial === undefined ? null : initial);
    const setSort = state[1];
    const toggleSort = React.useCallback(function (key) {
        setSort(function (prev) { return nextSortState(prev, key); });
    }, []);
    return { sort: state[0], setSort: setSort, toggleSort: toggleSort };
}

/**
 * Sort rows client-side. `columns` maps key -> accessor. Empty values sort last
 * in both directions. Only correct when the view holds the WHOLE set — for a
 * windowed list use `useServerSort`.
 */
function useSortable(rows, columns, initialSort) {
    const state = React.useState(initialSort === undefined ? null : initialSort);
    const sort = state[0];
    const setSort = state[1];

    // `columns` is usually an inline object literal, so it is deliberately not
    // a dependency — it would re-sort on every render.
    const sorted = React.useMemo(function () {
        if (!sort || !columns[sort.key]) return rows;
        const acc = columns[sort.key];
        return rows.slice().sort(function (ra, rb) {
            const a = acc(ra);
            const b = acc(rb);
            if (isNil(a) !== isNil(b)) return isNil(a) ? 1 : -1;
            return compareValues(a, b) * sort.dir;
        });
    }, [rows, sort]);

    const toggle = function (key) { setSort(function (prev) { return nextSortState(prev, key); }); };
    return { sorted: sorted, sort: sort, toggle: toggle };
}

/** Arrow indicator for a sortable header; nothing when the column is unsorted. */
function SortMark(props) {
    const sort = props.sort;
    if (!sort || sort.key !== props.colKey) return null;
    return React.createElement('span', { 'aria-hidden': true, style: { marginLeft: 3, fontSize: 8 } }, sort.dir === 1 ? '▲' : '▼');
}

/**
 * Sortable `<th>`. Owns the affordances every hand-written copy drifted on:
 * the pointer, `userSelect: none` (a double-click would select the label
 * instead of sorting twice), the "Sort" title, `aria-sort`, and the arrow.
 *
 * A null/absent `colKey` (or no `onSort`) renders a plain inert header, so a
 * table built from a column config keeps one component call per column.
 */
function SortableTh(props) {
    const rest = Object.assign({}, props);
    delete rest.sort; delete rest.colKey; delete rest.onSort; delete rest.children; delete rest.style;

    if (!props.colKey || !props.onSort) {
        return React.createElement('th', Object.assign({ style: props.style }, rest), props.children);
    }
    const key = props.colKey;
    const sort = props.sort || null;
    const dir = sort && sort.key === key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none';
    return React.createElement(
        'th',
        Object.assign({}, rest, {
            title: props.title === undefined ? 'Sort' : props.title,
            'aria-sort': dir,
            style: Object.assign({}, props.style, { cursor: 'pointer', userSelect: 'none' }),
            onClick: function () { props.onSort(key); },
        }),
        props.children,
        React.createElement(SortMark, { sort: sort, colKey: key }),
    );
}

// ── Row multi-select ────────────────────────────────────────────────────────
// Mirrors erp listViewTheme.tsx (useRowSelection / RowCheckbox /
// SelectAllCheckbox / *Cell). The selection keeps the ROW OBJECT, not just its
// key: every bulk action downstream needs the row, and a selection that
// survives paging can no longer look it up in the visible page. Select-all is
// deliberately page-scoped — ticking 4000 filtered rows in one click is never
// what the user meant — while rows ticked on other pages stay ticked.

/** Width of the leading checkbox column. Checkbox first, then an expander. */
const CHECK_COL_W = 28;

function useRowSelection(rows, keyOf, opts) {
    const selectable = opts && opts.selectable;
    const state = React.useState({});
    const selected = state[0];
    const setSelected = state[1];
    const eligible = selectable ? rows.filter(selectable) : rows;

    const isSelectedKey = function (key) { return !!selected[key]; };
    const isSelected = function (row) { return isSelectedKey(keyOf(row)); };
    const setRow = function (row, on) {
        setSelected(function (prev) {
            const next = Object.assign({}, prev);
            const k = keyOf(row);
            if (on) next[k] = row; else delete next[k];
            return next;
        });
    };

    const allPageSelected = eligible.length > 0 && eligible.every(function (r) { return !!selected[keyOf(r)]; });
    const anyPageSelected = eligible.some(function (r) { return !!selected[keyOf(r)]; });
    const keys = Object.keys(selected);

    return {
        selected: selected,
        keys: keys,
        items: keys.map(function (k) { return selected[k]; }),
        entries: keys.map(function (k) { return [k, selected[k]]; }),
        count: keys.length,
        isSelected: isSelected,
        isSelectedKey: isSelectedKey,
        toggle: function (row) { setRow(row, !isSelected(row)); },
        toggleKey: function (key) {
            const row = rows.find(function (r) { return keyOf(r) === key; });
            if (row) setRow(row, !isSelectedKey(key));
        },
        deselectKey: function (key) {
            setSelected(function (prev) { const n = Object.assign({}, prev); delete n[key]; return n; });
        },
        togglePage: function () {
            setSelected(function (prev) {
                const next = Object.assign({}, prev);
                eligible.forEach(function (r) {
                    if (allPageSelected) delete next[keyOf(r)]; else next[keyOf(r)] = r;
                });
                return next;
            });
        },
        allPageSelected: allPageSelected,
        someSelected: anyPageSelected && !allPageSelected,
        pageEligibleCount: eligible.length,
        clear: function () { setSelected({}); },
    };
}

// Hover ring lives in chrome.css (`.terras-check`): an inline style can't say
// `:hover`, and the box is a bare native input with no wrapper to hang one on.
const checkStyle = function (enabled) {
    return { margin: 0, cursor: enabled ? 'pointer' : 'not-allowed', verticalAlign: 'middle' };
};

function RowCheckbox(props) {
    return React.createElement('input', {
        type: 'checkbox',
        className: 'terras-check',
        style: checkStyle(!props.disabled),
        checked: props.checked,
        disabled: props.disabled,
        title: props.title,
        'aria-label': props.label ? 'Select ' + props.label : 'Select row',
        onChange: props.onChange,
        // The row around it is usually clickable (expand / open): a tick must
        // never also fire that.
        onClick: function (e) { e.stopPropagation(); },
    });
}

/** Header checkbox. Owns the `indeterminate` ref-poke — a DOM property with no attribute form. */
function SelectAllCheckbox(props) {
    const label = props.allSelected ? 'Clear selection on this page' : 'Select every row on this page';
    const partial = !!props.someSelected && !props.allSelected;
    return React.createElement('input', {
        type: 'checkbox',
        className: 'terras-check',
        style: checkStyle(!props.disabled),
        checked: !!props.allSelected,
        disabled: props.disabled,
        ref: function (el) { if (el) el.indeterminate = partial; },
        onChange: props.onChange,
        title: props.title === undefined ? label : props.title,
        'aria-label': label,
    });
}

const controlCellStyle = function (width, extra) {
    return Object.assign({}, extra, { width: width, textAlign: 'center', padding: '3px 4px', verticalAlign: 'middle' });
};

/** `<td>` + row checkbox, column geometry fixed. */
function RowCheckboxCell(props) {
    const cb = Object.assign({}, props);
    delete cb.tdStyle; delete cb.tdClassName;
    return React.createElement('td', { style: controlCellStyle(CHECK_COL_W, props.tdStyle), className: props.tdClassName },
        React.createElement(RowCheckbox, cb));
}

/** `<th>` + select-all checkbox. */
function SelectAllCell(props) {
    const cb = Object.assign({}, props);
    delete cb.tdStyle; delete cb.tdClassName;
    return React.createElement('th', { style: controlCellStyle(CHECK_COL_W, props.tdStyle), className: props.tdClassName },
        React.createElement(SelectAllCheckbox, cb));
}

// ── Row disclosure ──────────────────────────────────────────────────────────
// Mirrors erp listViewTheme.tsx (ExpandToggle / ExpanderCell / rowStateBg) and
// xpTheme.tsx (ExpandedRowPanel / ExpandedRowPanelBody / expandedRowFrame).
//
// COLUMN ORDER IS FIXED: [checkbox] [chevron] [first data column]. The chevron
// gets its OWN column and never sits inside a data cell — erp's lists had
// picked four different arrangements of the same three things. Pair
// `ExpanderCell` with `rowStateBg('expanded')` on the row: two halves of one
// convention.
//
// Chevron-right, rotated 90° when open (chrome.css `.terras-chev`), so hover
// previews the open direction and springs back if nothing is clicked. Not a
// solid caret: that means tree hierarchy, a different affordance.

const EXPANDER_COL_W = 22;

const ROW_STATES = { expanded: 1, selected: 1, highlighted: 1 };

/** Ground for a row in one of three states — `expanded`, `selected` (ticked), `highlighted`. */
function rowStateBg(state) {
    return S.cssVar('row-state-' + (ROW_STATES[state] ? state : 'expanded'));
}

// The package ships no icon set; a 7x9 stroke chevron keeps the default
// glyph-free of any font. `icon` replaces it.
const chevron = React.createElement('svg', {
    width: 7, height: 9, viewBox: '0 0 7 9', 'aria-hidden': true, style: { display: 'block' },
}, React.createElement('path', {
    d: 'M1.5 1 L5.5 4.5 L1.5 8', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6,
    strokeLinecap: 'round', strokeLinejoin: 'round',
}));

function ExpandToggle(props) {
    const label = props.label || 'details';
    const verb = props.expanded ? 'Hide ' : 'Show ';
    const color = props.tone === 'alert' && props.expanded ? '#c00000' : S.cssVar('win-blue', '#0054e3');
    return React.createElement('button', {
        type: 'button',
        // The row is usually clickable too; without this the click toggles
        // twice and lands back where it started.
        onClick: function (e) { e.stopPropagation(); props.onToggle(); },
        'aria-expanded': !!props.expanded,
        'aria-controls': props.panelId,
        'aria-label': verb + label,
        title: verb + label,
        className: 'terras-chev-btn',
        style: Object.assign({
            background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1, color: color, flexShrink: 0,
        }, props.style),
    }, React.createElement('span', {
        className: 'terras-chev' + (props.expanded ? ' terras-chev-open' : ''),
        'aria-hidden': true,
    }, props.icon === undefined ? chevron : props.icon));
}

/** The dedicated chevron column: geometry + toggle in one. */
function ExpanderCell(props) {
    const toggle = Object.assign({}, props);
    delete toggle.tdStyle; delete toggle.tdClassName;
    return React.createElement('td', { style: controlCellStyle(EXPANDER_COL_W, props.tdStyle), className: props.tdClassName },
        React.createElement(ExpandToggle, toggle));
}

/**
 * The rail + edge rules of an expanded-row panel, as a paint-only frame: a
 * left rail in the selection blue pegs the panel to the row it dropped out of,
 * heavy top/bottom rules bracket it as a break in the list.
 *
 * Painted with inset box-shadow, NOT border, and that is load-bearing: the
 * panel lives in a `<td colSpan>` spanning every column, so any border it
 * declared would feed that cell's min-content width back into auto table
 * layout and the row above would jump sideways on expand. Shadows cost zero
 * width. Exported for a panel that can't be the component (it must be applied
 * to the `<td>` itself); `railColor` for a rail that carries meaning.
 */
const RAIL_W = 4;
const RULE_W = 2;
function expandedRowFrame(railColor) {
    const rule = S.cssVar('win-border-dark', '#808080');
    return {
        boxShadow: [
            'inset ' + RAIL_W + 'px 0 0 0 ' + (railColor || S.cssVar('win-highlight', '#316ac5')),
            'inset 0 ' + RULE_W + 'px 0 0 ' + rule,
            'inset 0 -' + RULE_W + 'px 0 0 ' + rule,
        ].join(', '),
    };
}

/**
 * Frame of an expanded row's detail panel. Put it in a `<td colSpan>` with
 * `terras-cell-flush`. Flat white like the rows, so wide content gets the full
 * width. Keep any padding override's left value >= 4px — the rail paints inside
 * the padding box.
 */
function ExpandedRowPanel(props) {
    return React.createElement('div', {
        id: props.id,
        style: Object.assign({}, expandedRowFrame(props.railColor), {
            background: S.cssVar('table-bg', '#ffffff'),
            padding: 5,
            whiteSpace: 'normal',
        }, props.style),
    }, props.children);
}

/** Padded, transparent content box inside an ExpandedRowPanel. */
function ExpandedRowPanelBody(props) {
    return React.createElement('div', { style: Object.assign({ padding: '4px 8px' }, props.style) }, props.children);
}

Table.EmptyRow = EmptyRow;
Table.ExpandToggle = ExpandToggle;
Table.ExpanderCell = ExpanderCell;
Table.ExpandedRowPanel = ExpandedRowPanel;
Table.ExpandedRowPanelBody = ExpandedRowPanelBody;
Table.RowCheckbox = RowCheckbox;
Table.SelectAllCheckbox = SelectAllCheckbox;
Table.RowCheckboxCell = RowCheckboxCell;
Table.SelectAllCell = SelectAllCell;
Table.SortableTh = SortableTh;
Table.SortMark = SortMark;

module.exports = Table;
module.exports.Table = Table;
module.exports.EmptyRow = EmptyRow;
module.exports.SortableTh = SortableTh;
module.exports.SortMark = SortMark;
module.exports.nextSortState = nextSortState;
module.exports.useSortable = useSortable;
module.exports.useServerSort = useServerSort;
module.exports.useRowSelection = useRowSelection;
module.exports.RowCheckbox = RowCheckbox;
module.exports.SelectAllCheckbox = SelectAllCheckbox;
module.exports.RowCheckboxCell = RowCheckboxCell;
module.exports.SelectAllCell = SelectAllCell;
module.exports.CHECK_COL_W = CHECK_COL_W;
module.exports.ExpandToggle = ExpandToggle;
module.exports.ExpanderCell = ExpanderCell;
module.exports.ExpandedRowPanel = ExpandedRowPanel;
module.exports.ExpandedRowPanelBody = ExpandedRowPanelBody;
module.exports.expandedRowFrame = expandedRowFrame;
module.exports.rowStateBg = rowStateBg;
module.exports.EXPANDER_COL_W = EXPANDER_COL_W;
