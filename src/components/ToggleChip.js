'use strict';

// Pressed/unpressed button — THE on-off chip shape across Terras: filter rows,
// segmented pickers, weekday selectors. Mirrors terras-erp's `ToggleChip`
// (xpTheme.tsx), which exists because a dozen views each styled their own
// "selected" state and arrived at three different blues.
//
// Use this instead of styling a selected state per view. If you are reaching for
// a *row* of them, reach for `FilterChipBar` (pick-one/pick-many) or
// `SegmentedBar` (stateless actions) instead — they handle the segment geometry.
//
// Not to be confused with `Chip`: that is a tinted pill that REPORTS state and
// never takes a click, over the five status families. This is a control that
// says "pressed", over four tones. Different jobs, deliberately different faces.
//
// Hover/press motion comes from `.terras-toggle` in chrome.css. `title` renders
// as the native tooltip — erp wraps its version in a `<Tooltip>` component that
// this package doesn't carry.

const React = require('react');
const S = require('./styles');

/**
 * @param {{
 *   on: boolean,
 *   onClick: () => void,
 *   tone?: 'blue'|'green'|'red'|'amber',   // fill colour when selected
 *   seg?: 'first'|'mid'|'last'|'only',     // member of a flush segmented group
 *   flat?: boolean,      // flat idle face instead of the raised gradient — for a
 *                        // segmented status bar that should read as a data
 *                        // control rather than a strip of buttons
 *   toneIdle?: boolean,  // carry `tone`'s hue in the OFF state too. For a
 *                        // standalone toggle whose meaning IS the tone (green =
 *                        // running); never in a filter row, where a tinted idle
 *                        // face reads as selected. Ignored under `flat`.
 *   disabled?: boolean,
 *   minWidth?: number,
 *   title?: string,
 *   style?: object,
 *   className?: string,
 *   children: React.ReactNode,
 * }} props  — all other props (type, aria-*, data-*, …) pass through.
 */
function ToggleChip(props) {
    const rest = Object.assign({}, props);
    delete rest.on; delete rest.onClick; delete rest.tone; delete rest.seg;
    delete rest.flat; delete rest.toneIdle; delete rest.minWidth;
    delete rest.style; delete rest.className; delete rest.children;

    const cls = 'terras-toggle'
        + (props.on ? ' terras-toggle-on' : '')
        + (props.flat ? ' terras-toggle-flat' : '')
        + (props.className ? ' ' + props.className : '');

    return React.createElement(
        'button',
        Object.assign({
            type: 'button',
            'aria-pressed': !!props.on,
            className: cls,
            onClick: function () { if (!props.disabled && props.onClick) props.onClick(); },
            style: S.toggleChip(props.style, {
                on: props.on,
                tone: props.tone,
                seg: props.seg,
                flat: props.flat,
                toneIdle: props.toneIdle,
                minWidth: props.minWidth,
            }),
        }, rest),
        props.children,
    );
}

module.exports = ToggleChip;
module.exports.ToggleChip = ToggleChip;
