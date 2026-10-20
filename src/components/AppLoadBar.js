'use strict';

// Determinate strip for a boot-time data load — the one place a filling bar is
// honest, because the caller can count responses against a known total.
// Mirrors terras-erp's `AppLoadBar`; the counting itself (DataContext's
// `loadProgress`) stays app-side, this only takes the two numbers.

const React = require('react');
const S = require('./styles');
const ProgressBar = require('./ProgressBar');

/**
 * @param {{
 *   done: number,
 *   total: number,           // renders nothing while total is 0 or done >= total
 *   label?: React.ReactNode,
 *   tone?: 'gray'|'amber'|'blue'|'green'|'red',
 *   style?: object,
 * }} props
 */
function AppLoadBar(props) {
    const total = props.total;
    const done = props.done;
    if (!total || done >= total) return null;

    const pct = (done / total) * 100;

    return React.createElement(
        'div',
        {
            role: 'progressbar',
            'aria-valuemin': 0,
            'aria-valuemax': total,
            'aria-valuenow': done,
            'aria-label': 'Loading data',
            style: Object.assign({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '4px 12px',
                background: S.cssVar('win-bg', '#ece9d8'),
                borderBottom: '1px solid ' + S.cssVar('toolbar-border', '#b0a898'),
                fontFamily: S.font,
                fontSize: S.fs.base,
                color: '#33393f',
                userSelect: 'none',
            }, props.style),
        },
        React.createElement('span', { style: { whiteSpace: 'nowrap' } }, props.label || 'Loading data…'),
        React.createElement(
            'span',
            { style: { flex: 1, maxWidth: 320 } },
            React.createElement(ProgressBar, { pct: pct, tone: props.tone || 'blue', height: 10 }),
        ),
        React.createElement(
            'span',
            { style: { whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' } },
            done + ' of ' + total,
        ),
    );
}

module.exports = AppLoadBar;
module.exports.AppLoadBar = AppLoadBar;
