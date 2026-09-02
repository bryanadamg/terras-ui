'use strict';

// Classic dialog: dimmed backdrop + a floating bevelled window with a blue
// title bar, a scrolling body, and a footer action strip. Mirrors teras-erp's
// ModalWrapper / ModalFooterActions.
//
// It is the SAME chrome as `Window`, one z-layer up — that is the point. A
// dialog that borrows a different frame from the page behind it reads as a
// second design language on one screen, which is what a rounded white card over
// XP chrome looks like.
//
// Not a portal: it renders where it is mounted and relies on the modal z-index
// tokens instead. Consuming apps mount dialogs at page level, and a portal would
// drag react-dom into a package that currently peer-depends on react alone.
//
// `modeless` is the second mode (erp's ModalWrapper prop of the same name): no
// backdrop, the page behind stays interactive, and the panel is dragged by its
// title bar. It is what erp uses for creation/edit forms, so a user can keep
// reading the list underneath while filling one in.

const React = require('react');
const S = require('./styles');

const LAYER_Z = {
    1: S.cssVar('z-modal-1', '20000'),
    2: S.cssVar('z-modal-2', '20100'),
    3: S.cssVar('z-modal-3', '20200'),
};

// Modeless panels are moved by mutating the DOM transform directly — no React
// re-render, so no native resize/scroll event fires. Anything anchoring a
// portaled overlay to the panel (a dropdown, a date picker) must listen for
// this to stay glued. Same event NAME erp dispatches, so a consumer that
// listens once works in either app.
const REPOSITION_EVENT = 'terras-modal-reposition';

// Below this width a modeless dialog falls back to a normal blocking one:
// there is no room to drag a floating panel around, and nothing useful behind
// it to keep interactive.
const MODELESS_MIN_WIDTH = '(max-width: 768px)';

// Where a modeless panel opens: clear of the app header rather than centred,
// because the page behind it stays live and centring covers the row you just
// clicked. Reads the SAME var AppHeader/Sidebar size themselves from.
const FLOAT_TOP = 'calc(' + S.cssVar('app-header-h', '30px') + ' + 16px)';

// ── Escape stack ────────────────────────────────────────────────────────────
// Escape closes only the TOPMOST dialog. Nested layers 1-3 each push a closer
// on mount and pop it on unmount, so closing the child doesn't also close the
// parent that opened it.
const escStack = [];
let escListenerAttached = false;

function ensureEscListener() {
    if (escListenerAttached || typeof window === 'undefined') return;
    escListenerAttached = true;
    window.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && escStack.length > 0) {
            e.stopPropagation();
            escStack[escStack.length - 1]();
        }
    });
}

// Matches on the client only: the first render (and SSR) reports false, so a
// modeless dialog paints floating and corrects on mount if the viewport is
// narrow. The other way round — assuming narrow — would flash a backdrop over
// every desktop dialog.
function useMediaQuery(query) {
    const state = React.useState(false);
    const matches = state[0];
    const setMatches = state[1];

    React.useEffect(function () {
        if (typeof window === 'undefined' || !window.matchMedia) return;
        const mql = window.matchMedia(query);
        const onChange = function () { setMatches(mql.matches); };
        onChange();
        mql.addEventListener('change', onChange);
        return function () { mql.removeEventListener('change', onChange); };
    }, [query]);

    return matches;
}

/**
 * @param {{
 *   title?: React.ReactNode,
 *   icon?: React.ReactNode,
 *   subtitle?: React.ReactNode,      // second line under the title, inside the bar
 *   tone?: 'blue'|'red'|'amber'|'green'|'grey',
 *   onClose?: () => void,            // also wired to the title-bar close button, the backdrop and Escape
 *   closeOnBackdrop?: boolean,       // default true; off for forms with unsaved input. Inert when modeless (no backdrop)
 *   modeless?: boolean,              // no backdrop, page stays interactive, drag by the title bar
 *   width?: number | string,
 *   layer?: 1 | 2 | 3,               // stacking tier for a dialog opened from a dialog
 *   footer?: React.ReactNode,
 *   as?: 'div' | 'form',             // 'form' so a dialog can submit natively
 *   style?: object,
 *   bodyStyle?: object,
 *   children: React.ReactNode,
 * }} props  — extra props (onSubmit, …) pass through to the window element.
 */
