'use strict';

// Status chip — the small tinted pill that carries a row's state. Reads the
// theme-independent `statusFamily` tokens, so a chip looks identical in every
// theme (mirrors teras-erp's STATUS_FAMILY / `Chip`, which is XP-flavoured in
// both themes rather than branching per theme at ~100 call sites).
//
// Five families and no more: gray (neutral/idle), amber (waiting/attention),
// blue (in progress/informational), green (done/ok), red (failed/blocked). A
// sixth hue means the states aren't actually distinct — map to one of these.

const React = require('react');
const S = require('./styles');

const FAMILIES = ['gray', 'amber', 'blue', 'green', 'red'];

/**
 * @param {{
 *   family?: 'gray'|'amber'|'blue'|'green'|'red',
 *   solid?: boolean,          // filled face instead of the tint, for a chip that must shout
 *   mono?: boolean,           // code/reference chips — tabular, so columns of them align
 *   title?: string,
 *   style?: object,
 *   children: React.ReactNode,
 * }} props
 */
function Chip(props) {
    const family = FAMILIES.indexOf(props.family) === -1 ? 'gray' : props.family;
    const base = props.solid
        ? {
            background: S.cssVar('status-' + family),
            borderColor: S.cssVar('status-' + family),
            color: '#ffffff',
        }
        : {
            background: S.cssVar('chip-' + family + '-bg'),
            borderColor: S.cssVar('chip-' + family + '-border'),
            color: S.cssVar('chip-' + family + '-text'),
        };

    return React.createElement(
        'span',
        {
            title: props.title,
            style: Object.assign({
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                borderStyle: 'solid',
                borderWidth: 1,
                borderRadius: S.cssVar('radius-chip', '3px'),
                padding: '0 4px',
                fontFamily: props.mono ? S.fontMono : S.font,
                fontSize: S.fs.sm,
                fontWeight: 'bold',
                lineHeight: '14px',
                whiteSpace: 'nowrap',
                verticalAlign: 'middle',
            }, base, props.style),
        },
        props.children,
    );
}

module.exports = Chip;
module.exports.Chip = Chip;
module.exports.FAMILIES = FAMILIES;
