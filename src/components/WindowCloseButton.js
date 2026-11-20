'use strict';

// The window title bar's close box (erp `ModalWrapper.tsx` WindowCloseButton).
// ONE face for every window title bar — a dialog, a modeless panel, a print
// preview. erp arrived at this after its print modals shipped a bare text glyph
// with no chrome: a print preview is a window, so its close button is this
// close button.
//
// It is not a `Button` tone, for the same reason `LogoutButton` isn't: it's one
// control with a fixed face and a fixed 21px box, not a new intent. Its resting
// face is a warm grey gradient over the plain bevel (so it reads as a pressable
// box against the blue bar, not as a danger button sitting in the chrome), and
// only hover goes red — that colour swap is what says "this one closes". Under
// classic (Sapphire Frost) the resting face is a ghost instead — transparent with
// a faint white edge, the same family as HeaderButton — so it sits on the flat
// band rather than reading as a grey XP box stuck onto it; hover is unchanged.
//
// Like `LogoutButton`, its hover is a COLOUR change rather than a brightness
// bump, so the rule lives in chrome.css carrying `!important` — the resting
// face is inline, and an inline declaration outranks a plain stylesheet rule
// whatever its specificity. The `.terras-btn` lift is deliberately kept on top
// of it (erp tags this button `.xp-btn` and swaps the colour as well).

const React = require('react');
const S = require('./styles');

// The four edge colours S.button's raised() paints — must stay identical to styles.js.
const BEVEL_EDGES = S.cssVar('btn-border-light', '#dfdfdf') + ' ' + S.cssVar('btn-border-dark', '#808080') + ' '
    + S.cssVar('btn-border-dark', '#808080') + ' ' + S.cssVar('btn-border-light', '#dfdfdf');

/**
 * @param {{ onClose: () => void, title?: string, style?: object }} props
 */
function WindowCloseButton(props) {
    const rest = {};
    Object.keys(props).forEach(function (k) {
        if (k !== 'onClose' && k !== 'style') rest[k] = props[k];
    });

    return React.createElement(
        'button',
        Object.assign({
            type: 'button',
            className: 'terras-btn terras-win-close',
            onClick: props.onClose,
            title: 'Close',
            'aria-label': 'Close',
            style: S.button(Object.assign({
                width: 21,
                height: 21,
                minWidth: 21,
                padding: 0,
                fontWeight: 'bold',
                lineHeight: 1,
                flexShrink: 0,
                background: S.cssVar('winclose-face', 'linear-gradient(to bottom, #d4c8c8, #a89898)'),
                // Classic: a faint white edge (the ghost face). Elsewhere: the
                // plain button bevel S.button paints.
                borderColor: S.cssVar('winclose-border', BEVEL_EDGES),
                color: S.cssVar('on-solid', '#ffffff'),
                textShadow: '0 1px 1px rgba(0, 0, 0, 0.5)',
            }, props.style)),
        }, rest),
        '✕',
    );
}

module.exports = WindowCloseButton;
module.exports.WindowCloseButton = WindowCloseButton;
