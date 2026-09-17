'use strict';

// Full-page "you can't be here" — swapped in for a route's content when the
// signed-in user lacks the permission it requires. Mirrors teras-erp's
// `AccessDenied`; the app shell (sidebar, header, logout) stays around it so
// there's somewhere else to go, which is why this renders only the panel, not
// a whole-screen takeover.
//
// `onBack` is a callback, not a router: erp's copy calls `useRouter().push`
// directly, which this package has no opinion on (Next.js app-router vs
// react-router, same split `Sidebar` already makes for navigation).

const React = require('react');
const S = require('./styles');
const Button = require('./Button');

// Recessed white panel — `raised()`'s two tones in the SUNKEN order (dark
// top/left), not `S.panel()`'s raised one: this reports state, it isn't a
// pressable surface.
const panelStyle = Object.assign(
    { background: '#ffffff', padding: '28px 16px', textAlign: 'center', color: S.cssVar('win-text', '#555555') },
    S.raised(S.cssVar('win-border-dark', '#808080'), S.cssVar('win-border-light', '#ffffff')),
);

/**
 * @param {{
 *   icon?: React.ReactNode,        // defaults to a plain lock glyph — this
 *                                   // package ships no icon set (see Toast)
 *   title?: React.ReactNode,
 *   codes?: string[],               // permission codes the route needs
 *   message?: React.ReactNode,      // overrides the generated "ask an admin" line
 *   onBack?: () => void,            // omit and no button renders
 *   backLabel?: string,
 *   style?: object,
 * }} props
 */
function AccessDenied(props) {
    const codes = props.codes || [];
    const needed = codes.join(' or ');

    return React.createElement(
        'div',
        { style: Object.assign({ padding: 16, fontFamily: S.font, fontSize: S.fs.base }, props.style) },
        React.createElement(
            'div',
            { style: panelStyle },
            React.createElement('div', { style: { fontSize: 24, marginBottom: 8, color: S.cssVar('sep', '#a0a0a0') } }, props.icon || '🔒'),
            React.createElement('div', { style: { fontSize: S.fs.title, fontWeight: 'bold' } }, props.title || 'You do not have access to this page'),
            React.createElement(
                'div',
                { style: { marginTop: 4 } },
                props.message || (needed
                    ? React.createElement(React.Fragment, null, 'Ask an administrator for ', React.createElement('b', null, needed), '.')
                    : 'Ask an administrator for access.'),
            ),
            props.onBack
                ? React.createElement(Button, { style: { marginTop: 12 }, onClick: props.onBack }, props.backLabel || 'Go back')
                : null,
        ),
    );
}

module.exports = AccessDenied;
module.exports.AccessDenied = AccessDenied;
