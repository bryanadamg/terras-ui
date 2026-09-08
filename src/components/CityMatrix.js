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
// Pitch is NOT a zoom control. Cover-fit shows the grid's full width and an
// aspect-locked band of its height whatever the pitch, so changing it only
// changes dot density: at pitch 7 against a 160-cell grid every grid cell
// painted as a ~2x2 clump of dots (scale 0.58 on a 1080p viewport) and the city
// read as a blown-up blob. Zooming OUT is a property of the grid, not this
// component — regenerate with a larger `--distance`. Keep pitch near the ratio
// that samples about one grid cell per dot: 8 against the shipped 320-cell grid.

const React = require('react');

const DEFAULT_PITCH = 8;
const DEFAULT_DOT = 3;
const DEFAULT_OPACITY = 0.45;
// Level 0 is off. Relative weights of the three lit levels; level 3 is the
// arterial network, level 1 the residential fringe. The spread is wide on
// purpose — evenly spaced alphas over the sign-in blue read as noise rather
// than as a city, because the fringe is most of the dots. Level 3 is only ~3%
// of the shipped grid's lit cells, so it can carry the full alpha without
// lifting the field's overall brightness: the arterials are what make the
// background legible as a map rather than as texture.
const LEVEL_ALPHA = [0, 0.2, 0.4, 1];
// Extra px on the arterial dot. One step is enough to read as a line rather
// than a brighter speck, and it is the same colour, not a second hue — the
// field has exactly one dot colour and three alphas.
const LEVEL_DOT_BONUS = [0, 0, 0, 1];
const BLINK_MS = 900;
// Concurrent blinks as a fraction of lit dots, so the rate reads the same on a
// phone and on a 4K panel instead of frantic on one and dead on the other.
const BLINK_FRACTION = 0.004;
// Below this a dot is erased far enough that lighting it up would only reveal
// the mask. Blinks skip those cells rather than blinking invisibly.
const QUIET_BLINK_FLOOR = 0.25;
// Levels at or below this are dithered onto a checkerboard: every other dot is
// dropped. Class-mode grids light ~60% of their cells, nearly all of it level-1
// residential fabric, and a field that dense stops being a halftone screen and
// becomes a wash — the dots merge into tone at arm's length. Dropping half of
// them restores the gaps that make it read as print, and buys back the contrast
// the form sits on. Levels 2-3 are never dithered: they are lines, and half a
// line is a dashed line.
const DITHER_MAX_LEVEL = 1;
const MIN_BLINKS = 6;

// Mirror --terras-login-dot / --terras-login-dot-blink. Only reached when
// tokens.css isn't loaded, which is why drift here is invisible in every app
// that loads it — keep them in step with the tokens anyway, same rule as
// tokens.json ↔ tokens.css.
const FALLBACK_DOT = '#bcd2f2';
const FALLBACK_BLINK = '#d3e4ff';

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

function clamp01(v, fallback) {
    if (typeof v !== 'number' || !isFinite(v)) return fallback;
    return v < 0 ? 0 : v > 1 ? 1 : v;
}

function readVar(el, name, fallback) {
    if (typeof getComputedStyle !== 'function') return fallback;
    const v = getComputedStyle(el).getPropertyValue(name).trim();
    return v || fallback;
}

