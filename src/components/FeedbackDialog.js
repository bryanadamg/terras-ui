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
// Screenshots: attached with the button or pasted anywhere in the dialog. Every
// image is redrawn through a canvas before it is kept, which drops EXIF/GPS
// (a canvas holds pixels only) and caps its size. The app header shows the
// user's name, so a full-window screenshot would undo the anonymity — clicking a
// thumbnail opens a black-out editor, and the edit is baked into the pixels, not
// layered on top.
//
// Only the dialog lives here, not the header button that opens it: the header
// is app chrome (erp's is Bootstrap, sku's is AppHeader), and fetch/auth/toasts
// stay with the app — `onSubmit` is the whole contract. Mount it conditionally,
// like `Modal`: `{open && <FeedbackDialog … />}`.
//
// An unsent message survives closing the dialog only if the app keeps it:
// `defaultMessage` seeds the box on open and `onMessageChange` reports every
// edit. Where it is kept (and under which user) is the app's call, the same as
// any other storage key — this package holds none.

const React = require('react');
const S = require('./styles');
const Modal = require('./Modal');
const Button = require('./Button');
const Field = require('./Field');

// Mirrored by both apps' backends, which reject anything past these.
const MAX_SHOTS = 3;
const MAX_SHOT_BYTES = 4 * 1024 * 1024;
// Longest side kept: a 4K screenshot halves to a still-readable 2560.
const MAX_SIDE = 2560;

const DEFAULT_LABELS = {
    title: 'Send feedback',
    message: 'What happened or what would help?',
    attach: 'Attach screenshot',
    pasteHint: 'or paste one (Ctrl/Cmd+V)',
    editHint: 'Screenshots can show your name. Click one to black it out.',
    blackoutHint: 'Drag over anything private to black it out.',
    undo: 'Undo',
    done: 'Done',
    remove: 'Remove screenshot',
    limit: 'Up to ' + MAX_SHOTS + ' screenshots.',
    tooLarge: 'That image is too large to send.',
    notImage: "That file isn't an image this browser can read.",
    includeName: 'Include my name so the team can follow up',
    anonymousHint: 'Sent anonymously: only the page and app version are attached.',
    namedHint: 'Your name and username will be attached.',
    cancel: 'Cancel',
    send: 'Send',
    sending: 'Sending…',
    failed: 'Could not send feedback. Please try again later.',
    offline: "Couldn't reach the server. Check your connection and try again.",
};

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('unreadable image'));
        img.src = src;
    });
}

const dataUrlBytes = (url) => Math.floor((url.length - url.indexOf(',') - 1) * 3 / 4);

// PNG keeps screenshot text crisp; JPEG only when PNG would be over the cap
// (a photo, or a busy full-screen capture). Null if neither fits.
function encode(canvas) {
    let url = canvas.toDataURL('image/png');
    if (dataUrlBytes(url) > MAX_SHOT_BYTES) url = canvas.toDataURL('image/jpeg', 0.85);
    return dataUrlBytes(url) > MAX_SHOT_BYTES ? null : url;
}

function normalize(file) {
    const objectUrl = URL.createObjectURL(file);
    return loadImage(objectUrl).then((img) => {
        URL.revokeObjectURL(objectUrl);
        const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        return encode(canvas);
    }, (err) => {
        URL.revokeObjectURL(objectUrl);
        throw err;
    });
}

const toRect = (d) => ({
    x: Math.min(d.x0, d.x1), y: Math.min(d.y0, d.y1),
    w: Math.abs(d.x1 - d.x0), h: Math.abs(d.y1 - d.y0),
});

/**
 * Drag rectangles over a screenshot; Done bakes them into the pixels. The
 * canvas is the image's own resolution, scaled down only by CSS, so pointer
 * positions are mapped through the rendered rect — screen px on both sides,
 * which also holds under terras-ui's root zoom.
 */
