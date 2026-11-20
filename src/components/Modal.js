'use client';
'use strict';

// Classic dialog: dimmed backdrop + a floating window with a blue title bar, a
// scrolling body, and a footer action strip. Mirrors terras-erp's ModalWrapper /
// ModalFooterActions.
//
// It wears the page's chrome one z-layer up — that is the point. Under classic
// that is Sapphire Frost: `Window`'s flat accent title bar, framed like erp's
// inset page card (one 1px edge, not the 2px bevel) on the sidebar's cool
// near-white. A dialog that borrows a different look from the page behind it
// reads as a second design language on one screen — a rounded white card over
// XP chrome did, and so did a beige XP bevel over the Frost page.
//
// Not a portal: it renders where it is mounted and relies on the modal z-index
// tokens instead. Consuming apps mount dialogs at page level, so it buys
// nothing here. (`Combobox` does portal — a popup has to escape this dialog's
// scrolling body — which is why react-dom is a peer dependency now.)
//
// `modeless` is the second mode (erp's ModalWrapper prop of the same name): no
// backdrop, the page behind stays interactive, and the panel is dragged by its
// title bar. It is what erp uses for creation/edit forms, so a user can keep
// reading the list underneath while filling one in.

const React = require('react');
const S = require('./styles');
const WindowCloseButton = require('./WindowCloseButton');
const scale = require('../scale');

const LAYER_Z = {
    1: S.cssVar('z-modal-1', '20000'),
    2: S.cssVar('z-modal-2', '20100'),
    3: S.cssVar('z-modal-3', '20200'),
};

// The four edge colours `S.bevel` paints — the frame outside classic, where no
// --terras-modal-border-color is declared. Must stay identical to styles.js.
const BEVEL_EDGES = S.cssVar('bevel-border-light', '#dfdfdf') + ' ' + S.cssVar('bevel-border-dark', '#808080') + ' '
    + S.cssVar('bevel-border-dark', '#808080') + ' ' + S.cssVar('bevel-border-light', '#dfdfdf');

