'use strict';

// Transient feedback: the channel between an inline error (which belongs in the
// form that caused it) and a modal (which demands an answer). A mutation fired
// from a toolbar has nowhere else to report — pressing Save moved a row on the
// server and said nothing on screen.
//
// NOT for anything the user must act on. A toast that asks a question is a
// Modal wearing the wrong chrome; a toast carrying a validation message is an
// inline error that got lost.
//
// Merged from teras-erp's `shared/Toast.tsx` and terras-sku's local `ui/toast.tsx`.
// erp brought the progress toast; sku brought the close button, the visible cap,
// the per-tone durations and the role/aria split. Both keep their behaviour —
// the point of consolidating is that neither app loses what it had.
//
// Tones are the COLOUR words (`ToggleTone`, verbatim), not erp's
// success/danger/warning/info, because every other tone vocabulary in this
// package is colour words. The named methods below are what erp's call sites
// migrate onto, so nothing there re-decides a semantic.

const React = require('react');
const S = require('./styles');
const ProgressBar = require('./ProgressBar');

// Four at once is already more than anybody reads; past that the oldest goes. A
// queue would be worse — feedback that arrives after the action it describes has
// scrolled out of mind is noise.
const MAX_VISIBLE = 4;

// An error is read, not glanced at, so it stays roughly twice as long. Neither
// is a deadline: the close button is always there.
const DURATION = { green: 4000, blue: 4000, amber: 6000, red: 7000 };

const TONE_COLOR = {
    green: S.cssVar('status-green', '#2d7a2d'),
    red: S.cssVar('status-red', '#c00000'),
    amber: S.cssVar('status-amber', '#b8860b'),
    blue: S.cssVar('status-blue', '#0058e6'),
};

// Fallback marks. erp draws these with bootstrap-icons and sku with lucide, and
// this package ships neither — so `icons` is a slot and these are what arrives
// when it is empty. Text, not a bundled SVG set: a wrong-looking icon is worse
// than a plain mark, and every app that cares passes its own.
const TONE_GLYPH = { green: '✓', red: '✕', amber: '!', blue: 'i' };

const ToastContext = React.createContext(null);

function useToast() {
    const ctx = React.useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used inside a ToastProvider');
    return ctx;
}

/**
 * @param {{ icons?: object, children?: React.ReactNode }} props
 *   `icons` maps a tone to a node — `{green, red, amber, blue}`. Any tone left
 *   out falls back to a text glyph.
 */
function ToastProvider(props) {
    const [toasts, setToasts] = React.useState([]);
    const nextId = React.useRef(1);
    // Timers live outside state so dismissing one doesn't reschedule the rest,
    // and so an unmount mid-flight doesn't leave a setState firing into nothing.
    const timers = React.useRef(new Map());

    const dismiss = React.useCallback((id) => {
        const timer = timers.current.get(id);
        if (timer) { clearTimeout(timer); timers.current.delete(id); }
        setToasts((current) => current.filter((t) => t.id !== id));
    }, []);

    const arm = React.useCallback((id, tone) => {
        timers.current.set(id, setTimeout(() => dismiss(id), DURATION[tone] || DURATION.blue));
    }, [dismiss]);

    // The cap drops the OLDEST, but never a sticky one. A progress toast is the
    // record of a job that is still running: dropping it because four notices
    // arrived while it worked would strand that job with no UI at all.
    const push = React.useCallback((toast) => setToasts((current) => {
        const next = current.concat(toast);
        if (next.length <= MAX_VISIBLE) return next;
        let over = next.length - MAX_VISIBLE;
        return next.filter((t) => {
            if (over > 0 && !t.sticky) { over -= 1; return false; }
            return true;
        });
    }), []);

    const show = React.useCallback((message, tone) => {
        const t = DURATION[tone] ? tone : 'green';
        const id = nextId.current;
        nextId.current += 1;
        push({ id: id, tone: t, message: message });
        arm(id, t);
        return id;
    }, [push, arm]);

    // One toast created up front and mutated in place, instead of a toast per
    // completed unit of work. Sticky until it finishes or fails, so neither the
    // dismiss timer nor the cap can take it while the job is still running.
    const progress = React.useCallback((message, detail) => {
        const id = nextId.current;
        nextId.current += 1;
        push({ id: id, tone: 'blue', message: message, progress: 0, detail: detail, sticky: true });

        const patch = (fields) => setToasts((current) =>
            current.map((t) => (t.id === id ? Object.assign({}, t, fields) : t)));

        const settle = (finalMessage, tone) => {
            patch({ message: finalMessage, tone: tone, progress: null, detail: undefined, sticky: false });
            arm(id, tone);
        };

        return {
            update: (pct, nextDetail) => patch(Object.assign(
                { progress: Math.max(0, Math.min(100, pct)) },
                nextDetail === undefined ? null : { detail: nextDetail },
            )),
            finish: (finalMessage, tone) => settle(finalMessage, DURATION[tone] ? tone : 'green'),
            fail: (finalMessage) => settle(finalMessage, 'red'),
            dismiss: () => dismiss(id),
        };
    }, [push, arm, dismiss]);

    React.useEffect(() => {
        const pending = timers.current;
        return () => { pending.forEach(clearTimeout); pending.clear(); };
    }, []);

    const api = React.useMemo(() => ({
        show: show,
        success: (message) => show(message, 'green'),
        error: (message) => show(message, 'red'),
        warn: (message) => show(message, 'amber'),
        info: (message) => show(message, 'blue'),
        progress: progress,
        dismiss: dismiss,
    }), [show, progress, dismiss]);

    return React.createElement(
        ToastContext.Provider,
        { value: api },
        props.children,
        toasts.length === 0 ? null : React.createElement(
            'div',
            { className: 'terras-toast-viewport' },
            toasts.map((toast) => React.createElement(ToastPanel, {
                key: toast.id,
                toast: toast,
                icons: props.icons,
                onDismiss: () => dismiss(toast.id),
            })),
        ),
    );
}

