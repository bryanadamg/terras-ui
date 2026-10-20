'use strict';

// Classic button: raised two-tone bevel over a top-light gradient face, in four
// intents. Mirrors terras-erp's `xpBtn` + `BTN_TONES`.
//
// Hover/press motion comes from the `.terras-btn` class in chrome.css, not from
// JS hover state — and it animates filter/transform/shadow only. That is
// deliberate: the face is an inline gradient, and an inline background always
// beats a CSS one, so a colour-based hover would silently do nothing.
//
// Adding a fifth tone is almost never the answer; erp grew ~19 local copies with
// three different blues before these four were centralised.

const React = require('react');
const S = require('./styles');

const SIZES = {
    sm: { fontSize: S.fs.base, padding: '1px 8px', minHeight: 18 },
    md: { fontSize: S.fs.base, padding: '2px 10px', minHeight: 22 },
    lg: { fontSize: S.fs.title, padding: '4px 14px', minHeight: 26 },
};

/**
 * @param {{
 *   tone?: 'default'|'primary'|'success'|'danger',
 *   size?: 'sm'|'md'|'lg',
 *   icon?: React.ReactNode,
 *   block?: boolean,
 *   style?: object,
 *   className?: string,
 *   children?: React.ReactNode,
 * }} props  — all other props (onClick, disabled, type, title, …) pass through.
 */
function Button(props) {
    const tone = props.tone || 'default';
    const size = SIZES[props.size || 'md'] || SIZES.md;
    const rest = Object.assign({}, props);
    delete rest.tone; delete rest.size; delete rest.icon; delete rest.block;
    delete rest.style; delete rest.className; delete rest.children;

    return React.createElement(
        'button',
        Object.assign({
            type: props.type || 'button',
            className: 'terras-btn' + (props.className ? ' ' + props.className : ''),
            style: S.button(Object.assign(
                {},
                size,
                S.BTN_TONES[tone] || S.BTN_TONES.default,
                props.block ? { width: '100%' } : null,
                props.style,
            )),
        }, rest),
        props.icon || null,
        props.children,
    );
}

module.exports = Button;
module.exports.Button = Button;