/**
 * @param {{
 *   data: {city?: string, w: number, h: number, cells: string},
 *   pitch?: number,        // px between dot centres (default 8)
 *   dotSize?: number,      // px square (default 3)
 *   opacity?: number,      // peak alpha of the brightest level (default 0.45)
 *   color?: string,        // overrides --terras-login-dot
 *   blinkColor?: string,   // overrides --terras-login-dot-blink
 *   blink?: boolean,       // default true; forced off under reduced-motion
 *   quietZones?: Array<{x: number, y: number, rx: number, ry: number, inner?: number, strength?: number}>,
 *   focus?: {x?: number, y?: number},   // 0..1, which part of the grid the crop keeps (default centred)
 *   spanX?: number,        // 0..1 of the canvas width the field covers, anchored left (default 1)
 *   fadeX?: {start?: number, end?: number, strength?: number},  // horizontal taper, fractions of width
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
    // Ellipses, in fractions of the canvas, where the field is faded out so the
    // UI on top of it stays readable. The component does not know where a form
    // sits — the caller does — so this is a shape, not a layout rule.
    const zones = props.quietZones;
    // Which part of the grid the cover-fit crop keeps, 0..1 per axis, centred by
    // default. Only the cropped axis has any slack — cover-fit fills the other
    // one exactly — so on a wide desktop this chooses the horizontal BAND of the
    // city, and on a portrait phone it chooses the column. That is also why it
    // cannot move the dense core out from under the form on desktop: there is no
    // horizontal freedom left to spend.
    const focusX = clamp01(props.focus && props.focus.x, 0.5);
    const focusY = clamp01(props.focus && props.focus.y, 0.5);
    // How much of the canvas the field covers, anchored at the left edge. Under
    // 1 this is the only way to move the city sideways: cover-fit fills the
    // width exactly, so panning has no slack to spend (see `focus`), but fitting
    // into a narrower box does move it — and it crops less vertically as a
    // bonus, because a narrower box needs less scale to cover.
    const spanX = props.spanX > 0 ? Math.min(1, props.spanX) : 1;
    // Horizontal taper. Pair it with spanX so the field's own right edge lands
    // inside the fully-faded part: a lattice that just stops is a visible seam.
    const fadeX = props.fadeX;

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
        // Per-dot survival factor under the quiet zones, 1 where untouched. The
        // base field is faded by one composited gradient per zone, but a blink
        // repaints a single dot and would otherwise pop back to full strength
        // inside the mask — it needs the same number the gradient applied.
        let fades = null;
        let lit = 0;
        // Device-pixel ratio and the snapped px size of a dot at each level, both
        // rebuilt per paint. A halftone screen lives on crisp dots, and at 125%
        // or 150% Windows scaling a 3px dot is 3.75 device px: the browser
        // antialiases the last quarter-pixel on two edges of every dot, which
        // over twenty thousand of them reads as haze rather than as a screen.
        let ratio = 1;
        let sizes = null;
        // Indices of the level 2-3 dots. Blinks are drawn from these rather than
        // from every lit dot: the residential fabric is about 70% of the field,
        // so a uniform pick put nearly every blink in the noise, where it read as
        // stray sparkle. On the arterials the same motion reads as traffic.
        let bright = null;
        let brightCount = 0;
        let frame = 0;
        let active = null;

        function paintAll() {
            const w = canvas.clientWidth;
            const h = canvas.clientHeight;
            if (!w || !h) return;
            ratio = window.devicePixelRatio || 1;
            canvas.width = Math.round(w * ratio);
            canvas.height = Math.round(h * ratio);
            ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
            // A whole number of device pixels, expressed back in the CSS px the
            // transform expects. Never below one device pixel.
            sizes = [0, 0, 0, 0];
            for (let lvl = 1; lvl <= 3; lvl++) {
                sizes[lvl] = Math.max(1, Math.round((dot + LEVEL_DOT_BONUS[lvl]) * ratio)) / ratio;
            }
            ctx.clearRect(0, 0, w, h);

            const fieldW = w * spanX;
            const cols = Math.ceil(fieldW / pitch);
            const rows = Math.ceil(h / pitch);
            // Cover-fit: the smaller ratio consumes fewer grid cells per screen
            // cell, so the city scales up past the viewport and crops.
            const scale = Math.min(data.w / cols, data.h / rows);
            const offX = (data.w - cols * scale) * focusX;
            const offY = (data.h - rows * scale) * focusY;

            xs = new Float32Array(cols * rows);
            ys = new Float32Array(cols * rows);
            lvls = new Uint8Array(cols * rows);
            fades = new Float32Array(cols * rows);
            bright = new Int32Array(cols * rows);
            lit = 0;
            brightCount = 0;

            // MAX over the grid cells a dot covers, not the centre cell's value.
            // Point-sampling at scale > 1 drops whichever cells fall between dot
            // centres, and an arterial is a one-cell-wide line: it came through
            // as a dashed row of specks, which is what made the field read as
            // texture instead of as roads. Taking the max cannot lose a thin
            // bright line, and it only ever brightens — the fringe is already
            // contiguous, so it looks the same.
            for (let r = 0; r < rows; r++) {
                const gy0 = Math.floor(r * scale + offY);
                const gy1 = Math.max(gy0 + 1, Math.floor((r + 1) * scale + offY));
                if (gy1 <= 0 || gy0 >= data.h) continue;
                const yStart = gy0 < 0 ? 0 : gy0;
                const yEnd = gy1 > data.h ? data.h : gy1;
                for (let c = 0; c < cols; c++) {
                    const gx0 = Math.floor(c * scale + offX);
                    const gx1 = Math.max(gx0 + 1, Math.floor((c + 1) * scale + offX));
                    if (gx1 <= 0 || gx0 >= data.w) continue;
                    const xStart = gx0 < 0 ? 0 : gx0;
                    const xEnd = gx1 > data.w ? data.w : gx1;
                    let lvl = 0;
                    for (let gy = yStart; gy < yEnd && lvl < 3; gy++) {
                        const rowBase = gy * data.w;
                        for (let gx = xStart; gx < xEnd; gx++) {
                            const v = levels[rowBase + gx];
                            if (v > lvl) {
                                lvl = v;
                                if (lvl === 3) break;
                            }
                        }
                    }
                    if (!lvl) continue;
                    // Checkerboard in SCREEN space, not grid space: it has to
                    // align to the dot lattice to read as a halftone, and the
                    // grid's cells do not map one-to-one onto dots.
                    if (lvl <= DITHER_MAX_LEVEL && ((c + r) & 1)) continue;
                    // Snapped to the device-pixel grid for the same reason as
                    // the sizes: pitch x ratio is not an integer for every
                    // combination, and a half-pixel origin blurs both edges.
                    const px = Math.round(c * pitch * ratio) / ratio;
                    const py = Math.round(r * pitch * ratio) / ratio;
                    xs[lit] = px;
                    ys[lit] = py;
                    lvls[lit] = lvl;
                    fades[lit] = maskFactor(px, py, w, h);
                    if (lvl >= 2) bright[brightCount++] = lit;
                    lit++;
                }
            }

            // One fillStyle per level instead of per dot — three state changes
            // for the whole field rather than twenty-five thousand.
            for (let lvl = 1; lvl <= 3; lvl++) {
                ctx.globalAlpha = opacity * LEVEL_ALPHA[lvl];
                ctx.fillStyle = base;
                const size = sizes[lvl];
                for (let i = 0; i < lit; i++) {
                    if (lvls[i] === lvl) ctx.fillRect(xs[i], ys[i], size, size);
                }
            }
            ctx.globalAlpha = 1;
            eraseQuietZones(w, h);
            eraseFadeX(w, h);

            if (animate) {
                const n = Math.max(MIN_BLINKS, Math.round(lit * BLINK_FRACTION));
                active = new Array(Math.min(n, lit || 1));
                // Seed off the same clock rAF hands us, so the first frame sees
                // staggered blinks rather than a whole batch already expired.
                const now = performance.now();
                for (let i = 0; i < active.length; i++) active[i] = spawn(now);
            }
        }

        // Same smoothstep the gradients below are sampled from, so a blinking dot
        // under a mask lands on exactly the brightness the base field has there.
        function maskFactor(x, y, w, h) {
            return Math.min(zoneFactor(x, y, w, h), fadeFactor(x, w));
        }

        function fadeFactor(x, w) {
            if (!fadeX) return 1;
            const strength = typeof fadeX.strength === 'number' ? fadeX.strength : 1;
            const start = clamp01(fadeX.start, 0.5) * w;
            const end = clamp01(fadeX.end, 1) * w;
            if (x <= start) return 1;
            if (x >= end || !(end > start)) return 1 - strength;
            const u = (x - start) / (end - start);
            return 1 - strength * (u * u * (3 - 2 * u));
        }

        function zoneFactor(x, y, w, h) {
            if (!zones || !zones.length) return 1;
            let f = 1;
            for (let z = 0; z < zones.length; z++) {
                const zone = zones[z];
                const rx = zone.rx * w;
                const ry = zone.ry * h;
                if (!(rx > 0) || !(ry > 0)) continue;
                const dx = (x - zone.x * w) / rx;
                const dy = (y - zone.y * h) / ry;
                const t = Math.sqrt(dx * dx + dy * dy);
                if (t >= 1) continue;
                const strength = typeof zone.strength === 'number' ? zone.strength : 1;
                const inner = clamp01(zone.inner, 0);
                // Inside `inner` the erase is flat at full strength; a bare
                // smoothstep from the centre only reaches full strength at one
                // point, so a form the size of a real form still sits over dots.
                const u = t <= inner ? 0 : (t - inner) / (1 - inner);
                const factor = 1 - strength * (1 - u * u * (3 - 2 * u));
                if (factor < f) f = factor;
            }
            return f;
        }

        // One composited gradient per zone rather than a per-dot alpha: the base
        // field's whole point is three fillStyle changes for twenty thousand
        // dots, and fading it per dot would put a globalAlpha write on each one.
        // `destination-out` subtracts from what is already painted, so the dots
        // thin out instead of a translucent panel sitting over them.
        function eraseFadeX(w, h) {
            if (!fadeX) return;
            const strength = typeof fadeX.strength === 'number' ? fadeX.strength : 1;
            const start = clamp01(fadeX.start, 0.5) * w;
            const end = clamp01(fadeX.end, 1) * w;
            if (!(end > start)) return;
            ctx.save();
            ctx.globalCompositeOperation = 'destination-out';
            const g = ctx.createLinearGradient(start, 0, end, 0);
            for (let i = 0; i <= 4; i++) {
                const u = i / 4;
                g.addColorStop(u, 'rgba(0,0,0,' + strength * (u * u * (3 - 2 * u)) + ')');
            }
            ctx.fillStyle = g;
            // The whole canvas: a linear gradient clamps to its end stops, so
            // left of `start` nothing is removed and right of `end` all of it is.
            ctx.fillRect(0, 0, w, h);
            ctx.restore();
        }

        function eraseQuietZones(w, h) {
            if (!zones || !zones.length) return;
            for (let z = 0; z < zones.length; z++) {
                const zone = zones[z];
                const rx = zone.rx * w;
                const ry = zone.ry * h;
                if (!(rx > 0) || !(ry > 0)) continue;
                const strength = typeof zone.strength === 'number' ? zone.strength : 1;
                const inner = clamp01(zone.inner, 0);
                ctx.save();
                ctx.globalCompositeOperation = 'destination-out';
                // Drawn as a circle of radius ry in a horizontally scaled space:
                // createRadialGradient has no elliptical form.
                ctx.translate(zone.x * w, zone.y * h);
                ctx.scale(rx / ry, 1);
                // The inner radius is the plateau: a radial gradient paints its
                // start colour solid inside r0, which is exactly the flat
                // full-strength core zoneFactor computes.
                const g = ctx.createRadialGradient(0, 0, inner * ry, 0, 0, ry);
                for (let i = 0; i <= 4; i++) {
                    const t = i / 4;
                    g.addColorStop(t, 'rgba(0,0,0,' + strength * (1 - t * t * (3 - 2 * t)) + ')');
                }
                ctx.fillStyle = g;
                ctx.fillRect(-ry, -ry, 2 * ry, 2 * ry);
                ctx.restore();
            }
        }

        function pick() {
            // A city with no classified roads in frame still has to blink.
            if (!brightCount) return (Math.random() * lit) | 0;
            return bright[(Math.random() * brightCount) | 0];
        }

        function spawn(now) {
            // Rejection sampling against the quiet zones: a handful of tries is
            // cheaper than keeping a second filtered array in step, and a zone
            // covers a small slice of the field, so the first pick almost always
            // lands outside one.
            let i = pick();
            for (let tries = 0; tries < 8 && fades[i] < QUIET_BLINK_FLOOR; tries++) {
                i = pick();
            }
            return { i: i, start: now + Math.random() * BLINK_MS };
        }

        function drawDot(i, alpha, fill) {
            // Its own size, or a blinking arterial would clear 4px and repaint 3.
            const size = sizes[lvls[i]];
            ctx.clearRect(xs[i], ys[i], size, size);
            ctx.globalAlpha = alpha * fades[i];
            ctx.fillStyle = fill;
            ctx.fillRect(xs[i], ys[i], size, size);
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
    }, [data, pitch, dot, opacityProp, blink, color, blinkColor, zones, focusX, focusY, spanX, fadeX]);

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