// Position, stacking and entrance live in chrome.css (`.terras-toast-viewport` /
// `.terras-toast`): the z-index wants a `var()` and the entrance wants a
// keyframe, neither of which an inline style object can hold. The face itself
// stays inline on the shared `panel()` — motion there, paint here.
function ToastPanel(props) {
    const toast = props.toast;
    const color = TONE_COLOR[toast.tone] || TONE_COLOR.blue;
    const icon = (props.icons && props.icons[toast.tone]) || React.createElement(
        'span',
        { style: { color: color, fontWeight: 'bold', lineHeight: 1 }, 'aria-hidden': 'true' },
        TONE_GLYPH[toast.tone] || TONE_GLYPH.blue,
    );

    return React.createElement(
        'div',
        {
            className: 'terras-toast',
            // An error interrupts a screen reader; everything else waits its
            // turn — the same split the durations above make visually.
            role: toast.tone === 'red' ? 'alert' : 'status',
            'aria-live': toast.tone === 'red' ? 'assertive' : 'polite',
            // The shared bevelled panel, not a local card: a rounded shadowed
            // toast is the generic-framework tell the rest of this package
            // avoids. Only the tone stripe is this component's own.
            style: S.panel({
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 6,
                padding: '6px 6px 6px 8px',
                borderLeft: '3px solid ' + color,
                fontFamily: S.font,
                fontSize: S.fs.base,
                color: S.cssVar('win-text', '#000000'),
                boxShadow: S.cssVar('shadow-pop', '0 2px 8px rgba(0,0,0,0.22)'),
            }),
        },
        React.createElement('span', { style: { flexShrink: 0, marginTop: 1, display: 'flex' } }, icon),
        React.createElement(
            'div',
            { style: { flex: 1, minWidth: 0 } },
            toast.message,
            toast.progress == null ? null : React.createElement(
                'div',
                { style: { marginTop: 4 } },
                React.createElement(ProgressBar, { pct: toast.progress, tone: 'blue', height: 10, label: 'outside' }),
                !toast.detail ? null : React.createElement(
                    'div',
                    { style: { fontSize: S.fs.sm, opacity: 0.8, marginTop: 2 } },
                    toast.detail,
                ),
            ),
        ),
        React.createElement(
            'button',
            {
                type: 'button',
                onClick: props.onDismiss,
                title: 'Dismiss',
                'aria-label': 'Dismiss',
                // Not a `Button`: the shared one is a raised bevel, and a raised
                // button inside a raised panel reads as a second surface. This is
                // the title bar's close affordance at toast scale.
                style: {
                    flexShrink: 0, display: 'flex', padding: 0, border: 'none',
                    background: 'none', color: S.cssVar('win-text-3', '#666666'),
                    cursor: 'pointer', fontFamily: S.font, fontSize: S.fs.base, lineHeight: 1,
                },
            },
            '✕',
        ),
    );
}

module.exports = ToastProvider;
module.exports.ToastProvider = ToastProvider;
module.exports.useToast = useToast;
module.exports.ToastContext = ToastContext;
