'use client';
'use strict';

// Loading placeholders. Mirrors erp xpTheme.tsx (SkeletonBar / TableSkeleton /
// useTableSkeletonMetrics / ListSkeleton / PanelSkeleton / CardGridSkeleton /
// TableBlockSkeleton / XPLoading).
//
// A shimmering stand-in that carries the SHAPE of what is coming beats a line
// of "Loading..." text: the rows land where the real rows will, so nothing
// jumps when the data arrives. Pair with `Table.EmptyRow` — skeleton while the
// first fetch is in flight, the empty row once it has resolved empty, so "no
// data yet" never flashes as "there is no data".
//
// `Loading` (the sliding-blocks marquee) survives only where there is genuinely
// no shape to promise — a wait whose next screen depends on what comes back.
//
// Shimmer, fade-in delay and the marquee keyframes live in chrome.css
// (`.terras-skel`, `.terras-loading-*`): keyframes can't be inline.

const React = require('react');
const S = require('./styles');
const scale = require('../scale');

const h = React.createElement;
const times = function (n, fn) {
    const out = [];
    for (let i = 0; i < n; i++) out.push(fn(i));
    return out;
};

/** One shimmering placeholder bar. */
function SkeletonBar(props) {
    return h('span', {
        className: 'terras-skel',
        'aria-hidden': true,
        style: {
            display: 'block',
            width: props.width === undefined ? '100%' : props.width,
            height: props.height === undefined ? 9 : props.height,
            borderRadius: 2,
        },
    });
}

// Deterministic width cycle, not Math.random(), so the skeleton doesn't
// reshuffle on every re-render while the fetch is in flight.
const SKEL_WIDTHS = ['72%', '46%', '61%', '38%', '83%', '54%', '67%', '43%'];
const skelWidth = function (row, col) { return SKEL_WIDTHS[(row * 3 + col * 5) % SKEL_WIDTHS.length]; };

/**
 * Row count for a page-height list before `fillHeight` is known (the
 * server-rendered frame, before any effect has run). Deliberately more than a
 * tall panel holds: a scrollbar on a loading list reads as "plenty coming",
 * where a skeleton that stops half way reads as "this table ends here".
 */
const SKEL_PAGE_ROWS = 30;

// Classic table cells: 4px padding over a 12px font (chrome.css `.terras-table td`).
const DEFAULT_ROW_H = 26;
const DEFAULT_CELL_FONT = 12;

/**
 * Placeholder rows for a table body. Emits real <tr>/<td>, so the bars land in
 * the table's own columns and the cells pick up `.terras-table`'s ruling —
 * drop it straight into <tbody> in place of the rows.
 *
 * `cols` and `rowHeight` should come from `useTableSkeletonMetrics`, which reads
 * them off the real table. A hand-counted `cols` goes stale the moment anyone
 * adds a column, and a skeleton one short leaves a blank strip at the end.
 */
function TableSkeleton(props) {
    const tdStyle = props.tdStyle || {};
    const rowH = props.rowHeight || (typeof tdStyle.height === 'number' ? tdStyle.height : DEFAULT_ROW_H);
    // Bar tracks the row's text size, so a dense table doesn't get oversized bars.
    const fontPx = parseFloat(String(tdStyle.fontSize === undefined ? DEFAULT_CELL_FONT : tdStyle.fontSize)) || DEFAULT_CELL_FONT;
    const barHeight = Math.max(8, Math.round(fontPx * 0.8));
    // Fill the visible body rather than stopping mid-panel; capped so a very
    // tall viewport can't spawn hundreds of rows.
    const rowCount = props.fillHeight && rowH > 0
        ? Math.min(40, Math.max(3, Math.ceil(props.fillHeight / rowH)))
        : (props.rows === undefined ? 6 : props.rows);

    return h(React.Fragment, null, times(rowCount, function (r) {
        return h('tr', { key: 'skel-' + r, 'aria-hidden': true }, times(props.cols, function (c) {
            return h('td', {
                key: c,
                style: Object.assign({}, tdStyle, { height: rowH, boxSizing: 'border-box', verticalAlign: 'middle' }),
            }, h(SkeletonBar, { width: skelWidth(r, c), height: barHeight }));
        }));
    }));
}

// Measured row heights, keyed by table. Module-level so a remount (tab switch,
// repeat navigation) reuses the value.
// ponytail: memory only — erp also persists this to sessionStorage so a reload
// is pixel-exact, but storage keys stay with the app (see CLAUDE.md). A reload's
// first paint uses the 26px estimate instead.
const rowHeightCache = new Map();

/** Nearest scrollable ancestor — the box the skeleton has to fill. */
function scrollParentOf(el) {
    let node = el.parentElement;
    while (node) {
        const overflowY = window.getComputedStyle(node).overflowY;
        if (overflowY === 'auto' || overflowY === 'scroll') return node;
        node = node.parentElement;
    }
    return null;
}

