'use strict';

// Shared style primitives every Terras component is built from — the classic
// (XP) chrome expressed as plain style objects over the `--terras-*` custom
// properties in tokens.css. Mirrors teras-erp's xpTheme.tsx / shellTheme.tsx
// helpers of the same names; when a value here conflicts with that repo, that
// repo wins.
//
// Exported publicly (`@bryanadamg/terras-ui/styles`) so a consuming app can
// paint a one-off surface with the same chrome instead of hand-rolling a
// near-copy — that hand-copying is exactly what made erp's 20 view shells drift.

const v = (name, fallback) =>
    fallback === undefined ? 'var(--terras-' + name + ')' : 'var(--terras-' + name + ', ' + fallback + ')';

const font = v('font-classic', '"Tahoma", "Segoe UI", "Arial", sans-serif');
const fontMono = v('font-mono', 'Consolas, monospace');

// The classic type scale (tokens.css `--terras-fs-*`). erp has no ramp — the
// theme class sets 11px and every size is a px step written inline — so these
// are the four steps this package paints, not a generated scale. Use them
// instead of a bare number so an app can retune the surface in one place; a new
// step means checking erp first, the same rule as a new tone or radius.
const fs = {
    sub: v('fs-sub', '10.5px'),
    sm: v('fs-sm', '10px'),
    base: v('fs-base', '11px'),
    title: v('fs-title', '12px'),
};

// Rides with fs.sm + bold + uppercase; that quartet is the classic micro-label.
const trackingCaps = v('tracking-caps', '0.5px');

// Two-tone 1px bevel: light on top/left, dark on bottom/right = raised;
// swap them for a recessed well. This IS the classic button/panel — it can't be
// reduced to a single border color, which is why `--line` alone never looked right.
const raised = (light, dark) => ({
    border: '1px solid',
    borderColor: light + ' ' + dark + ' ' + dark + ' ' + light,
});

// Outer frame of a top-level view (erp `xpBevel`). `overflow: hidden` is part of
// the chrome, not a caller concern: the title bar, toolbar and table inside are
// all square-cornered, so without the clip they poke out of the 8px corner. CSS
// clips at the padding box (radius minus the 2px border), so the bar's corner
// reads as one curve with the frame's.
const bevel = (extra) => Object.assign({
    border: '2px solid',
    borderColor: v('bevel-border-light', '#dfdfdf') + ' ' + v('bevel-border-dark', '#808080') + ' ' +
                 v('bevel-border-dark', '#808080') + ' ' + v('bevel-border-light', '#dfdfdf'),
    boxShadow: v('shadow-panel', '2px 2px 4px rgba(0,0,0,0.3)'),
    background: v('win-bg', '#ece9d8'),
    borderRadius: v('radius', '8px'),
    overflow: 'hidden',
}, extra);

// Docked panel with a square raised bevel — the inner surface a table or form
// sits on, one tier below `bevel` (erp `xpPanel`).
const panel = (extra) => Object.assign({
    background: v('win-face', '#f0f0e8'),
    borderRadius: 0,
}, raised(v('win-border-light', '#ffffff'), v('win-border-dark', '#808080')), extra);

// Recessed white well — `raised` with the edges swapped, dark on top/left. The
// sunken surface an empty state or a progress/loading track sits in; one tier
// the opposite way from `panel`.
const recessed = (extra) => Object.assign({
    background: v('table-bg', '#ffffff'),
}, raised(v('win-border-dark', '#808080'), v('win-border-light', '#ffffff')), extra);

// Title-bar tones. Blue is the default window chrome; the rest exist for panels
// whose bar carries the severity of what it heads. Same five semantic families
// as the status chips — don't add a sixth hue.
const TITLE_TONES = {
    blue: { background: v('title-blue'), border: v('title-blue-border', '#003080') },
    red: { background: v('title-red'), border: v('title-red-border', '#550000') },
    amber: { background: v('title-amber'), border: v('title-amber-border', '#804000') },
    green: { background: v('title-green'), border: v('title-green-border', '#0a4a0a') },
    grey: { background: v('title-grey'), border: v('title-grey-border', '#222222') },
};

