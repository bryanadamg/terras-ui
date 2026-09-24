'use strict';

// Hover surfaces. Mirrors erp Tooltip.tsx (Tooltip / FloatingLayer /
// TooltipSurface / useHoverAnchor / isClipped) and GlobalTooltip.tsx.
//
// Why not the native `title=`: the OS tooltip is unstyleable, appears after a
// fixed delay at the mouse rather than at the element, renders in the OS font,
// and in a dense table leaves a clipped value ("PR-2026-08-000…") to be read as
// plain OS text somewhere else on screen.
//
// Every layer is a `document.body` portal — a table cell that clips its content
// would clip an inline tooltip exactly the same way — and is placed through the
// interface-scale helpers, because `position: fixed` inside the root zoom is off
// by the scale factor unless the measured rect is converted first.
//
// `FloatingLayer` + `useHoverAnchor` are the reusable base: `Menu`'s dropdown
// and any popout an app draws itself sit on them too.

const React = require('react');
const ReactDOM = require('react-dom');
const S = require('./styles');
const scale = require('../scale');
const tokens = require('../tokens/tokens.json');

const h = React.createElement;

/**
 * Hover dwell before a TEXT bubble opens. Near the native tooltip's own delay on
 * purpose: a bubble answers "what is this?", and anything faster fires on the
 * mouse merely crossing a dense table on its way somewhere else.
 */
const TIP_DELAY = 900;

/**
 * Dwell before clipped text is echoed. Much shorter: it is not an explanation,
 * it is the label the reader is already trying to read finishing itself.
 */
const POPOUT_DELAY = 260;

const TOOLTIP_Z = tokens.zIndex.tooltip;

// React 18's useId where it exists; a per-instance counter on 16.8/17, where
// SSR id agreement was never on offer anyway.
let idSeq = 0;
function useStableId() {
    if (React.useId) return React.useId();
    const ref = React.useRef(null);
    if (ref.current === null) ref.current = 'terras-tip-' + (++idSeq);
    return ref.current;
}

/**
 * Hover/focus state machine for anything that floats off an element. Measures
 * the trigger at hover time (never on render — a row measured on mount is wrong
 * the moment a column resizes) and hands back the rect in layout px. Scroll,
 * resize, a pointerdown anywhere and Escape all dismiss: a fixed layer does not
 * follow its anchor, so anything that can move the anchor closes it instead.
 */
function useHoverAnchor(opts) {
    const o = opts || {};
    const delay = o.delay === undefined ? TIP_DELAY : o.delay;
    const enabled = o.enabled === undefined ? true : o.enabled;
    const shouldOpen = o.shouldOpen;

    const state = React.useState(null);
    const open = state[0];
    const setOpen = state[1];
    const timer = React.useRef(null);

    const clear = function () { if (timer.current) { clearTimeout(timer.current); timer.current = null; } };
    const close = React.useCallback(function () { clear(); setOpen(null); }, []);
    React.useEffect(function () { return clear; }, []);

    React.useEffect(function () {
        if (!open) return undefined;
        const onKey = function (e) { if (e.key === 'Escape') close(); };
        window.addEventListener('scroll', close, true);
        window.addEventListener('resize', close);
        window.addEventListener('pointerdown', close, true);
        window.addEventListener('keydown', onKey);
        return function () {
            window.removeEventListener('scroll', close, true);
            window.removeEventListener('resize', close);
            window.removeEventListener('pointerdown', close, true);
            window.removeEventListener('keydown', onKey);
        };
    }, [open, close]);

    const openFrom = React.useCallback(function (el) {
        if (!enabled || !el) return;
        if (shouldOpen && !shouldOpen(el)) return;
        clear();
        const ms = typeof delay === 'function' ? delay() : delay;
        timer.current = setTimeout(function () { setOpen({ el: el, rect: scale.layoutRectOf(el) }); }, ms);
    }, [enabled, delay, shouldOpen]);

    return {
        rect: open ? open.rect : null,
        anchorEl: open ? open.el : null,
        isOpen: !!open,
        close: close,
        openFrom: openFrom,
        handlers: {
            onMouseEnter: function (e) { openFrom(e.currentTarget); },
            onMouseLeave: close,
            // Keyboard parity: tabbing onto the trigger opens it the same way.
            onFocus: function (e) { openFrom(e.currentTarget); },
            onBlur: close,
        },
    };
}

