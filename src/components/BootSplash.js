'use client';
'use strict';

// Boot screen for the case where there is no chrome to draw yet — the sign-in
// route and an Electron cold start. Mirrors terras-erp's `BootSplash.tsx`.
// An authenticated route that already has a frame should paint that frame with
// a loading state instead; this component covers the whole viewport because at
// the moment it runs there is nothing underneath it to cover.
//
// Classic beige, NOT the sign-in screen's deep blue: the splash stands in for
// the app frame that hasn't painted yet, so it wears the app's face.
//
// The bar is determinate because the boot sequence is a fixed, ordered set of
// awaited checkpoints, not because a timer is animating it. Set each phase on
// its own render pass so the step it names actually paints. The last step is
// terminal — the component unmounts at that point and never shows 100%.

const React = require('react');
const S = require('./styles');

// Two timing guards, both standard and both load-bearing. See useBootIndicator.
const SHOW_DELAY = 250;
const MIN_VISIBLE = 400;

const DEFAULT_STEPS = [
    { phase: 'hydrating', label: 'Loading interface' },
    { phase: 'session', label: 'Restoring session' },
    { phase: 'verifying', label: 'Verifying account' },
    { phase: 'ready', label: 'Ready' },
];

/**
 * Gates the splash on the two timing guards below. Call it unconditionally with
 * "is the app still booting", then render the splash only while it returns
 * true — and render NOTHING when it is false but boot is still running. That
 * sub-250ms window is exactly what the first guard exists to keep empty.
 *
 *  - SHOW_DELAY: a boot that resolves faster than this shows nothing at all. A
 *    warm start with no stored token finishes in a few ms, and flashing a splash
 *    across it makes the app feel slower than saying nothing would.
 *  - MIN_VISIBLE: once shown, it stays up at least this long. A splash that
 *    appears and vanishes inside two frames reads as a glitch.
 *
 * The min-visible floor can't live inside the component: the caller unmounts it
 * the moment boot resolves, so whoever decides to render it has to hold it.
 *
 * @param {boolean} active
 * @returns {boolean}
 */
function useBootIndicator(active) {
    const state = React.useState(false);
    const visible = state[0];
    const setVisible = state[1];
    const shownAt = React.useRef(0);

    React.useEffect(function () {
        if (active) {
            if (visible) return;
            const t = setTimeout(function () {
                shownAt.current = Date.now();
                setVisible(true);
            }, SHOW_DELAY);
            return function () { clearTimeout(t); };
        }
        if (!visible) return;
        const remaining = Math.max(0, MIN_VISIBLE - (Date.now() - shownAt.current));
        if (remaining === 0) {
            setVisible(false);
            return;
        }
        const t = setTimeout(function () { setVisible(false); }, remaining);
        return function () { clearTimeout(t); };
    }, [active, visible]);

    return visible;
}

/**
 * @param {{
 *   phase: string,                                    // matches one `steps[].phase`
 *   steps?: Array<{phase: string, label: string}>,    // default: the four erp boot checkpoints
 *   appName?: string,
 *   subtitle?: string,
 *   style?: object,
 * }} props
 */
function BootSplash(props) {
    const steps = props.steps && props.steps.length ? props.steps : DEFAULT_STEPS;
    // An unrecognised phase falls to the first step rather than to -1, so a
    // mistyped or not-yet-set phase shows "starting", never a negative bar.
    const found = steps.findIndex(function (s) { return s.phase === props.phase; });
    const idx = Math.max(0, found);
    const step = steps[idx];
    const pct = ((idx + 1) / steps.length) * 100;

    return React.createElement(
        'div',
        {
            style: Object.assign({
                position: 'fixed',
                inset: 0,
                background: S.cssVar('boot-bg', '#ece9d8'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: S.font,
                userSelect: 'none',
            }, props.style),
        },
        React.createElement(
            'div',
            { style: { width: 300, textAlign: 'center' } },
            React.createElement(
                'div',
                {
                    style: {
                        fontSize: 15, fontWeight: 'bold', marginBottom: 2,
                        color: S.cssVar('boot-title', '#1a3d90'),
                    },
                },
                props.appName || 'Terras',
            ),
            React.createElement(
                'div',
                {
                    style: {
                        fontSize: S.fs.base, marginBottom: 14,
                        color: S.cssVar('boot-sub', '#5a6470'),
                    },
                },
                props.subtitle || 'Starting…',
            ),
            React.createElement(
                'div',
                {
                    role: 'progressbar',
                    'aria-valuemin': 0,
                    'aria-valuemax': steps.length,
                    'aria-valuenow': idx + 1,
                    'aria-label': step.label,
                    // The recessed track + flat blue fill of erp's ProgressBar at
                    // tone="blue". Painted inline rather than pulled up into
                    // styles.js: this is the only bar the package draws, and a
                    // one-call-site primitive would be a face nothing composes.
                    style: {
                        border: '1px solid ' + S.cssVar('boot-track-border', '#7f9db9'),
                        borderRadius: S.cssVar('radius-btn', '3px'),
                        height: 14,
                        background: S.cssVar('boot-track', '#e9e9e9'),
                        overflow: 'hidden',
                    },
                },
                React.createElement('div', {
                    style: {
                        height: '100%',
                        width: pct + '%',
                        background: S.cssVar('status-blue', '#0058e6'),
                        transition: 'width 0.2s',
                    },
                }),
            ),
            React.createElement(
                'div',
                {
                    style: {
                        display: 'flex', justifyContent: 'space-between',
                        marginTop: 6, fontSize: S.fs.base,
                        color: S.cssVar('boot-text', '#33393f'),
                    },
                },
                React.createElement('span', null, step.label + '…'),
                React.createElement(
                    'span',
                    {
                        style: {
                            fontVariantNumeric: 'tabular-nums',
                            color: S.cssVar('boot-sub', '#5a6470'),
                        },
                    },
                    (idx + 1) + ' of ' + steps.length,
                ),
            ),
        ),
    );
}

BootSplash.useBootIndicator = useBootIndicator;
BootSplash.DEFAULT_STEPS = DEFAULT_STEPS;

module.exports = BootSplash;
module.exports.BootSplash = BootSplash;
module.exports.useBootIndicator = useBootIndicator;
module.exports.DEFAULT_STEPS = DEFAULT_STEPS;
