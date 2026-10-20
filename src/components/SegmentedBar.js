'use strict';

// The stateless sibling of `FilterChipBar`: a flush group of plain actions with
// no selected member — the date-range presets ("Today | 7d | 30d | Month") that
// erp's two report views each hand-rolled. Same segment geometry, so a preset row
// and a filter row read as the same control. Mirrors terras-erp's `SegmentedBar`.
//
// If one of the members should stay lit after the click, it is a filter, not an
// action — use `FilterChipBar`.

const React = require('react');
const S = require('./styles');
const ToggleChip = require('./ToggleChip');

/**
 * @param {{
 *   actions: Array<{
 *     key: string,
 *     label: React.ReactNode,
 *     onClick: () => void,
 *     title?: string,
 *     disabled?: boolean,
 *   }>,
 *   disabled?: boolean,   // whole-bar lock
 *   ariaLabel?: string,
 *   style?: object,
 * }} props
 */
function SegmentedBar(props) {
    const actions = props.actions || [];

    return React.createElement(
        'div',
        {
            role: 'group',
            'aria-label': props.ariaLabel,
            style: Object.assign({
                display: 'inline-flex',
                alignItems: 'center',
                flexWrap: 'nowrap',
                flexShrink: 0,
            }, props.style),
        },
        actions.map(function (a, i) {
            return React.createElement(
                ToggleChip,
                {
                    key: a.key,
                    on: false,
                    onClick: a.onClick,
                    disabled: props.disabled || a.disabled,
                    seg: S.segAt(i, actions.length),
                    title: a.title,
                },
                a.label,
            );
        }),
    );
}

module.exports = SegmentedBar;
module.exports.SegmentedBar = SegmentedBar;
