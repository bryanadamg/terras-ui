'use client';
'use strict';

// The in-app "send feedback" form, shared so every Terras app asks the same
// two things the same way: what happened, and whether to attach the sender's
// name. Extracted from terras-erp's FeedbackButton.
//
// One text box on purpose — no type picker, no title, no template. Users don't
// know (and shouldn't have to learn) how to file an issue; whoever triages the
// inbox titles and labels it.
//
// Anonymous by default. The checkbox starts unticked and the dialog says, under
// it, exactly what will be attached either way — the promise the backend keeps
// (each app's POST /feedback files a GitHub issue with no identity unless
// `include_name` is true).
//
// Only the dialog lives here, not the header button that opens it: the header
// is app chrome (erp's is Bootstrap, sku's is AppHeader), and fetch/auth/toasts
// stay with the app — `onSubmit` is the whole contract. Mount it conditionally,
// like `Modal`: `{open && <FeedbackDialog … />}`.

const React = require('react');
const S = require('./styles');
const Modal = require('./Modal');
const Button = require('./Button');
const Field = require('./Field');

const DEFAULT_LABELS = {
    title: 'Send feedback',
    message: 'What happened or what would help?',
    includeName: 'Include my name so the team can follow up',
    anonymousHint: 'Sent anonymously: only the page and app version are attached.',
    namedHint: 'Your name and username will be attached.',
    cancel: 'Cancel',
    send: 'Send',
    sending: 'Sending…',
    failed: 'Could not send feedback. Please try again later.',
};

/**
 * @param {{
 *   onClose: () => void,
 *   onSubmit: (report: { message: string, include_name: boolean }) => Promise<unknown>,
 *   labels?: object,          // partial — English defaults fill the rest
 *   icon?: React.ReactNode,   // title-bar slot; this package ships no icon set
 * }} props
 */
function FeedbackDialog(props) {
    const L = Object.assign({}, DEFAULT_LABELS, props.labels);
    const [message, setMessage] = React.useState('');
    const [includeName, setIncludeName] = React.useState(false);
    const [sending, setSending] = React.useState(false);
    const [error, setError] = React.useState('');

    const submit = (e) => {
        e.preventDefault();
        if (sending || !message.trim()) return;
        setSending(true);
        setError('');
        Promise.resolve(props.onSubmit({ message: message, include_name: includeName }))
            .then(() => props.onClose())
            .catch((err) => {
                setSending(false);
                setError((err && err.message) || L.failed);
            });
    };

    const h = React.createElement;
    return h(Modal, {
        as: 'form',
        onSubmit: submit,
        title: L.title,
        icon: props.icon,
        onClose: props.onClose,
        closeOnBackdrop: false,
        modeless: true,
        width: 480,
        footer: h(React.Fragment, null,
            h(Button, { type: 'button', onClick: props.onClose }, L.cancel),
            h(Button, { type: 'submit', tone: 'primary', disabled: sending || !message.trim() },
                sending ? L.sending : L.send),
        ),
    },
        h(Field.FormError, null, error),
        h('div', { style: { marginBottom: 8 } },
            h(Field.FieldLabel, { htmlFor: 'terras-feedback-message' }, L.message),
            h('textarea', {
                id: 'terras-feedback-message',
                className: 'terras-field',
                style: S.field({ width: '100%', height: 'auto', padding: '4px 6px', resize: 'vertical' }),
                rows: 5, maxLength: 5000, autoFocus: true,
                value: message, onChange: (e) => setMessage(e.target.value),
            }),
        ),
        h('label', {
            style: { display: 'flex', alignItems: 'center', gap: 6, fontFamily: S.font, fontSize: S.fs.base, cursor: 'pointer' },
        },
            h('input', { type: 'checkbox', checked: includeName, onChange: (e) => setIncludeName(e.target.checked) }),
            L.includeName,
        ),
        h('div', { style: { fontFamily: S.font, fontSize: S.fs.sm, color: '#666666', marginTop: 2 } },
            includeName ? L.namedHint : L.anonymousHint),
    );
}

module.exports = FeedbackDialog;
module.exports.FeedbackDialog = FeedbackDialog;