/**
 * Reads a table's real geometry so its skeleton matches it:
 *
 * - `cols` from the live <thead> (summing colSpan), correct on the first paint;
 * - `rowHeight` from a real row once one exists, cached per `key`;
 * - `fillHeight`, the free height under the header inside the scroll
 *   container, re-measured on resize.
 *
 * Heights are layout px (divided through the interface scale), so a cached
 * value stays valid across scale changes.
 *
 * `key` must be stable per table and distinct between tables whose rows are
 * shaped differently.
 */
function useTableSkeletonMetrics(key, bodyRef, hasRows) {
    // All three start undefined on server and client alike — reading the cache
    // during render would make the first client paint disagree with SSR.
    const hState = React.useState(undefined);
    const cState = React.useState(undefined);
    const fState = React.useState(undefined);
    const setHeight = hState[1];
    const setCols = cState[1];
    const setFill = fState[1];

    React.useEffect(function () {
        const cached = rowHeightCache.get(key);
        if (cached) setHeight(function (prev) { return prev === undefined ? cached : prev; });
    }, [key]);

    React.useEffect(function () {
        const body = bodyRef.current;
        if (!body) return undefined;
        const table = body.closest('table');

        const headRow = table ? table.querySelector('thead tr:last-of-type') : null;
        if (headRow) {
            let n = 0;
            for (let i = 0; i < headRow.children.length; i++) n += headRow.children[i].colSpan || 1;
            if (n > 0) setCols(function (prev) { return prev === n ? prev : n; });
        }

        const scroller = scrollParentOf(body);
        let observer;
        if (scroller) {
            const measureFill = function () {
                // clientHeight is layout px, a rect is screen px — convert the rect.
                const head = table ? table.querySelector('thead') : null;
                const headH = head ? scale.layoutRectOf(head).height : 0;
                const free = Math.round(scroller.clientHeight - headH);
                setFill(function (prev) { return prev === free ? prev : (free > 0 ? free : undefined); });
            };
            measureFill();
            if (typeof ResizeObserver !== 'undefined') {
                observer = new ResizeObserver(measureFill);
                observer.observe(scroller);
            }
        }

        const row = hasRows ? body.querySelector('tr') : null;
        if (row) {
            const measured = Math.round(scale.layoutRectOf(row).height);
            // 0 while the tab/table is display:none — don't cache that.
            if (measured > 0 && rowHeightCache.get(key) !== measured) {
                rowHeightCache.set(key, measured);
                setHeight(measured);
            }
        }

        return function () { if (observer) observer.disconnect(); };
    }, [hasRows, key, bodyRef]);

    return { rowHeight: hState[0], cols: cState[0], fillHeight: fState[0] };
}

/** Placeholder rows for a non-table list pane (a rail of cards or links). */
function ListSkeleton(props) {
    const padding = props.padding || '6px 8px';
    return h('div', { 'aria-hidden': true }, times(props.rows === undefined ? 5 : props.rows, function (r) {
        return h('div', { key: 'skel-' + r, style: { padding: padding, display: 'flex', flexDirection: 'column', gap: 5 } },
            h(SkeletonBar, { width: skelWidth(r, 0) }),
            h(SkeletonBar, { width: skelWidth(r, 1), height: 7 }));
    }));
}

const captionBand = {
    padding: '3px 6px',
    background: S.cssVar('win-bg', '#ece9d8'),
    borderBottom: '1px solid ' + S.cssVar('toolbar-border', '#b0a898'),
};

/**
 * Stand-in for a detail pane: optional section captions over label/value rows.
 * For drill-in panels and modal tabs, where what arrives is a block of fields.
 */
function PanelSkeleton(props) {
    const sections = props.sections === undefined ? 2 : props.sections;
    const rows = props.rows === undefined ? 4 : props.rows;
    const caption = props.caption === undefined ? true : props.caption;
    return h('div', { 'aria-hidden': true, style: { display: 'flex', flexDirection: 'column', gap: 12, padding: 8 } },
        times(sections, function (s) {
            return h('div', { key: s },
                caption ? h('div', { style: Object.assign({ marginBottom: 8 }, captionBand) },
                    h(SkeletonBar, { width: s % 2 ? 120 : 150, height: 9 })) : null,
                h('div', { style: { display: 'flex', flexDirection: 'column', gap: 7 } }, times(rows, function (r) {
                    return h('div', { key: r, style: { display: 'flex', alignItems: 'center', gap: 14 } },
                        h(SkeletonBar, { width: 92, height: 8 }),
                        h(SkeletonBar, { width: skelWidth(s + r, r), height: 8 }));
                })));
        }));
}

