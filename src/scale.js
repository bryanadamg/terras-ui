'use strict';

// Interface scale: the state half. The CSS half is src/tokens/scale.css —
// import both or neither.
//
// Two jobs in here:
//
// 1. Owning the scale value (the list, the default, the localStorage key, the
//    <html> attribute). An app supplies only the picker UI and, for an SSR app,
//    the pre-paint injection point.
//
// 2. Unit helpers. Under a root `zoom` the DOM's pixel APIs split into two
//    different units, and mixing them silently misplaces things by the zoom
//    factor:
//
//      SCREEN px (divided by zoom already — what the user physically sees)
//        getBoundingClientRect(), MouseEvent.clientX/Y, window.innerWidth/Height,
//        window.scrollX/Y, PointerEvent.movementX/Y
//
//      LAYOUT px (the unit every CSS length is written in, then multiplied by zoom)
//        clientHeight/offsetHeight/scrollHeight, getComputedStyle() values,
//        and anything you assign to style.top / style.width / a React style prop
//
//    So a popup positioned with `top: rect.bottom` lands at 80% of the way down
//    the page at 80% scale. Convert first: `top: toLayoutPx(rect.bottom)`.
//
//    Verified in Chrome — at zoom 0.8 a 100px box measures 80 via
//    getBoundingClientRect but still reports clientHeight 100.
//
// Ported from terras-erp's components/shared/uiScale.ts, which is the source of
// truth for the behaviour.

// The scale steps, as percentages. erp's set; the apps were drawn dense enough
// that the browser's 100% looks oversized on a desktop monitor, and 80% is what
// everyone was reaching for manually with Ctrl+minus.
const UI_SCALES = [70, 75, 80, 90, 100, 110];
const DEFAULT_UI_SCALE = 80;
const STORAGE_KEY = 'ui_scale';
const ATTRIBUTE = 'data-ui-scale';

/** Coerce anything (a stored string, a stale value from an older build) onto the list. */
function normalizeScale(value) {
    const n = Number(value);
    return UI_SCALES.indexOf(n) === -1 ? DEFAULT_UI_SCALE : n;
}

/** The stored scale, or the default. Safe in SSR and with storage disabled. */
function readUiScale() {
    if (typeof localStorage === 'undefined') return DEFAULT_UI_SCALE;
    try {
        return normalizeScale(localStorage.getItem(STORAGE_KEY));
    } catch (e) {
        return DEFAULT_UI_SCALE;
    }
}

/**
 * Persist a scale and stamp it on <html>. Returns the value actually applied.
 *
 * In an SPA this is also the pre-paint hook: call it at the top of the entry
 * module. Nothing has painted yet — the root element is still empty — so there
 * is no flash to avoid and no need for `bootScript`.
 */
function applyUiScale(scale) {
    const n = normalizeScale(scale);
    if (typeof localStorage !== 'undefined') {
        try { localStorage.setItem(STORAGE_KEY, String(n)); } catch (e) { /* private mode */ }
    }
    if (typeof document !== 'undefined') {
        document.documentElement.setAttribute(ATTRIBUTE, String(n));
    }
    return n;
}

/**
 * The same thing as a self-contained string, for an app that server-renders
 * markup and would otherwise paint one frame at full size before hydrating.
 * Inline it in <head> ahead of everything else (Next: a <script> with
 * dangerouslySetInnerHTML; that page's <html> then needs suppressHydrationWarning,
 * since the server markup can't know about the attribute).
 *
 * Built from the constants above rather than hand-written, so the list cannot
 * drift from the one this module and scale.css agree on.
 */
const bootScript =
    '(function(){try{var s=Number(localStorage.getItem(' + JSON.stringify(STORAGE_KEY) + '));' +
    'if(' + JSON.stringify(UI_SCALES) + '.indexOf(s)<0)s=' + DEFAULT_UI_SCALE + ';' +
    'document.documentElement.setAttribute(' + JSON.stringify(ATTRIBUTE) + ',String(s));}' +
    'catch(e){document.documentElement.setAttribute(' + JSON.stringify(ATTRIBUTE) + ',' + JSON.stringify(String(DEFAULT_UI_SCALE)) + ');}})();';

let zoomProbe = null;

/**
 * Fixed-layout-width probe pinned to <html>, used to measure zoom directly
 * instead of parsing getComputedStyle(...).zoom — older Chromium serializes
 * that computed value as a percentage string ("80%") rather than a unitless
 * number ("0.8"), which silently becomes NaN through Number() and disables the
 * zoom correction everywhere (every floating menu drifts by the scale factor).
 * The probe's screen-px width divided by its authored layout width is the zoom
 * ratio by construction, independent of that serialization.
 */
function getZoomProbe() {
    if (zoomProbe && zoomProbe.isConnected) return zoomProbe;
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1000px;height:1px;visibility:hidden;pointer-events:none;';
    document.documentElement.appendChild(el);
    zoomProbe = el;
    return el;
}

/** Effective root zoom, e.g. 0.8 at 80% scale. Always 1 during SSR, and 1 in an app that never opted in. */
function uiZoom() {
    if (typeof document === 'undefined') return 1;
    const z = getZoomProbe().getBoundingClientRect().width / 1000;
    return Number.isFinite(z) && z > 0 ? z : 1;
}

/** Screen px -> layout px. Use on every measured value before it becomes a CSS length. */
function toLayoutPx(px) {
    return px / uiZoom();
}

/** getBoundingClientRect() with every side already converted to layout px. */
function layoutRectOf(el) {
    const r = el.getBoundingClientRect();
    const z = uiZoom();
    return {
        top: r.top / z, bottom: r.bottom / z, left: r.left / z, right: r.right / z,
        width: r.width / z, height: r.height / z,
    };
}

/** window.innerWidth/innerHeight in layout px. */
function layoutViewport() {
    const z = uiZoom();
    return { width: window.innerWidth / z, height: window.innerHeight / z };
}

/** window.scrollX/scrollY in layout px. */
function layoutScroll() {
    const z = uiZoom();
    return { x: window.scrollX / z, y: window.scrollY / z };
}

module.exports = {
    UI_SCALES: UI_SCALES,
    DEFAULT_UI_SCALE: DEFAULT_UI_SCALE,
    STORAGE_KEY: STORAGE_KEY,
    ATTRIBUTE: ATTRIBUTE,
    normalizeScale: normalizeScale,
    readUiScale: readUiScale,
    applyUiScale: applyUiScale,
    bootScript: bootScript,
    uiZoom: uiZoom,
    toLayoutPx: toLayoutPx,
    layoutRectOf: layoutRectOf,
    layoutViewport: layoutViewport,
    layoutScroll: layoutScroll,
};
