'use strict';

// Dependency-free inline-SVG trend line with a dot on the latest point.
// Mirrors erp DashboardView.tsx `Sparkline` (sku and crm drew their own).
//
// Coloured by status family, not a free hex: a trend line on a dashboard means
// the same thing as the chip beside it, so it takes the same five words.
//
// There is no KPI "stat tile" beside it on purpose — a tile needs a display
// figure size, and tokens.css deliberately has no display tier (erp paints 20px
// and 26px for the same tile). Paint the figure in the app.

const React = require('react');
const S = require('./styles');

const h = React.createElement;
const PAD = 2;

/**
 * @param {{ values: number[], label: string, family?: 'gray'|'amber'|'blue'|'green'|'red',
 *   width?: number, height?: number, emptyText?: React.ReactNode }} props
 */
function Sparkline(props) {
    const values = props.values || [];
    const width = props.width === undefined ? 120 : props.width;
    const height = props.height === undefined ? 28 : props.height;
    const color = S.cssVar('status-' + (props.family || 'blue'));

    if (values.length < 2) {
        return h('span', {
            role: 'img',
            'aria-label': props.label + ': not enough history',
            style: { fontSize: 9, color: '#aaaaaa', fontFamily: S.font },
        }, props.emptyText === undefined ? 'not enough history' : props.emptyText);
    }

    const min = Math.min.apply(null, values);
    const max = Math.max.apply(null, values);
    const range = max - min || 1;
    const w = width - PAD * 2;
    const ht = height - PAD * 2;
    const yOf = function (v) { return PAD + ht - ((v - min) / range) * ht; };
    const pts = values.map(function (v, i) {
        return (PAD + (i / (values.length - 1)) * w).toFixed(1) + ',' + yOf(v).toFixed(1);
    }).join(' ');

    return h('svg', {
        width: width,
        height: height,
        viewBox: '0 0 ' + width + ' ' + height,
        role: 'img',
        'aria-label': props.label,
        style: Object.assign({ display: 'block' }, props.style),
    },
    h('polyline', { points: pts, fill: 'none', stroke: color, strokeWidth: 1.5, strokeLinejoin: 'round', strokeLinecap: 'round' }),
    h('circle', { cx: PAD + w, cy: yOf(values[values.length - 1]), r: 2, fill: color }));
}

module.exports = Sparkline;
module.exports.Sparkline = Sparkline;
