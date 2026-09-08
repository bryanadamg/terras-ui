'use strict';

// Halftone dot-matrix render of a city, for the sign-in field's background.
// Knows nothing about cities: it paints a 2-bit level grid, whatever produced it.
// Grids are generated offline by tools/city-matrix/generate.py — sign-in is
// pre-auth and must paint immediately, so there is no fetch here and never
// should be (same rule as the rest of LoginScreen: no auth, no router, no fetch).
//
// Canvas, not DOM. A full-bleed grid is ~16k dots on a desktop viewport; as
// elements that is a dead page, and as an SVG it is 16k nodes on the one screen
// that must paint fastest. On a canvas the base layer is drawn once and a blink
// repaints only its own 3px rect.
//
// The dot pitch is a CONSTANT, not a fraction of the viewport — a halftone
// screen doesn't resize with the page it's printed on. The city is cover-fit
// into whatever cell count fits, so a wide viewport crops it vertically and a
// tall one crops it horizontally, and no viewport ever shows the grid's edge.
//
// The pitch is also what sets the SAMPLING ratio against the grid's own cell
// count, and that is the part that shows: at pitch 7 a 160-cell grid cover-fits
// a 1080p viewport at scale 0.58, so every grid cell paints as a ~2x2 clump of
// dots and the city reads as a blown-up blob rather than a screen. 11 keeps
// screen cells at roughly one grid cell across desktop widths. Lower it only
// alongside a finer grid (`generate.py --grid`), never on its own.

const React = require('react');

const DEFAULT_PITCH = 11;
const DEFAULT_DOT = 3;
const DEFAULT_OPACITY = 0.42;
// Level 0 is off. Relative weights of the three lit levels; level 3 is the
// arterial network, level 1 the residential fringe. The spread is wide on
// purpose — evenly spaced alphas over the sign-in blue read as noise rather
// than as a city, because the fringe is most of the dots.
const LEVEL_ALPHA = [0, 0.22, 0.55, 1];
const BLINK_MS = 900;
// Concurrent blinks as a fraction of lit dots, so the rate reads the same on a
// phone and on a 4K panel instead of frantic on one and dead on the other.
const BLINK_FRACTION = 0.004;
const MIN_BLINKS = 6;

const FALLBACK_DOT = '#cfe0ff';
const FALLBACK_BLINK = '#dbe9ff';

const decoded = typeof WeakMap === 'function' ? new WeakMap() : null;

/**
 * Unpack the base64 2-bit-per-cell grid into one level per byte.
 * @param {{w: number, h: number, cells: string}} data
 * @returns {Uint8Array}
 */
function decode(data) {
    if (decoded && decoded.has(data)) return decoded.get(data);
    const total = data.w * data.h;
    const out = new Uint8Array(total);
    const bin = atob(data.cells);
    for (let i = 0; i < total; i++) {
        const byte = bin.charCodeAt(i >> 2);
        out[i] = (byte >> (6 - 2 * (i & 3))) & 3;
    }
    if (decoded) decoded.set(data, out);
    return out;
}

function readVar(el, name, fallback) {
    if (typeof getComputedStyle !== 'function') return fallback;
    const v = getComputedStyle(el).getPropertyValue(name).trim();
    return v || fallback;
}

/**
 * @param {{
 *   data: {city?: string, w: number, h: number, cells: string},
 *   pitch?: number,        // px between dot centres (default 11)
 *   dotSize?: number,      // px square (default 3)
 *   opacity?: number,      // peak alpha of the brightest level (default 0.42)
 *   color?: string,        // overrides --terras-login-dot
 *   blinkColor?: string,   // overrides --terras-login-dot-blink
 *   blink?: boolean,       // default true; forced off under reduced-motion
 *   style?: object,
 * }} props
 */
