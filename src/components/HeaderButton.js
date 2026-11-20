'use strict';

// Ghost controls for the app header band (AppHeader's `right` slot): a scan or
// feedback button, a language picker. They belong to the band, not the page —
// no face of their own, a faint white edge, white text — so they don't read as
// grey XP buttons stuck onto a flat sapphire bar, which is what each app's
// header looked like when it reached for its page `Button` or a Bootstrap
// `btn-light` / `form-select` there.
//
// `LogoutButton` is deliberately NOT one of these: it stays the one flat red
// action in the row.
//
// Hover (a white wash) and press (a slight darkening) are colour changes over an
// inline face, so they live in chrome.css with `!important`, like logout's.

const React = require('react');
const Button = require('./Button');
const S = require('./styles');

const face = (style) => Object.assign({
    background: S.cssVar('header-btn-bg', 'transparent'),
    border: '1px solid ' + S.cssVar('header-btn-border', 'rgba(255,255,255,0.35)'),
    borderColor: S.cssVar('header-btn-border', 'rgba(255,255,255,0.35)'),
    color: S.cssVar('on-solid', '#ffffff'),
    fontWeight: 'bold',
    fontSize: S.fs.sm,
    height: 22,
    padding: '0 6px',
    boxShadow: 'none',
}, style);

/**
 * @param {{ icon?: React.ReactNode, children?: React.ReactNode, style?: object, className?: string }} props
 *   — all other props (onClick, title, disabled, …) pass through to the button.
 */
function HeaderButton(props) {
    const rest = Object.assign({}, props);
    delete rest.style; delete rest.className; delete rest.tone; delete rest.size;
    return React.createElement(Button, Object.assign({}, rest, {
        className: 'terras-header-btn' + (props.className ? ' ' + props.className : ''),
        style: face(props.style),
    }));
}

/**
 * A native <select> in the same ghost face, with a chevron that follows the text
 * colour. Controlled by the app (`value` + `onChange`); options are children.
 *
 * @param {{ style?: object, className?: string, children?: React.ReactNode }} props
 *   — all other props (value, onChange, aria-label, …) pass through to the select.
 */
function HeaderSelect(props) {
    const rest = Object.assign({}, props);
    delete rest.style; delete rest.className;
    return React.createElement(
        'span',
        { style: { position: 'relative', display: 'inline-flex', alignItems: 'center', color: S.cssVar('on-solid', '#ffffff') } },
        React.createElement('select', Object.assign({}, rest, {
            className: 'terras-header-select' + (props.className ? ' ' + props.className : ''),
            style: face(Object.assign({
                appearance: 'none',
                WebkitAppearance: 'none',
                padding: '0 18px 0 6px',
                borderRadius: S.cssVar('radius-btn', '3px'),
                fontFamily: S.font,
                cursor: 'pointer',
            }, props.style)),
        })),
        React.createElement('span', {
            'aria-hidden': true,
            style: { position: 'absolute', right: 6, pointerEvents: 'none', fontSize: S.fs.sm, lineHeight: 1 },
        }, '▾'),
    );
}

module.exports = HeaderButton;
module.exports.HeaderButton = HeaderButton;
module.exports.HeaderSelect = HeaderSelect;