/**
 * Stand-in for a card grid — same `auto-fill / minmax` track as the real grid,
 * so placeholder cards land in the same columns at every width. `minWidth` and
 * `gap` must match the real grid; `count` only needs to fill the fold.
 */
function CardGridSkeleton(props) {
    const count = props.count === undefined ? 8 : props.count;
    const minWidth = props.minWidth === undefined ? 250 : props.minWidth;
    const bodyLines = props.bodyLines === undefined ? 3 : props.bodyLines;
    const headerStrip = props.headerStrip === undefined ? true : props.headerStrip;
    const bar = props.bar === undefined ? true : props.bar;
    return h('div', {
        'aria-hidden': true,
        style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(' + minWidth + 'px, 1fr))', gap: props.gap === undefined ? 12 : props.gap },
    }, times(count, function (i) {
        return h('div', {
            key: i,
            style: { background: S.cssVar('win-bg', '#ece9d8'), border: '2px solid', borderColor: '#ffffff #808080 #808080 #ffffff' },
        },
        headerStrip ? h('div', {
            style: {
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6,
                padding: '4px 7px', background: '#a6a6a6', borderBottom: '1px solid rgba(0,0,0,0.2)',
            },
        }, h(SkeletonBar, { width: skelWidth(i, 0), height: 9 }), h(SkeletonBar, { width: 44, height: 9 })) : null,
        h('div', {
            style: { padding: '7px 8px', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: 6, minHeight: props.bodyHeight },
        },
        times(bodyLines, function (l) { return h(SkeletonBar, { key: l, width: skelWidth(i, l + 1), height: 8 }); }),
        bar ? h(SkeletonBar, { width: '100%', height: 10 }) : null));
    }));
}

/**
 * Stand-in for a whole table INCLUDING its header, for a view whose loader
 * replaces the <table> itself. Prefer `TableSkeleton` wherever the real header
 * renders: that one measures the live table, this one is told.
 */
function TableBlockSkeleton(props) {
    const cols = props.cols === undefined ? 6 : props.cols;
    const rows = props.rows === undefined ? 10 : props.rows;
    const header = props.header === undefined ? true : props.header;
    const rowH = props.rowHeight || 22;
    const pad = '4px 6px';
    const headWidths = ['62%', '78%', '45%', '70%', '52%', '84%', '58%', '40%'];
    const cell = function (key, width) {
        return h('div', { key: key, style: { flex: 1, padding: pad, minWidth: 0 } }, h(SkeletonBar, { width: width, height: 8 }));
    };
    return h('div', { 'aria-hidden': true, style: { width: '100%' } },
        header ? h('div', { style: Object.assign({ display: 'flex' }, captionBand, { padding: 0 }) },
            times(cols, function (c) { return cell(c, headWidths[(c * 3) % headWidths.length]); })) : null,
        times(rows, function (r) {
            return h('div', {
                key: r,
                style: {
                    display: 'flex', height: rowH, alignItems: 'center',
                    background: S.cssVar('table-bg', '#ffffff'),
                    borderBottom: '1px solid ' + S.cssVar('table-line', '#d6d3ce'),
                },
            }, times(cols, function (c) { return cell(c, skelWidth(r, c)); }));
        }));
}

/**
 * XP-boot-style marquee: three blue blocks sliding across a recessed track.
 * Only for a wait with no shape to promise — otherwise use a skeleton.
 */
function Loading(props) {
    const label = props.label === undefined ? 'Loading...' : props.label;
    const inner = h('div', { role: 'status', style: { textAlign: 'center', fontFamily: S.font, userSelect: 'none' } },
        label ? h('div', { style: { fontSize: S.fs.title, fontWeight: 'bold', color: '#1a3d90', marginBottom: 8 } }, label) : null,
        h('div', { className: 'terras-loading-track' },
            h('div', { className: 'terras-loading-blocks' }, h('span'), h('span'), h('span'))));
    if (!props.fullScreen) {
        return h('div', { style: Object.assign({ padding: '32px 0', display: 'flex', justifyContent: 'center' }, props.style) }, inner);
    }
    return h('div', {
        style: Object.assign({
            position: 'fixed', inset: 0, background: S.cssVar('win-bg', '#ece9d8'),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }, props.style),
    }, inner);
}

module.exports = {
    SkeletonBar: SkeletonBar,
    TableSkeleton: TableSkeleton,
    useTableSkeletonMetrics: useTableSkeletonMetrics,
    ListSkeleton: ListSkeleton,
    PanelSkeleton: PanelSkeleton,
    CardGridSkeleton: CardGridSkeleton,
    TableBlockSkeleton: TableBlockSkeleton,
    Loading: Loading,
    SKEL_PAGE_ROWS: SKEL_PAGE_ROWS,
};