function CityMatrix(props) {
    const ref = React.useRef(null);
    const data = props.data;
    const pitch = props.pitch || DEFAULT_PITCH;
    const dot = props.dotSize || DEFAULT_DOT;
    const opacityProp = props.opacity;
    const blink = props.blink !== false;
    const color = props.color;
    const blinkColor = props.blinkColor;

    React.useEffect(function () {
        const canvas = ref.current;
        if (!canvas || !data || !data.cells) return;
        const parent = canvas.parentNode;
        if (!parent) return;

        const ctx = canvas.getContext('2d');
        const levels = decode(data);
        const base = color || readVar(canvas, '--terras-login-dot', FALLBACK_DOT);
        const peak = blinkColor || readVar(canvas, '--terras-login-dot-blink', FALLBACK_BLINK);
        const opacity = typeof opacityProp === 'number'
            ? opacityProp
            : parseFloat(readVar(canvas, '--terras-login-dot-opacity', '')) || DEFAULT_OPACITY;

        const reduced = typeof matchMedia === 'function'
            && matchMedia('(prefers-reduced-motion: reduce)').matches;
        const animate = blink && !reduced;

        // Screen-space lit dots, rebuilt on every resize. Parallel arrays rather
        // than objects: this is the array the blink loop indexes into 60x/sec.
        let xs = null;
        let ys = null;
        let lvls = null;
        let lit = 0;
        let frame = 0;
        let active = null;

        function paintAll() {
            const w = canvas.clientWidth;
            const h = canvas.clientHeight;
            if (!w || !h) return;
            const dpr = window.devicePixelRatio || 1;
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, w, h);

            const cols = Math.ceil(w / pitch);
            const rows = Math.ceil(h / pitch);
            // Cover-fit: the smaller ratio consumes fewer grid cells per screen
            // cell, so the city scales up past the viewport and crops.
            const scale = Math.min(data.w / cols, data.h / rows);
            const offX = (data.w - cols * scale) / 2;
            const offY = (data.h - rows * scale) / 2;

            xs = new Float32Array(cols * rows);
            ys = new Float32Array(cols * rows);
            lvls = new Uint8Array(cols * rows);
            lit = 0;

            for (let r = 0; r < rows; r++) {
                const gy = Math.floor((r + 0.5) * scale + offY);
                if (gy < 0 || gy >= data.h) continue;
                const rowBase = gy * data.w;
                for (let c = 0; c < cols; c++) {
                    const gx = Math.floor((c + 0.5) * scale + offX);
                    if (gx < 0 || gx >= data.w) continue;
                    const lvl = levels[rowBase + gx];
                    if (!lvl) continue;
                    xs[lit] = c * pitch;
                    ys[lit] = r * pitch;
                    lvls[lit] = lvl;
                    lit++;
                }
            }

            // One fillStyle per level instead of per dot — three state changes
            // for the whole field rather than twenty-five thousand.
            for (let lvl = 1; lvl <= 3; lvl++) {
                ctx.globalAlpha = opacity * LEVEL_ALPHA[lvl];
                ctx.fillStyle = base;
                for (let i = 0; i < lit; i++) {
                    if (lvls[i] === lvl) ctx.fillRect(xs[i], ys[i], dot, dot);
                }
            }
            ctx.globalAlpha = 1;

            if (animate) {
                const n = Math.max(MIN_BLINKS, Math.round(lit * BLINK_FRACTION));
                active = new Array(Math.min(n, lit || 1));
                // Seed off the same clock rAF hands us, so the first frame sees
                // staggered blinks rather than a whole batch already expired.
                const now = performance.now();
                for (let i = 0; i < active.length; i++) active[i] = spawn(now);
            }
        }

        function spawn(now) {
            return { i: (Math.random() * lit) | 0, start: now + Math.random() * BLINK_MS };
        }

        function drawDot(i, alpha, fill) {
            ctx.clearRect(xs[i], ys[i], dot, dot);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = fill;
            ctx.fillRect(xs[i], ys[i], dot, dot);
            ctx.globalAlpha = 1;
        }

        function tick(now) {
            for (let k = 0; k < active.length; k++) {
                const b = active[k];
                if (now < b.start) continue;
                const t = (now - b.start) / BLINK_MS;
                if (t >= 1) {
                    drawDot(b.i, opacity * LEVEL_ALPHA[lvls[b.i]], base);
                    active[k] = spawn(now);
                    continue;
                }
                // Up then down, so a blink has no hard edge at either end. The
                // peak colour rides the whole ramp: switching colour partway
                // would be a visible step, and at low alpha the two are a dozen
                // levels apart per channel anyway.
                const ramp = Math.sin(Math.PI * t);
                const rest = opacity * LEVEL_ALPHA[lvls[b.i]];
                drawDot(b.i, rest + (1 - rest) * ramp, peak);
            }
            frame = requestAnimationFrame(tick);
        }

        function start() {
            if (!animate || frame || !lit) return;
            frame = requestAnimationFrame(tick);
        }

        function stop() {
            if (frame) cancelAnimationFrame(frame);
            frame = 0;
        }

        function onResize() {
            stop();
            paintAll();
            start();
        }

        // A background animation on a hidden tab is pure battery cost.
        function onVisibility() {
            if (document.hidden) stop();
            else start();
        }

        paintAll();
        start();

        let ro = null;
        if (typeof ResizeObserver === 'function') {
            ro = new ResizeObserver(onResize);
            ro.observe(parent);
        } else {
            window.addEventListener('resize', onResize);
        }
        document.addEventListener('visibilitychange', onVisibility);

        return function () {
            stop();
            if (ro) ro.disconnect();
            else window.removeEventListener('resize', onResize);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [data, pitch, dot, opacityProp, blink, color, blinkColor]);

    if (!data || !data.cells) return null;

    return React.createElement('canvas', {
        ref: ref,
        'aria-hidden': 'true',
        style: Object.assign({
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            display: 'block',
            pointerEvents: 'none',
        }, props.style),
    });
}

CityMatrix.decode = decode;

module.exports = CityMatrix;
module.exports.CityMatrix = CityMatrix;
module.exports.decode = decode;