function Modal(props) {
    const rest = Object.assign({}, props);
    ['title', 'icon', 'subtitle', 'tone', 'onClose', 'closeOnBackdrop', 'modeless', 'width', 'layer',
        'footer', 'as', 'style', 'bodyStyle', 'children'].forEach(function (k) { delete rest[k]; });

    const closeOnBackdrop = props.closeOnBackdrop !== false;
    const zIndex = LAYER_Z[props.layer || 1];

    const narrow = useMediaQuery(MODELESS_MIN_WIDTH);
    const floating = !!props.modeless && !narrow;

    const panelRef = React.useRef(null);
    // Drag position lives in a ref, not state: pointermove must not re-render.
    // The component unmounts when the consumer stops rendering it, so the
    // offset resets on close without an effect to do it.
    const dragOffset = React.useRef({ x: 0, y: 0 });

    const onCloseRef = React.useRef(props.onClose);
    onCloseRef.current = props.onClose;

    // Registered for every dialog, closable or not: the topmost window is the
    // one Escape addresses, and one that has no onClose should swallow the key
    // rather than let it close the window underneath it.
    React.useEffect(function () {
        ensureEscListener();
        const close = function () { if (onCloseRef.current) onCloseRef.current(); };
        escStack.push(close);
        return function () {
            const i = escStack.indexOf(close);
            if (i !== -1) escStack.splice(i, 1);
        };
    }, []);

    const transform = function () {
        return 'translate(calc(-50% + ' + dragOffset.current.x + 'px), ' + dragOffset.current.y + 'px)';
    };

    // Unlike erp there is no screen-px → layout-px conversion here: erp has a
    // UI-scale system, this package does not, so the two are the same unit.
    const startDrag = function (e) {
        if (!floating || !panelRef.current) return;
        if (e.target && e.target.closest && e.target.closest('button')) return;
        e.preventDefault();
        const startX = e.clientX;
        const startY = e.clientY;
        const base = { x: dragOffset.current.x, y: dragOffset.current.y };
        const el = panelRef.current;
        const onMove = function (ev) {
            dragOffset.current = { x: base.x + (ev.clientX - startX), y: base.y + (ev.clientY - startY) };
            el.style.transform = transform();
            window.dispatchEvent(new Event(REPOSITION_EVENT));
        };
        const onUp = function () {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
    };

    const floatingStyle = floating
        ? {
            position: 'fixed',
            left: '50%',
            top: FLOAT_TOP,
            transform: transform(),
            zIndex: zIndex,
            // Deeper than the panel shadow `bevel` paints: this one floats over
            // a live page rather than a dimmed one, so it needs the lift to read
            // as being in front rather than part of the layout.
            boxShadow: '4px 4px 14px rgba(0,0,0,0.4)',
            maxHeight: 'calc(100vh - 80px)',
            margin: 0,
        }
        : null;

    const panel = React.createElement(
        props.as === 'form' ? 'form' : 'div',
        Object.assign({
            ref: panelRef,
            role: 'dialog',
            // A modeless window does not trap the page behind it, so claiming
            // aria-modal would lie to a screen reader about what is reachable.
            'aria-modal': floating ? 'false' : 'true',
            style: S.bevel(Object.assign({
                width: props.width || 460,
                maxWidth: '100%',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: S.font,
                fontSize: S.fs.base,
                color: S.cssVar('win-text', '#000000'),
            }, floatingStyle, props.style)),
        }, rest),
        React.createElement(
            'div',
            {
                style: S.titleBar(floating
                    ? { cursor: 'move', touchAction: 'none' }
                    : {}, props.tone),
                onPointerDown: floating ? startDrag : undefined,
            },
            React.createElement(
                'span',
                { style: { display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 } },
                props.icon || null,
                React.createElement(
                    'span',
                    { style: { minWidth: 0 } },
                    React.createElement('span', null, props.title),
                    props.subtitle
                        ? React.createElement(
                            'span',
                            {
                                style: {
                                    display: 'block', fontWeight: 'normal', fontSize: S.fs.sm,
                                    opacity: 0.85, overflow: 'hidden', textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                },
                            },
                            props.subtitle,
                        )
                        : null,
                ),
            ),
            props.onClose
                ? React.createElement(
                    'button',
                    {
                        type: 'button',
                        onClick: props.onClose,
                        'aria-label': 'Close',
                        className: 'terras-btn',
                        // The XP close box: a small raised button in the bar, not a
                        // bare glyph — it has to look pressable against the gradient.
                        style: S.button({
                            padding: 0, width: 16, height: 14, fontSize: S.fs.sm,
                            lineHeight: 1, fontWeight: 'bold', flexShrink: 0,
                        }),
                    },
                    '✕',
                )
                : null,
        ),
        React.createElement(
            'div',
            {
                className: 'terras-scroll',
                style: Object.assign({
                    flex: 1,
                    minHeight: 0,
                    overflow: 'auto',
                    background: S.cssVar('win-face', '#f0f0e8'),
                    padding: 10,
                }, props.bodyStyle),
            },
            props.children,
        ),
        props.footer
            ? React.createElement(
                'div',
                {
                    style: {
                        flexShrink: 0,
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 8px',
                        background: S.cssVar('win-bg', '#ece9d8'),
                        borderTop: '1px solid ' + S.cssVar('win-border-dark', '#808080'),
                    },
                },
                props.footer,
            )
            : null,
    );

    // Modeless: the panel IS the whole render. No backdrop element at all —
    // an invisible full-screen div would still swallow clicks on the page the
    // mode exists to keep usable.
    if (floating) return panel;

    return React.createElement(
        'div',
        {
            style: {
                position: 'fixed',
                inset: 0,
                zIndex: zIndex,
                background: 'rgba(0,0,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
            },
            onMouseDown: function (e) {
                // mouseDown, not click: a click fires on the backdrop when a drag
                // that STARTED inside the dialog (selecting text in a field)
                // happens to end outside it, which closed the form mid-edit.
                if (closeOnBackdrop && e.target === e.currentTarget && props.onClose) props.onClose();
            },
        },
        panel,
    );
}

module.exports = Modal;
module.exports.Modal = Modal;
module.exports.REPOSITION_EVENT = REPOSITION_EVENT;