/**
 * Body portal placed against an anchor, clamped into the viewport.
 *
 * Placement is computed in SCREEN px against the anchor's live rect, written
 * back in layout px, then CORRECTED against where the layer actually landed:
 * `position: fixed` under the root zoom, inside a transformed ancestor, or in a
 * browser that measures zoom differently all land slightly off the arithmetic,
 * and `placement="over"` has no tolerance for "slightly".
 */
function FloatingLayer(props) {
    const ref = React.useRef(null);
    const placedState = React.useState(false);
    const placement = props.placement || 'bottom';
    const align = props.align || 'start';
    const offset = props.offset === undefined ? 5 : props.offset;
    const rect = props.rect;
    const anchorEl = props.anchorEl;

    React.useLayoutEffect(function () {
        const el = ref.current;
        if (!el) return;
        const z = scale.uiZoom();
        const a = anchorEl && anchorEl.isConnected
            ? anchorEl.getBoundingClientRect()
            : { top: rect.top * z, left: rect.left * z, bottom: rect.bottom * z, right: rect.right * z, width: rect.width * z, height: rect.height * z };
        const box = el.getBoundingClientRect();
        const gap = offset * z;
        const edge = 4 * z;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        let top = placement === 'over' ? a.top
            : placement === 'side' ? a.top + a.height / 2 - box.height / 2
                : placement === 'top' ? a.top - box.height - gap
                    : a.bottom + gap;
        if (placement === 'bottom' && top + box.height > vh - edge) top = a.top - box.height - gap;
        if (placement === 'top' && top < edge) top = a.bottom + gap;
        top = Math.max(edge, Math.min(top, Math.max(edge, vh - box.height - edge)));

        let left = placement === 'side' ? a.right + gap
            : align === 'center' ? a.left + a.width / 2 - box.width / 2
                : align === 'end' ? a.right - box.width
                    : a.left;
        // Beside means beside: flip to the other side rather than clamp back over
        // the anchor's column.
        if (placement === 'side' && left + box.width > vw - edge) left = a.left - box.width - gap;
        left = Math.max(edge, Math.min(left, Math.max(edge, vw - box.width - edge)));

        el.style.top = top / z + 'px';
        el.style.left = left / z + 'px';
        const landed = el.getBoundingClientRect();
        if (Math.abs(landed.top - top) > 0.5 || Math.abs(landed.left - left) > 0.5) {
            el.style.top = (top + (top - landed.top)) / z + 'px';
            el.style.left = (left + (left - landed.left)) / z + 'px';
        }
        placedState[1](true);
    }, [rect, anchorEl, placement, align, offset]);

    if (typeof document === 'undefined') return null;
    return ReactDOM.createPortal(
        h('div', {
            ref: ref,
            className: props.className,
            style: Object.assign({
                position: 'fixed',
                top: 0,
                left: 0,
                zIndex: props.zIndex === undefined ? TOOLTIP_Z : props.zIndex,
                // Hover surfaces never take the pointer; an interactive layer
                // (a menu) passes `interactive`.
                pointerEvents: props.interactive ? 'auto' : 'none',
                visibility: placedState[0] ? 'visible' : 'hidden',
                // FLEX, not block: a block wrapper lays its child on a line box
                // sized from the inherited font, so the child sits a few px below
                // the wrapper's own top and "place the wrapper on the anchor"
                // misses by that much.
                display: 'flex',
                alignItems: 'flex-start',
            }, props.style),
        }, props.children),
        document.body,
    );
}

/**
 * The bubble itself — one dark-grey box in every theme. Not a pale XP panel: a
 * light bubble on a light window reads as another panel that appeared, where
 * dark grey is unambiguously "floating, temporary, not part of the page".
 */
function TooltipSurface(props) {
    return h('div', {
        id: props.id,
        role: 'tooltip',
        style: {
            maxWidth: props.maxWidth === undefined ? 320 : props.maxWidth,
            // Multi-line titles ('\n') keep working, as they did in a native title.
            whiteSpace: 'pre-line',
            fontFamily: S.font,
            fontSize: S.fs.base,
            lineHeight: 1.4,
            padding: '3px 7px',
            borderRadius: 3,
            background: '#2f3136',
            color: '#f2f2f2',
            border: '1px solid #16171a',
            boxShadow: '0 2px 8px rgba(0,0,0,0.30)',
        },
    }, props.children);
}