// Classic only: no --terras-modal-title-dots elsewhere, so the layer is empty.
// The field also ends just short of the close box, so the ghost box sits on a
// clean square of band — of whatever tone — instead of framing a patch of dots.
// ponytail: 30-36px = the bar's 8px right padding + the 21px close box + a gap;
// re-measure if either changes.
const DOTS_MASK = 'linear-gradient(to right, transparent 40%, #000 70%, #000 calc(100% - 36px), transparent calc(100% - 30px))';
const TITLE_DOTS = {
    position: 'absolute',
    inset: 0,
    zIndex: -1,
    pointerEvents: 'none',
    background: S.cssVar('modal-title-dots', 'none'),
    WebkitMaskImage: DOTS_MASK,
    maskImage: DOTS_MASK,
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

// What Tab can land on inside a blocking dialog.
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), '
    + 'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

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

    // Focus moves into the dialog on open (unless a child already took it via
    // autoFocus, which commits before this effect) and back to whatever opened
    // it on close, so a keyboard user isn't left stranded behind the backdrop.
    React.useEffect(function () {
        const prev = document.activeElement;
        const el = panelRef.current;
        if (el && !el.contains(document.activeElement)) el.focus({ preventScroll: true });
        return function () {
            if (prev && prev.focus && document.contains(prev)) prev.focus({ preventScroll: true });
        };
    }, []);

    // A blocking dialog keeps Tab inside itself; aria-modal promises as much.
    const trapTab = function (e) {
        if (e.key !== 'Tab' || !panelRef.current) return;
        const nodes = panelRef.current.querySelectorAll(FOCUSABLE);
        if (!nodes.length) { e.preventDefault(); return; }
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || active === panelRef.current)) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
    };

    // A drag in flight when the dialog unmounts must not leave its window
    // listeners behind.
    const endDrag = React.useRef(null);
    React.useEffect(function () {
        return function () { if (endDrag.current) endDrag.current(); };
    }, []);

    const transform = function () {
        return 'translate(calc(-50% + ' + dragOffset.current.x + 'px), ' + dragOffset.current.y + 'px)';
    };

    // Pointer deltas arrive in SCREEN px; `transform: translate()` is written in
    // LAYOUT px. Under an interface scale those differ by the zoom factor, and
    // the panel would outrun the cursor by 1/zoom (25% at 80%). Convert once,
    // on the delta — see ../scale.js.
    const startDrag = function (e) {
        if (!floating || !panelRef.current) return;
        if (e.target && e.target.closest && e.target.closest('button')) return;
        e.preventDefault();
        const startX = e.clientX;
        const startY = e.clientY;
        const base = { x: dragOffset.current.x, y: dragOffset.current.y };
        const el = panelRef.current;
        const onMove = function (ev) {
            dragOffset.current = {
                x: base.x + scale.toLayoutPx(ev.clientX - startX),
                y: base.y + scale.toLayoutPx(ev.clientY - startY),
            };
            el.style.transform = transform();
            window.dispatchEvent(new Event(REPOSITION_EVENT));
        };
        const onUp = function () {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('pointercancel', onUp);
            endDrag.current = null;
        };
        endDrag.current = onUp;
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
    };

    const floatingStyle = floating
        ? {
            position: 'fixed',
            left: '50%',
            top: FLOAT_TOP,
            transform: transform(),
            zIndex: zIndex,
            // Deeper than a blocking dialog's shadow: this one floats over a
            // live page rather than a dimmed one, so it needs the lift to read
            // as being in front rather than part of the layout.
            boxShadow: S.cssVar('modal-shadow-float', '4px 4px 14px rgba(0,0,0,0.4)'),
            // --terras-app-vh, not a raw 100vh: a root zoom does NOT rescale
            // viewport units, so a bare 100vh is the window height in layout px
            // and the dialog would cap at (zoom x window). Same hook LoginScreen
            // sizes against; falls back to the real unit in an app that doesn't
            // scale. See ../scale.js.
            maxHeight: 'calc(' + S.cssVar('app-vh', '100vh') + ' - 80px)',
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
            tabIndex: -1,
            onKeyDown: floating ? undefined : trapTab,
            style: S.bevel(Object.assign({
                // Framed like the page card (one 1px edge) under classic; each
                // fallback is exactly what `bevel` paints, so other themes keep
                // the bevel. floatingStyle/props.style merge after and still win.
                borderWidth: S.cssVar('modal-border-width', '2px'),
                borderColor: S.cssVar('modal-border-color', BEVEL_EDGES),
                boxShadow: S.cssVar('modal-shadow', S.cssVar('shadow-panel', '2px 2px 4px rgba(0,0,0,0.3)')),
                outline: 'none',
                width: props.width || 460,
                maxWidth: '100%',
                maxHeight: 'calc(' + S.cssVar('app-vh', '100vh') + ' * 90 / 100)',
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
                    ? { cursor: 'move', touchAction: 'none', position: 'relative', isolation: 'isolate' }
                    : { position: 'relative', isolation: 'isolate' }, props.tone),
                onPointerDown: floating ? startDrag : undefined,
            },
            // erp's header dot matrix, masked in from 40% of the width rather than
            // faded with the band colour, so it works on every tone. zIndex -1
            // inside the isolated bar = above the band, below the title and close
            // box. No pointer events, so a modeless drag still starts on the bar.
            React.createElement('span', { 'aria-hidden': true, style: TITLE_DOTS }),
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
            // The shared close box, not a local one: erp paints the SAME button in
            // its dialogs and its print previews, and the one place that rolled
            // its own is the drift that component exists to end.
            props.onClose
                ? React.createElement(WindowCloseButton, { onClose: props.onClose })
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
                    background: S.cssVar('modal-bg', S.cssVar('win-face', '#f0f0e8')),
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
                        background: S.cssVar('modal-footer-bg', S.cssVar('win-bg', '#ece9d8')),
                        borderTop: '1px solid ' + S.cssVar('modal-footer-border', S.cssVar('win-border-dark', '#808080')),
                    },
                },
                props.footer,
            )
            : null,
    );

    // The panel always sits under the same wrapper, so the media query flipping
    // a modeless dialog to blocking on its first effect (narrow screens) doesn't
    // remount the panel — that dropped the focus the effect above had just set.
    // Modeless: the wrapper is `display: contents`, i.e. no box at all — a
    // full-screen div, even an invisible one, would swallow clicks on the page
    // the mode exists to keep usable.
    return React.createElement(
        'div',
        floating
            ? { style: { display: 'contents' } }
            : {
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
                    // preventDefault: the press would otherwise move focus to
                    // <body> AFTER the close has handed it back to the opener.
                    if (closeOnBackdrop && e.target === e.currentTarget && props.onClose) {
                        e.preventDefault();
                        props.onClose();
                    }
                },
            },
        panel,
    );
}

module.exports = Modal;
module.exports.Modal = Modal;
module.exports.REPOSITION_EVENT = REPOSITION_EVENT;
