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
// Cursor halo. Dots near the pointer grow; their alpha is untouched. A halftone
// screen encodes tone as dot SIZE, so growth is the medium's own gesture — and
// unlike a brightness glow it cannot eat into the contrast the form depends on,
// which matters because the pointer crosses the form on its way to the field.
const HALO_RADIUS = 110;
const HALO_GROW = 2.5;
// A dot does not track the pointer, it is IGNITED by it and then decays on its
// own clock. That is what turns a halo into a trail: the cursor leaves swollen
// dots behind it that settle back over about a third of a second, so the gesture
// has a direction and a wake instead of being a lamp glued to the cursor.
const TRAIL_HALF_LIFE = 240;
// Energy below this is a sub-pixel difference; zero it and let the dot leave the
// active set rather than decaying forever.
const TRAIL_EPSILON = 0.02;
// Peak alpha added at full energy, on top of the dot's rest alpha. Small on
// purpose, and multiplied by the mask like everything else, so a trail crossing
// the form cannot brighten anything the form needs.
const TRAIL_ALPHA_LIFT = 0.18;
// Blinks are chosen by picking this many arterial candidates and keeping the one
// nearest the pointer. Sampling rather than a spatial index: the bias only has
// to be felt, and k=3 pulls the distribution toward the cursor without ever
// starving the rest of the field.
const BLINK_BIAS_SAMPLES = 3;
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
 *   hover?: boolean,       // default true; forced off under reduced-motion and on coarse pointers
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
    const hover = props.hover !== false;
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
        // A coarse pointer has no hover: a touch would light a halo under the
        // finger mid-scroll and leave it there. Reduced motion opts out too.
        const coarse = typeof matchMedia === 'function'
            && matchMedia('(pointer: coarse)').matches;
        const tracking = hover && !reduced && !coarse;

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
        // Cell -> dot index (-1 for an unlit cell). The halo has to find the dots
        // around a pixel position, and the dots sit on a lattice, so this is a
        // lookup rather than a search: iterate the cell rectangle the radius
        // covers and read straight off it.
        let cellAt = null;
        let gridCols = 0;
        let gridRows = 0;
        // Growth currently APPLIED to each dot, in CSS px. Kept per dot so a
        // move only repaints what actually changed, and so the blink loop draws a
        // dot at whatever size the halo has given it.
        let grow = null;
        let pointerX = 0;
        let pointerY = 0;
        let pointerOn = false;
        // Per-dot trail energy, 0..1, and the set of dots that currently carry
        // any. The frame loop walks the active set, not the field: a trail is a
        // few hundred dots and the field is twenty thousand.
        let energy = null;
        let activeIdx = null;
        let activeFlag = null;
        let activeCount = 0;
        let haloFrame = 0;
        // HALO_GROW, clamped so an enlarged dot can never reach its neighbour.
        // A blink clears its own rect, and a rect wider than the pitch would
        // clip the dot next door and leave a notch behind.
        let haloGrow = 0;
        let frame = 0;
        let active = null;
        let lastFrame = 0;

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
            haloGrow = Math.max(0, Math.min(HALO_GROW, pitch - 1 - sizes[3]));
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
            grow = new Float32Array(cols * rows);
            energy = new Float32Array(cols * rows);
            activeIdx = new Int32Array(cols * rows);
            activeFlag = new Uint8Array(cols * rows);
            activeCount = 0;
            cellAt = new Int32Array(cols * rows).fill(-1);
            gridCols = cols;
            gridRows = rows;
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
                    cellAt[r * cols + c] = lit;
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
                // `grow` was just reallocated, so the field and the halo agree
                // that nothing is enlarged until the next pointer frame.
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
            let best = bright[(Math.random() * brightCount) | 0];
            if (!pointerOn) return best;
            // Nearest of k random arterials, so activity drifts toward wherever
            // the cursor is without the far side of the city going quiet.
            let bestD = Infinity;
            for (let k = 0; k < BLINK_BIAS_SAMPLES; k++) {
                const cand = k === 0 ? best : bright[(Math.random() * brightCount) | 0];
                const dx = xs[cand] - pointerX;
                const dy = ys[cand] - pointerY;
                const d = dx * dx + dy * dy;
                if (d < bestD) {
                    bestD = d;
                    best = cand;
                }
            }
            return best;
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

        // A dot's current footprint: its level's size plus whatever the halo has
        // added, grown about its centre so the lattice stays centred on its pitch
        // rather than drifting down and right.
        function footprint(i, g) {
            const size = sizes[lvls[i]] + g;
            const off = g / 2;
            return { x: xs[i] - off, y: ys[i] - off, size: size };
        }

        function restAlpha(i) {
            return opacity * LEVEL_ALPHA[lvls[i]] * fades[i];
        }

        function drawDot(i, alpha, fill) {
            // Its own size, or a blinking arterial would clear 4px and repaint 3.
            const f = footprint(i, grow[i]);
            ctx.clearRect(f.x, f.y, f.size, f.size);
            ctx.globalAlpha = alpha * fades[i];
            ctx.fillStyle = fill;
            ctx.fillRect(f.x, f.y, f.size, f.size);
            ctx.globalAlpha = 1;
        }

        function joinActive(i) {
            if (activeFlag[i]) return;
            activeFlag[i] = 1;
            activeIdx[activeCount++] = i;
        }

        // Light the dots the pointer just swept over. Energy is taken as a MAX,
        // never added: a slow drag over one dot would otherwise pump it far past
        // every other dot in the trail and read as a stuck highlight.
        function igniteTrail() {
            haloFrame = 0;
            if (!lit || !cellAt || !pointerOn) return;
            const reach = Math.ceil(HALO_RADIUS / pitch) + 1;
            const cx = Math.round(pointerX / pitch);
            const cy = Math.round(pointerY / pitch);
            const c0 = Math.max(0, cx - reach);
            const c1 = Math.min(gridCols - 1, cx + reach);
            const r0 = Math.max(0, cy - reach);
            const r1 = Math.min(gridRows - 1, cy + reach);
            for (let r = r0; r <= r1; r++) {
                const rowBase = r * gridCols;
                for (let c = c0; c <= c1; c++) {
                    const i = cellAt[rowBase + c];
                    if (i < 0) continue;
                    const half = sizes[lvls[i]] / 2;
                    const dx = (xs[i] + half - pointerX) / HALO_RADIUS;
                    const dy = (ys[i] + half - pointerY) / HALO_RADIUS;
                    const d = Math.sqrt(dx * dx + dy * dy);
                    if (d >= 1) continue;
                    const t = 1 - d;
                    const e = t * t * (3 - 2 * t);
                    if (e <= energy[i]) continue;
                    energy[i] = e;
                    joinActive(i);
                }
            }
        }

        // One pass over the active set per frame: decay, resize, repaint, and
        // drop whatever has burnt out. Every active dot is repainted rather than
        // only those whose snapped size changed, because the alpha lift moves
        // continuously even when the size holds for a few frames.
        function decayTrails(dt) {
            if (!activeCount) return;
            const k = Math.pow(0.5, dt / TRAIL_HALF_LIFE);
            let keep = 0;
            for (let a = 0; a < activeCount; a++) {
                const i = activeIdx[a];
                let e = energy[i] * k;
                if (e < TRAIL_EPSILON) e = 0;
                energy[i] = e;
                const next = Math.round(haloGrow * e * ratio) / ratio;
                // Clear at whichever footprint is larger, then draw the new one:
                // a shrinking dot otherwise leaves its old edge behind.
                const wide = footprint(i, next > grow[i] ? next : grow[i]);
                ctx.clearRect(wide.x, wide.y, wide.size, wide.size);
                grow[i] = next;
                const f = footprint(i, next);
                const lift = TRAIL_ALPHA_LIFT * e * fades[i];
                const alpha = restAlpha(i) + lift;
                ctx.globalAlpha = alpha > 1 ? 1 : alpha;
                ctx.fillStyle = base;
                ctx.fillRect(f.x, f.y, f.size, f.size);
                ctx.globalAlpha = 1;
                if (e > 0) activeIdx[keep++] = i;
                else activeFlag[i] = 0;
            }
            activeCount = keep;
        }

        function scheduleHalo() {
            if (!haloFrame) haloFrame = requestAnimationFrame(igniteTrail);
        }

        function onPointerMove(e) {
            // The canvas is pointer-events:none under a negative z-index, so the
            // events arrive on the parent and have to be mapped into canvas space.
            const rect = canvas.getBoundingClientRect();
            pointerX = e.clientX - rect.left;
            pointerY = e.clientY - rect.top;
            pointerOn = true;
            scheduleHalo();
        }

        function onPointerLeave() {
            // Nothing to unwind: the trail already decays on its own, so leaving
            // the screen just stops feeding it.
            pointerOn = false;
        }

        function tick(now) {
            // Trails first: a dot that is both trailing and mid-blink must take
            // the blink's alpha, and the blink pass runs after this one.
            const dt = lastFrame ? now - lastFrame : 16;
            lastFrame = now;
            // Capped: a backgrounded tab resumes with a huge delta, and one frame
            // that decays every trail to nothing is better than one that skips
            // the repaint and leaves swollen dots stranded.
            decayTrails(dt > 100 ? 100 : dt);
            if (!active) {
                frame = requestAnimationFrame(tick);
                return;
            }
            for (let k = 0; k < active.length; k++) {
                const b = active[k];
                if (now < b.start) continue;
                const t = (now - b.start) / BLINK_MS;
                if (t >= 1) {
                    drawDot(b.i, opacity * LEVEL_ALPHA[lvls[b.i]], base);
                    // fades[] is applied inside drawDot, so this stays the level's
                    // unmasked rest alpha.
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
            // Runs for tracking too, not just blinks: the decay needs a clock.
            if ((!animate && !tracking) || frame || !lit) return;
            lastFrame = 0;
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

        if (tracking) {
            parent.addEventListener('pointermove', onPointerMove);
            parent.addEventListener('pointerleave', onPointerLeave);
        }

        return function () {
            stop();
            if (haloFrame) cancelAnimationFrame(haloFrame);
            if (tracking) {
                parent.removeEventListener('pointermove', onPointerMove);
                parent.removeEventListener('pointerleave', onPointerLeave);
            }
            if (ro) ro.disconnect();
            else window.removeEventListener('resize', onResize);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [data, pitch, dot, opacityProp, blink, hover, color, blinkColor, zones, focusX, focusY, spanX, fadeX]);

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