const chain = function () {
    const fns = Array.prototype.slice.call(arguments);
    return function (e) { fns.forEach(function (f) { if (f) f(e); }); };
};

/**
 * Wrap ONE element to give it the styled tooltip instead of the OS one. The
 * child is cloned with hover/focus handlers — no wrapper element — so table and
 * flex layouts are untouched. The child must be a DOM element (or forward
 * mouse/focus props).
 */
function Tooltip(props) {
    const content = props.content;
    const empty = content === null || content === undefined || content === '';
    const anchor = useHoverAnchor({ delay: props.delay, enabled: !props.disabled && !empty });
    const tipId = useStableId();
    const child = React.Children.only(props.children);
    const cloned = React.cloneElement(child, {
        'aria-describedby': anchor.rect ? tipId : child.props['aria-describedby'],
        // Tells GlobalTooltip this element already owns a surface.
        'data-no-tip': '',
        onMouseEnter: chain(child.props.onMouseEnter, anchor.handlers.onMouseEnter),
        onMouseLeave: chain(child.props.onMouseLeave, anchor.handlers.onMouseLeave),
        onFocus: chain(child.props.onFocus, anchor.handlers.onFocus),
        onBlur: chain(child.props.onBlur, anchor.handlers.onBlur),
    });

    return h(React.Fragment, null,
        cloned,
        anchor.rect
            ? h(FloatingLayer, {
                rect: anchor.rect,
                anchorEl: anchor.anchorEl,
                placement: props.placement || 'bottom',
                align: props.align || 'start',
                className: 'terras-tip-anim',
            }, h(TooltipSurface, { maxWidth: props.maxWidth, id: tipId }, content))
            : null);
}

/** True when `el` is clipped by its own box. 1px slack for sub-pixel widths at non-100% scale. */
function isClipped(el) {
    if (!el) return false;
    return el.scrollWidth > el.clientWidth + 1;
}

// ── GlobalTooltip ───────────────────────────────────────────────────────────
// One document-level layer, mounted once near the app root, with two jobs:
//
//   1. SUPPRESS the native tooltip. Every `title` is PARKED on
//      `data-original-title` as soon as it appears, so the OS never draws its
//      grey box. It is mirrored to `aria-label` when the element has no other
//      accessible name — for an icon-only button the title WAS the name.
//   2. ECHO clipped text. Single-line text cut off by its column gets the full
//      value on hover, at the element.
//
// A `title=` no longer opens anything — deliberate explanatory text is an
// explicit `<Tooltip content>` at the call site that wants it.
//
// Parking happens up front, not on hover: Blink captures the tooltip string at
// hit-test time and hands it to the browser process with its own delay, and
// removing the attribute during the hover does not cancel that pending bubble.
//
// Left alone: `<option>`, `<select>` and `<iframe>` titles (only the browser
// can render those), and anything inside `[data-no-tip]`.

const CLIP_DEPTH = 3;
const MAX_CLIP_TEXT = 180;
const PARKED = 'data-original-title';
const OWN_ARIA = 'data-tip-aria';
const GLOBAL_TIP_ID = 'terras-global-tip';

const hasOwnName = function (el) {
    return !!(el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || (el.textContent || '').trim());
};
const isFormNative = function (el) {
    const t = el.tagName;
    return t === 'OPTION' || t === 'SELECT' || t === 'IFRAME';
};
const park = function (el) {
    const t = el.getAttribute('title');
    if (t === null || isFormNative(el)) return;
    if (!t.trim()) { el.removeAttribute('title'); return; }
    el.setAttribute(PARKED, t);
    if (!hasOwnName(el)) { el.setAttribute('aria-label', t); el.setAttribute(OWN_ARIA, '1'); }
    el.removeAttribute('title');
};
const parkSubtree = function (root) {
    if (!root || root.nodeType !== 1) return;
    if (root.hasAttribute('title')) park(root);
    root.querySelectorAll('[title]').forEach(park);
};

