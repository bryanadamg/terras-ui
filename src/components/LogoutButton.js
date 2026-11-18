'use strict';

// The header's logout control. One named button, not a fifth `Button` tone.
//
// Why it is not `tone="danger"`: BTN_TONES.danger is the XP gradient over a
// two-tone bevel (xpTheme.tsx), and that is the face a destructive button wears
// *inside a window* — a modal's Delete, a row's remove. Logout is not in a
// window. It sits in the title band, which is flat chrome, and erp paints it
// flat there (globals.css `.classic-header .btn-outline-danger`): solid
// #ff4d4d, ONE 1px #800000 border, no gradient, no bevel. Those two properties
// are the whole difference and both have to go, together — a gradient with a
// single border, or a flat fill with a bevel, reads as a third button family.
//
// The other direction — flattening `--terras-btn-danger-face` so `danger`
// matches this — is the trap: it would drag every destructive button in erp,
// crm and sku off xpTheme to make one header control agree.
//
// Geometry is erp's header, not `size="sm"`: 22px tall against the 10px caps
// label, so it lines up with the other controls in that band.

const React = require('react');
const Button = require('./Button');
const S = require('./styles');

// Spread last over `S.button()`, so the single borderColor overwrites the
// bevel's four-value one rather than sitting beside it.
const face = (style) => Object.assign({
    background: S.cssVar('logout-face', '#ff4d4d'),
    border: '1px solid ' + S.cssVar('logout-border', '#800000'),
    borderColor: S.cssVar('logout-border', '#800000'),
    color: S.cssVar('on-solid', '#ffffff'),
    fontWeight: 'bold',
    fontSize: S.fs.sm,
    height: 22,
    padding: '0 8px',
    // erp's `.ui-style-classic .classic-header .btn` drop shadow. Inline because
    // it is part of the resting face; chrome.css overrides it on hover/press and
    // needs !important to do so (see there).
    boxShadow: '1px 1px 0 rgba(0, 0, 0, 0.1)',
}, style);

/**
 * @param {{
 *   icon?: React.ReactNode,   // slot — this package ships no icon set
 *   children?: React.ReactNode,
 *   style?: object,
 *   className?: string,
 * }} props  — all other props (onClick, disabled, title, …) pass through.
 */
function LogoutButton(props) {
    const rest = Object.assign({}, props);
    delete rest.style; delete rest.className; delete rest.children;

    return React.createElement(
        Button,
        Object.assign({
            // Both apps already hand-type these two identically; defaulting them
            // here is what stops the third one from inventing its own wording.
            title: 'Terminate Session',
            'data-testid': 'logout-btn',
        }, rest, {
            className: 'terras-logout-btn' + (props.className ? ' ' + props.className : ''),
            style: face(props.style),
        }),
        // A caller that needs the label to drop out on a narrow header wraps it
        // in its own element — that is a Tailwind/Bootstrap class in the app, and
        // neither belongs in here.
        props.children === undefined ? 'LOGOUT' : props.children,
    );
}

module.exports = LogoutButton;
module.exports.LogoutButton = LogoutButton;