const titleBar = (extra, tone) => {
    const t = TITLE_TONES[tone || 'blue'] || TITLE_TONES.blue;
    return Object.assign({
        background: t.background,
        color: '#ffffff',
        fontFamily: font,
        fontSize: fs.title,
        fontWeight: 'bold',
        padding: '4px 8px',
        // The inset highlight is what makes the bar read as lit from above —
        // without it the gradient alone looks like a flat blue block.
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
        borderBottom: '1px solid ' + t.border,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
        minHeight: 26,
        flexShrink: 0,
        userSelect: 'none',
    }, extra);
};

// The strip of controls under a title bar (erp `xpToolbar`).
const toolbar = (extra) => Object.assign({
    background: v('toolbar-bg', 'linear-gradient(to bottom, #f5f4ef, #e0dfd8)'),
    borderBottom: '1px solid ' + v('toolbar-border', '#b0a898'),
    padding: '3px 6px',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    flexShrink: 0,
    fontFamily: font,
    fontSize: fs.base,
}, extra);

// Vertical rule between toolbar groups.
const separator = {
    width: 1,
    alignSelf: 'stretch',
    minHeight: 18,
    background: v('sep', '#a0988c'),
    margin: '0 2px',
    flexShrink: 0,
};

// Text input / select face — recessed, so the border is the blue-gray
// `--terras-input-border`, not the button bevel's gray.
const field = (extra) => Object.assign({
    fontFamily: font,
    fontSize: fs.base,
    border: '1px solid ' + v('input-border', '#7f9db9'),
    borderRadius: v('radius-btn', '3px'),
    padding: '1px 6px',
    background: v('input-bg', '#ffffff'),
    color: v('win-text', '#000000'),
    height: 20,
    boxSizing: 'border-box',
    outline: 'none',
}, extra);

// Raised button face. Tones patch the face + border over this base.
const BTN_TONES = {
    default: {},
    primary: Object.assign(
        { background: v('btn-primary-face'), color: '#fff', fontWeight: 'bold' },
        raised(v('btn-primary-border-light', '#1a3a7a'), v('btn-primary-border-dark', '#0a1a4a')),
    ),
    success: Object.assign(
        { background: v('btn-success-face'), color: '#fff', fontWeight: 'bold' },
        raised(v('btn-success-border-light', '#1a5e1a'), v('btn-success-border-dark', '#0a3e0a')),
    ),
    danger: Object.assign(
        { background: v('btn-danger-face'), color: '#fff', fontWeight: 'bold' },
        raised(v('btn-danger-border-light', '#8e0000'), v('btn-danger-border-dark', '#5e0000')),
    ),
};

const button = (extra) => Object.assign({
    fontFamily: font,
    fontSize: fs.base,
    padding: '2px 10px',
    cursor: 'pointer',
    background: v('btn-face', 'linear-gradient(to bottom, #ffffff 0%, #d4d0c8 100%)'),
    color: v('win-text', '#000000'),
    borderRadius: v('radius-btn', '3px'),
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    whiteSpace: 'nowrap',
}, raised(v('btn-border-light', '#dfdfdf'), v('btn-border-dark', '#808080')), extra);

// ── Toggle chip ─────────────────────────────────────────────────────────────
// The pressed/unpressed chip face (erp `ToggleChip` / `CHIP_TONES`): filter
// bars, segmented pickers, weekday rows. Its OFF state is deliberately the plain
// `button()` face — an unselected chip IS a button, so it reuses those tokens
// rather than declaring a second grey.
//
// Four tones, no grey: this is "pressed", not "what state is this row in". Don't
// confuse it with `Chip`'s five status families — those are tinted pills that
// report state and never take a click.
// Value is the tone's hover-glow fallback, used only if tokens.css is missing —
// a shared fallback would make every tone glow blue in that case, which is worse
// than no glow because it reads as the wrong tone rather than as a missing one.
const TOGGLE_TONES = {
    blue: 'rgba(0, 64, 180, 0.28)',
    green: 'rgba(26, 122, 26, 0.30)',
    red: 'rgba(165, 32, 32, 0.28)',
    amber: 'rgba(192, 112, 0, 0.28)',
};