function BlackoutEditor(props) {
    const h = React.createElement;
    const L = props.labels;
    const canvasRef = React.useRef(null);
    const [img, setImg] = React.useState(null);
    const [rects, setRects] = React.useState([]);
    const [drag, setDrag] = React.useState(null);

    React.useEffect(() => {
        let live = true;
        loadImage(props.src).then((loaded) => { if (live) setImg(loaded); });
        return () => { live = false; };
    }, [props.src]);

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !img) return;
        if (canvas.width !== img.naturalWidth) canvas.width = img.naturalWidth;
        if (canvas.height !== img.naturalHeight) canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        ctx.fillStyle = '#000000';
        rects.concat(drag ? [toRect(drag)] : []).forEach((r) => ctx.fillRect(r.x, r.y, r.w, r.h));
    }, [img, rects, drag]);

    const point = (e) => {
        const canvas = canvasRef.current;
        const r = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - r.left) * canvas.width / r.width,
            y: (e.clientY - r.top) * canvas.height / r.height,
        };
    };

    const finish = () => {
        // The effect above already painted every rect at full resolution.
        props.onDone(encode(canvasRef.current));
    };

    return h('div', {
        style: { border: '1px solid #808080', background: '#f5f4ef', padding: 6, marginBottom: 8 },
    },
        h('div', { style: { fontFamily: S.font, fontSize: S.fs.sm, color: '#444444', marginBottom: 4 } }, L.blackoutHint),
        h('canvas', {
            ref: canvasRef,
            style: {
                display: 'block', margin: '0 auto', maxWidth: '100%',
                maxHeight: 'calc(' + S.cssVar('app-vh', '100vh') + ' * 45 / 100)',
                cursor: 'crosshair', touchAction: 'none', background: '#ffffff',
            },
            onPointerDown: (e) => {
                if (!img) return;
                e.preventDefault();
                e.currentTarget.setPointerCapture(e.pointerId);
                const p = point(e);
                setDrag({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
            },
            onPointerMove: (e) => {
                if (!drag) return;
                const p = point(e);
                setDrag((d) => (d ? Object.assign({}, d, { x1: p.x, y1: p.y }) : d));
            },
            onPointerUp: () => {
                if (!drag) return;
                const r = toRect(drag);
                if (r.w > 2 && r.h > 2) setRects((rs) => rs.concat([r]));
                setDrag(null);
            },
        }),
        h('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: 4, marginTop: 6 } },
            h(Button, { type: 'button', size: 'sm', disabled: !rects.length, onClick: () => setRects((rs) => rs.slice(0, -1)) }, L.undo),
            h(Button, { type: 'button', size: 'sm', onClick: props.onCancel }, L.cancel),
            h(Button, { type: 'button', size: 'sm', tone: 'primary', disabled: !img, onClick: finish }, L.done),
        ),
    );
}

/**
 * @param {{
 *   onClose: () => void,
 *   onSubmit: (report: { message: string, include_name: boolean, screenshots: string[] }) => Promise<unknown>,
 *   labels?: object,          // partial — English defaults fill the rest
 *   icon?: React.ReactNode,   // title-bar slot; this package ships no icon set
 *   defaultMessage?: string,  // seeds the box on open (an app-kept draft)
 *   onMessageChange?: (message: string) => void,
 * }} props
 */
function FeedbackDialog(props) {
    const L = Object.assign({}, DEFAULT_LABELS, props.labels);
    const [message, setMessage] = React.useState(props.defaultMessage || '');
    const [includeName, setIncludeName] = React.useState(false);
    const [shots, setShots] = React.useState([]);   // data: URLs, already normalized
    const [editing, setEditing] = React.useState(null);
    const [notice, setNotice] = React.useState('');
    const [sending, setSending] = React.useState(false);
    const [error, setError] = React.useState('');
    const fileRef = React.useRef(null);

    // True when the list held at least one image, so a paste of plain text
    // into the textarea is left alone.
    const addFiles = (list) => {
        const files = Array.prototype.filter.call(list || [], (f) => /^image\//.test(f.type));
        if (!files.length) return false;
        setNotice('');
        const room = MAX_SHOTS - shots.length;
        if (files.length > room) setNotice(L.limit);
        files.slice(0, Math.max(0, room)).forEach((file) => {
            normalize(file).then((src) => {
                if (!src) { setNotice(L.tooLarge); return; }
                setShots((s) => (s.length >= MAX_SHOTS ? s : s.concat([src])));
            }, () => setNotice(L.notImage));
        });
        return true;
    };

    const submit = (e) => {
        e.preventDefault();
        if (sending || !message.trim() || editing !== null) return;
        setSending(true);
        setError('');
        Promise.resolve(props.onSubmit({
            message: message,
            include_name: includeName,
            screenshots: shots.map((src) => src.slice(src.indexOf(',') + 1)),
        }))
            .then(() => props.onClose())
            .catch((err) => {
                setSending(false);
                // fetch() rejects with a TypeError when the request never left
                // the device, and its message is the browser's own ("Failed to
                // fetch", "Load failed"), which tells an operator nothing.
                // Anything else is the server talking, and its message stands.
                setError(err instanceof TypeError ? L.offline : (err && err.message) || L.failed);
            });
    };

    const h = React.createElement;
    const hint = { fontFamily: S.font, fontSize: S.fs.sm, color: '#666666' };
    return h(Modal, {
        as: 'form',
        onSubmit: submit,
        onPaste: (e) => { if (addFiles(e.clipboardData && e.clipboardData.files)) e.preventDefault(); },
        title: L.title,
        icon: props.icon,
        onClose: props.onClose,
        closeOnBackdrop: false,
        modeless: true,
        width: 480,
        footer: h(React.Fragment, null,
            h(Button, { type: 'button', onClick: props.onClose }, L.cancel),
            h(Button, { type: 'submit', tone: 'primary', disabled: sending || !message.trim() || editing !== null },
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
                value: message,
                onChange: (e) => {
                    setMessage(e.target.value);
                    if (props.onMessageChange) props.onMessageChange(e.target.value);
                },
            }),
        ),

        editing !== null
            ? h(BlackoutEditor, {
                src: shots[editing],
                labels: L,
                onCancel: () => setEditing(null),
                onDone: (src) => {
                    if (src) setShots((s) => s.map((old, i) => (i === editing ? src : old)));
                    else setNotice(L.tooLarge);
                    setEditing(null);
                },
            })
            : h('div', { style: { marginBottom: 8 } },
                h('div', { style: { display: 'flex', alignItems: 'center', gap: 6 } },
                    h(Button, {
                        type: 'button', size: 'sm', disabled: shots.length >= MAX_SHOTS,
                        onClick: () => fileRef.current && fileRef.current.click(),
                    }, L.attach),
                    h('span', { style: hint }, L.pasteHint),
                    h('input', {
                        ref: fileRef, type: 'file', accept: 'image/*', multiple: true,
                        style: { display: 'none' },
                        onChange: (e) => { addFiles(e.target.files); e.target.value = ''; },
                    }),
                ),
                shots.length
                    ? h('div', { style: { display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' } },
                        shots.map((src, i) => h('div', { key: i, style: { position: 'relative' } },
                            h('img', {
                                src: src, alt: '', title: L.editHint,
                                onClick: () => setEditing(i),
                                style: { height: 56, maxWidth: 120, objectFit: 'cover', border: '1px solid #808080', cursor: 'pointer', display: 'block' },
                            }),
                            h('button', {
                                type: 'button', 'aria-label': L.remove, title: L.remove,
                                onClick: () => setShots((s) => s.filter((_, j) => j !== i)),
                                style: {
                                    position: 'absolute', top: -6, right: -6, width: 16, height: 16, padding: 0,
                                    borderRadius: 8, border: '1px solid #800000', background: '#c84040',
                                    color: '#ffffff', fontSize: 10, lineHeight: '14px', cursor: 'pointer',
                                },
                            }, '×'),
                        )))
                    : null,
                shots.length ? h('div', { style: Object.assign({ marginTop: 4 }, hint) }, L.editHint) : null,
                notice ? h('div', { role: 'status', style: Object.assign({ marginTop: 4 }, hint, { color: '#8e0000' }) }, notice) : null,
            ),

        h('label', {
            style: { display: 'flex', alignItems: 'center', gap: 6, fontFamily: S.font, fontSize: S.fs.base, cursor: 'pointer' },
        },
            h('input', { type: 'checkbox', checked: includeName, onChange: (e) => setIncludeName(e.target.checked) }),
            L.includeName,
        ),
        h('div', { style: Object.assign({ marginTop: 2 }, hint) },
            includeName ? L.namedHint : L.anonymousHint),
    );
}

module.exports = FeedbackDialog;
module.exports.FeedbackDialog = FeedbackDialog;