function GlobalTooltip() {
    const state = React.useState(null);
    const live = state[0];
    const setLive = state[1];
    const timer = React.useRef(null);
    const described = React.useRef(null);

    const hide = React.useCallback(function () {
        if (timer.current) { clearTimeout(timer.current); timer.current = null; }
        const d = described.current;
        if (d && d.isConnected && d.getAttribute('aria-describedby') === GLOBAL_TIP_ID) d.removeAttribute('aria-describedby');
        described.current = null;
        setLive(null);
    }, []);

    // Park every title now and every one React renders later. Attribute-filtered
    // to `title`, so our own writes can't feed the observer back into itself.
    React.useEffect(function () {
        parkSubtree(document.body);
        const obs = new MutationObserver(function (records) {
            records.forEach(function (r) {
                if (r.type === 'attributes') park(r.target);
                else r.addedNodes.forEach(parkSubtree);
            });
        });
        obs.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['title'] });
        return function () {
            obs.disconnect();
            // Hand the attributes back on unmount, so no title is left orphaned.
            document.querySelectorAll('[' + PARKED + ']').forEach(function (el) {
                if (!el.getAttribute('title')) el.setAttribute('title', el.getAttribute(PARKED));
                el.removeAttribute(PARKED);
                if (el.getAttribute(OWN_ARIA) === '1') { el.removeAttribute('aria-label'); el.removeAttribute(OWN_ARIA); }
            });
        };
    }, []);

    React.useEffect(function () {
        const onOver = function (e) {
            const target = e.target;
            if (!target || target.nodeType !== 1) return;
            if (isFormNative(target)) { if (live) hide(); return; }

            let el = null;
            let text = '';
            if (!target.closest('[data-no-tip]')) {
                let node = target;
                for (let i = 0; i < CLIP_DEPTH && node; i++, node = node.parentElement) {
                    if (!isClipped(node)) continue;
                    const t = (node.textContent || '').trim();
                    // A label cut off by its column, not a scroll box or a paragraph.
                    if (t.length < 2 || t.length > MAX_CLIP_TEXT) continue;
                    const cs = window.getComputedStyle(node);
                    // nowrap is the truncation signature: a wrapping block's
                    // scrollWidth can drift past clientWidth from zoom rounding alone.
                    if (cs.whiteSpace !== 'nowrap') continue;
                    if (cs.overflowX === 'auto' || cs.overflowX === 'scroll') continue;
                    el = node;
                    text = t;
                    break;
                }
            }
            if (!el || !text) { if (live || timer.current) hide(); return; }
            if (live && live.el === el) return;

            if (timer.current) clearTimeout(timer.current);
            const anchor = el;
            timer.current = setTimeout(function () {
                if (!anchor.isConnected) return;
                anchor.setAttribute('aria-describedby', GLOBAL_TIP_ID);
                described.current = anchor;
                setLive({ el: anchor, rect: scale.layoutRectOf(anchor), text: text });
            }, POPOUT_DELAY);
        };
        const onOut = function (e) {
            const to = e.relatedTarget;
            const anchor = live ? live.el : described.current;
            if (anchor && to && anchor.contains(to)) return;
            hide();
        };
        const onKey = function (e) { if (e.key === 'Escape') hide(); };

        document.addEventListener('mouseover', onOver, true);
        document.addEventListener('mouseout', onOut, true);
        document.addEventListener('focusin', onOver, true);
        document.addEventListener('focusout', hide, true);
        document.addEventListener('pointerdown', hide, true);
        window.addEventListener('scroll', hide, true);
        window.addEventListener('resize', hide);
        window.addEventListener('keydown', onKey);
        return function () {
            document.removeEventListener('mouseover', onOver, true);
            document.removeEventListener('mouseout', onOut, true);
            document.removeEventListener('focusin', onOver, true);
            document.removeEventListener('focusout', hide, true);
            document.removeEventListener('pointerdown', hide, true);
            window.removeEventListener('scroll', hide, true);
            window.removeEventListener('resize', hide);
            window.removeEventListener('keydown', onKey);
        };
    }, [live, hide]);

    if (!live) return null;
    return h(FloatingLayer, { rect: live.rect, anchorEl: live.el, placement: 'bottom', className: 'terras-tip-anim' },
        h(TooltipSurface, { maxWidth: 360, id: GLOBAL_TIP_ID }, live.text));
}

module.exports = Tooltip;
module.exports.Tooltip = Tooltip;
module.exports.TooltipSurface = TooltipSurface;
module.exports.FloatingLayer = FloatingLayer;
module.exports.useHoverAnchor = useHoverAnchor;
module.exports.isClipped = isClipped;
module.exports.GlobalTooltip = GlobalTooltip;
module.exports.TIP_DELAY = TIP_DELAY;
module.exports.POPOUT_DELAY = POPOUT_DELAY;