/** Segment position for the i-th of `len` members of a flush group. */
const segAt = (i, len) => (len === 1 ? 'only' : i === 0 ? 'first' : i === len - 1 ? 'last' : 'mid');

// Hover/press live in `.terras-toggle` (chrome.css), not in React state the way
// erp's version tracks them — the package has a stylesheet to hang :hover on, so
// it doesn't need to re-render on mouseenter at 28 call sites.
//
// One deliberate difference from erp: its neutral idle chip tints BLUE on hover
// (grey gradient → #d6e6fb). A CSS-only hover can't do that here, because the
// face is painted inline and an inline background always beats a stylesheet one.
// The glow + brightness erp already draws alongside that tint carries the state
// on its own, so the tint is dropped rather than re-introducing JS hover state.
// The per-tone glow colour rides along as an inline `--terras-toggle-glow`,
// which chrome.css reads (it never assigns it, so there's no inline-vs-CSS race).
const toggleChip = (extra, opts) => {
    const o = opts || {};
    const tone = TOGGLE_TONES[o.tone] ? o.tone : 'blue';
    const bevelEdge = v('btn-border-light', '#dfdfdf') + ' ' + v('btn-border-dark', '#808080') + ' ' +
                      v('btn-border-dark', '#808080') + ' ' + v('btn-border-light', '#dfdfdf');
    // `toneIdle` is ignored under `flat` — a flat chip's whole point is a neutral
    // data-control face, so tinting it would undo the variant.
    const toned = o.toneIdle && !o.flat;

    return Object.assign({
        fontFamily: font,
        fontSize: fs.base,
        fontWeight: o.on ? 'bold' : 'normal',
        minWidth: o.minWidth,
        padding: '2px 9px',
        borderRadius: v('radius-chip', '3px'),
        cursor: 'pointer',
        border: '1px solid',
        borderColor: o.on ? v('toggle-' + tone + '-border')
            : toned ? v('toggle-' + tone + '-idle-border')
            : bevelEdge,
        background: o.on ? v('toggle-' + tone + '-bg')
            : o.flat ? v('toggle-flat-bg', '#eceae0')
            : toned ? v('toggle-' + tone + '-idle-bg')
            : v('btn-face', 'linear-gradient(to bottom, #ffffff 0%, #d4d0c8 100%)'),
        color: o.on ? '#ffffff'
            : toned ? v('toggle-' + tone + '-idle-text')
            : v('win-text', '#000000'),
        '--terras-toggle-glow': v('toggle-glow-' + tone, TOGGLE_TONES[tone]),
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        whiteSpace: 'nowrap',
        // Segment members share one border line, so each one after the first
        // pulls back over its neighbour's edge. Which of the collapsed pair wins
        // is a z-index question, and that lives in chrome.css so `:hover` can
        // raise the hovered segment without fighting an inline value.
        position: o.seg ? 'relative' : undefined,
        marginLeft: o.seg && o.seg !== 'first' && o.seg !== 'only' ? -1 : undefined,
    }, extra);
};

module.exports = {
    cssVar: v,
    font: font,
    fontMono: fontMono,
    fs: fs,
    trackingCaps: trackingCaps,
    raised: raised,
    bevel: bevel,
    panel: panel,
    recessed: recessed,
    titleBar: titleBar,
    TITLE_TONES: TITLE_TONES,
    toolbar: toolbar,
    separator: separator,
    field: field,
    button: button,
    BTN_TONES: BTN_TONES,
    toggleChip: toggleChip,
    TOGGLE_TONES: TOGGLE_TONES,
    segAt: segAt,
};
