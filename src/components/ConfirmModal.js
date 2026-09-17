'use strict';

// A confirm/cancel dialog — one press away from something you'd rather ask
// about first. Mirrors teras-erp's `ConfirmModal`, built the same way here: a
// composition of `Modal` + `Button`, not a new primitive.
//
// erp's own version has a fifth, unstyled "warning" button (its `xpConfirmBtn`
// falls through to the plain face for that variant — there is no orange button
// anywhere in erp). Reusing `ButtonTone` here instead of a separate enum keeps
// that the same non-decision: `tone: 'default'` IS the warning button, not a
// fifth tone this package would have to keep in step with `BTN_TONES`.

const React = require('react');
const Modal = require('./Modal');
const Button = require('./Button');
const S = require('./styles');

// Modal's title bar is one of the five `ShellTone` families; Button has only
// the four `BTN_TONES`. `default` is where they diverge — erp's "warning"
// dialog gets an amber bar over a plain (uncoloured) confirm button.
const TONE = {
    danger: { modal: 'red', button: 'danger' },
    primary: { modal: 'blue', button: 'primary' },
    success: { modal: 'green', button: 'success' },
    warning: { modal: 'amber', button: 'default' },
};

/**
 * @param {{
 *   title: React.ReactNode,
 *   message: React.ReactNode,
 *   onClose: () => void,
 *   onConfirm: () => void,
 *   confirmText?: string,
 *   cancelText?: string,
 *   tone?: 'danger'|'primary'|'success'|'warning',
 *   icon?: React.ReactNode,
 *   width?: number|string,
 * }} props  — mount/unmount controlled, same as `Modal` (no `open` flag).
 */
function ConfirmModal(props) {
    const t = TONE[props.tone || 'danger'] || TONE.danger;
    const confirmText = props.confirmText || 'Confirm';
    const cancelText = props.cancelText || 'Cancel';

    return React.createElement(
        Modal,
        {
            title: props.title,
            icon: props.icon,
            tone: t.modal,
            onClose: props.onClose,
            modeless: true,
            layer: 3,
            width: props.width || 340,
            footer: React.createElement(
                React.Fragment,
                null,
                React.createElement(Button, { onClick: props.onClose }, cancelText),
                React.createElement(
                    Button,
                    { tone: t.button, onClick: function () { props.onConfirm(); props.onClose(); } },
                    confirmText.toUpperCase(),
                ),
            ),
        },
        React.createElement('p', { style: { margin: 0, padding: '8px 0', textAlign: 'center', fontFamily: S.font, fontSize: S.fs.base } }, props.message),
    );
}

module.exports = ConfirmModal;
module.exports.ConfirmModal = ConfirmModal;
