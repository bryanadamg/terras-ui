'use strict';

// Status-filter row for a list toolbar — **segmented**: the chips sit flush
// against each other as one control, not as loose pills. That is the app-wide
// shape for "pick one of these"; don't re-space it per view. Mirrors teras-erp's
// `FilterChipBar` (shellTheme.tsx), which replaced five hand-rolled versions
// carrying five different "selected" blues.
//
// Built on `ToggleChip`, so a selected filter looks like every other selected
// thing in the app.
//
//   <FilterChipBar
//     options={[{ value: 'PENDING', count: 4 }, { value: 'DONE', tone: 'green' }]}
//     value={status}
//     onChange={setStatus}
//   />
//
// `seg` only collapses the shared 1px border and orders the overlap — it does NOT
// square the inner corners, so every chip keeps the same radius and the joins
// read as a hairline seam rather than a hard-welded pill. That is erp's shape;
// don't "finish" it by squaring the middles.
//
// `value` takes an array for a multi-select bar; the caller does the add/remove
// in `onChange`, which always receives the single value that was clicked.

const React = require('react');
const S = require('./styles');
const ToggleChip = require('./ToggleChip');

const rowStyle = (style) => Object.assign({
    display: 'inline-flex',
    alignItems: 'center',
    // nowrap + flexShrink 0: the bar is one control, so it must not break across
    // lines or get squeezed by a wide neighbour in the toolbar.
    flexWrap: 'nowrap',
    flexShrink: 0,
}, style);

/**
 * @param {{
 *   options: Array<string | {
 *     value: string,
 *     label?: React.ReactNode,
 *     count?: number,      // renders "PENDING (4)"
 *     tone?: 'blue'|'green'|'red'|'amber',  // when the value carries its own
 *                                           // semantics (In=green, Out=red)
 *     title?: string,
 *     disabled?: boolean,  // per-value lock, distinct from the bar-level one
 *   }>,
 *   value: string | string[] | null,
 *   onChange: (value: string) => void,
 *   disabled?: boolean,        // whole-bar lock (permission, busy, row locked)
 *   trailing?: React.ReactNode, // extra segment(s) flush after the options — a
 *                               // clear/undo action that isn't itself a value
 *   flat?: boolean,             // see ToggleChip
 *   ariaLabel?: string,
 *   style?: object,
 * }} props
 */
function FilterChipBar(props) {
    const options = props.options || [];
    const value = props.value;
    const isOn = function (v) {
        return Array.isArray(value) ? value.indexOf(v) !== -1 : value === v;
    };

    return React.createElement(
        'div',
        { role: 'group', 'aria-label': props.ariaLabel, style: rowStyle(props.style) },
        options.map(function (opt, i) {
            const o = typeof opt === 'string' ? { value: opt } : opt;
            return React.createElement(
                ToggleChip,
                {
                    key: o.value,
                    on: isOn(o.value),
                    onClick: function () { props.onChange(o.value); },
                    disabled: props.disabled || o.disabled,
                    seg: S.segAt(i, options.length),
                    tone: o.tone,
                    title: o.title,
                    flat: props.flat,
                },
                o.label === undefined || o.label === null ? o.value : o.label,
                o.count === undefined
                    ? null
                    : React.createElement(
                        'span',
                        { style: { opacity: 0.75, fontWeight: 'normal', marginLeft: 4 } },
                        '(' + o.count + ')',
                    ),
            );
        }),
        props.trailing || null,
    );
}

module.exports = FilterChipBar;
module.exports.FilterChipBar = FilterChipBar;
