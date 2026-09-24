'use strict';

// Read-only record fields — "Default bin: A-03", "Unit: KG". erp grew this five
// times (DyeRecipeTab DetailField, the two mobile scan views' Row, a request
// detail panel), sku once (ItemDetailDialog's <dl>) and crm once
// (ui/detail.tsx), in two shapes:
//
//   stacked (default)  label over value, in ruled cells across `columns` —
//                      a record that reads as a spec sheet;
//   inline             label left, value right, one per line — a short
//                      summary in a narrow panel or a phone screen.
//
// A real <dl>, so the pairs are announced as term/definition. An empty value
// renders the em dash (erp's EMPTY_DASH, muted) so a blank field holds its place
// instead of collapsing the grid.

const React = require('react');
const S = require('./styles');

const h = React.createElement;
const EMPTY_DASH = '—';
const LayoutContext = React.createContext({ inline: false, columns: 2 });

/**
 * @param {{ columns?: number, inline?: boolean, style?: object, children: React.ReactNode }} props
 */
function DetailGrid(props) {
    const inline = !!props.inline;
    const columns = inline ? 1 : (props.columns || 2);
    return h(LayoutContext.Provider, { value: { inline: inline, columns: columns } },
        h('dl', {
            style: Object.assign({
                display: 'grid',
                gridTemplateColumns: 'repeat(' + columns + ', minmax(0, 1fr))',
                margin: 0,
                fontFamily: S.font,
            }, props.style),
        }, props.children));
}

/**
 * @param {{ label: React.ReactNode, value?: React.ReactNode, wide?: boolean, mono?: boolean }} props
 * `wide` spans every column (notes, addresses — anything that wraps).
 */
function Detail(props) {
    const layout = React.useContext(LayoutContext);
    const empty = props.value === null || props.value === undefined || props.value === '';
    const valueStyle = {
        margin: 0,
        fontSize: layout.inline ? S.fs.title : S.fs.base,
        fontFamily: props.mono ? S.fontMono : S.font,
        color: empty ? S.cssVar('win-text-3', '#666666') : S.cssVar('win-text', '#000000'),
        whiteSpace: 'pre-wrap',
        overflowWrap: 'anywhere',
    };
    const labelStyle = { fontSize: layout.inline ? S.fs.title : S.fs.sm, color: S.cssVar('win-text-3', '#666666') };

    if (layout.inline) {
        return h('div', {
            style: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, padding: '2px 0' },
        },
        h('dt', { style: Object.assign({ flexShrink: 0 }, labelStyle) }, props.label),
        h('dd', { style: Object.assign({}, valueStyle, { fontWeight: 'bold', textAlign: 'right' }) }, empty ? EMPTY_DASH : props.value));
    }
    return h('div', {
        style: {
            minWidth: 0,
            padding: '4px 8px',
            borderBottom: '1px solid ' + S.cssVar('table-line', '#d6d3ce'),
            gridColumn: props.wide ? '1 / -1' : undefined,
        },
    },
    h('dt', { style: Object.assign({ marginBottom: 1 }, labelStyle) }, props.label),
    h('dd', { style: valueStyle }, empty ? EMPTY_DASH : props.value));
}

DetailGrid.Detail = Detail;

module.exports = DetailGrid;
module.exports.DetailGrid = DetailGrid;
module.exports.Detail = Detail;
module.exports.EMPTY_DASH = EMPTY_DASH;
