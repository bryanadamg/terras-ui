'use strict';

// Horizontal progress readout — a recessed track with up to three stacked
// segments, an optional threshold marker and an optional percent label.
// Mirrors teras-erp's `ProgressBar` in xpTheme.tsx.
//
// It is a FIELD face, not a button face: the track carries the blue-grey
// `--terras-progress-track-border` and no bevel, because a bar reports a number
// rather than inviting a press. Same reasoning that keeps `field()` recessed.
//
// The tooltip is a SLOT, not a dependency. erp wraps the track and the marker in
// its own `Tooltip`, which is ~300 lines over a portal layer, a theme context,
// the interface-scale helpers and the clipped-chip popout — none of which this
// package ships. `tooltip` lets erp hand its own in on migration and leaves
// everyone else on the native `title=`, the same slot shape as
// `LoginScreen`'s `avatar` and `SuitePanel`'s `icons`.

const React = require('react');
const S = require('./styles');

// Dark is the segment's own colour; light is ONLY the second stripe of the
// hatched fill. A bar is never painted in the light half alone.
const fill = (tone, hatched) => {
    const dk = S.cssVar('progress-' + tone, '#c8c3b6');
    if (!hatched) return dk;
    const lt = S.cssVar('progress-' + tone + '-light', '#e2ddd0');
    return 'repeating-linear-gradient(45deg,' + dk + ',' + dk + ' 3px,' + lt + ' 3px,' + lt + ' 6px)';
};

/** The solid colour a segment paints, for a legend sitting beside the bar.
 *  Exported so a caller names the bar's own colour instead of hand-copying a hex
 *  that then drifts when the palette moves. */
const progressToneColor = (tone) => S.cssVar('progress-' + (tone || 'gray'), '#c8c3b6');

const clamp = (n) => Math.max(0, Math.min(100, n));

// Default when no `tooltip` slot is given: the native attribute. Not nothing —
// the bar's `title` is often the only place a multi-part breakdown is written.
const nativeTip = (children, content) =>
    React.cloneElement(children, { title: content });

/**
 * @param {{
 *   pct: number,
 *   tone?: 'gray'|'amber'|'blue'|'green'|'red',
 *   hatched?: boolean,
 *   height?: number,
 *   width?: number|string,
 *   title?: string,
 *   secondaryPct?: number, secondaryTone?: string,
 *   tertiaryPct?: number, tertiaryTone?: string,
 *   markerPct?: number, markerTitle?: string,
 *   label?: 'outside'|'inside'|'none',
 *   tooltip?: (children: React.ReactElement, content: string) => React.ReactNode,
 *   style?: object,
 * }} props
 */
function ProgressBar(props) {
    const height = props.height == null ? 10 : props.height;
    const label = props.label || 'none';
    const hatched = !!props.hatched;
    const tip = props.tooltip || nativeTip;

    // Unset tone reads the number: finished green, started amber, untouched grey.
    // A caller overrides it when the bar means something other than completion —
    // blue for "in progress", red for a shortfall.
    const tone = props.tone || (props.pct >= 100 ? 'green' : props.pct > 0 ? 'amber' : 'gray');

    // Each segment is clamped against what the ones before it already took, so a
    // caller passing three optimistic numbers can never overflow the track.
    const primary = clamp(props.pct);
    const secondary = props.secondaryPct != null
        ? Math.max(0, Math.min(100 - primary, props.secondaryPct)) : 0;
    const tertiary = props.tertiaryPct != null
        ? Math.max(0, Math.min(100 - primary - secondary, props.tertiaryPct)) : 0;
    const pctLabel = Math.round(primary);

    const segment = (left, width, segTone) => React.createElement('div', {
        style: {
            position: 'absolute', top: 0, left: left + '%', height: '100%',
            width: width + '%', background: fill(segTone, hatched),
            transition: 'width 0.2s, left 0.2s',
        },
    });

    const children = [
        segment(0, primary, tone),
        props.secondaryPct != null ? segment(primary, secondary, props.secondaryTone || 'gray') : null,
        props.tertiaryPct != null ? segment(primary + secondary, tertiary, props.tertiaryTone || 'gray') : null,
    ];

    if (props.markerPct != null) {
        // A line, not a fill: it marks a threshold the bar is measured against
        // (a target efficiency), so it paints OVER whatever segment it lands in.
        const mark = React.createElement('div', {
            style: {
                position: 'absolute', top: 0, bottom: 0,
                left: clamp(props.markerPct) + '%', width: 2,
                background: S.cssVar('win-text', '#000000'),
            },
        });
        children.push(props.markerTitle ? tip(mark, props.markerTitle) : mark);
    }

    if (label === 'inside') {
        children.push(React.createElement(
            'span',
            { style: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' } },
            React.createElement('span', {
                style: {
                    // Tracks this thin leave no room for the shared scale, and the
                    // label must not outgrow the bar it sits in.
                    fontSize: Math.max(8, height - 7),
                    fontWeight: 'bold', color: '#fff',
                    background: 'rgba(0,0,0,0.45)',
                    borderRadius: S.cssVar('radius-btn', '3px'),
                    padding: '0 5px', lineHeight: (height - 4) + 'px',
                },
            }, pctLabel + '%'),
        ));
    }

    const track = React.createElement('div', {
        style: Object.assign({
            // 'outside' puts the percent in a flex row beside the track, so the
            // track takes the remaining width instead of an explicit one.
            flex: label === 'outside' ? 1 : undefined,
            width: label === 'outside' ? undefined : (props.width == null ? '100%' : props.width),
            height: height,
            border: '1px solid ' + S.cssVar('progress-track-border', '#7f9db9'),
            borderRadius: S.cssVar('radius-btn', '3px'),
            background: S.cssVar('progress-track', '#e9e9e9'),
            position: 'relative',
            overflow: 'hidden',
            boxSizing: 'border-box',
        }, label === 'outside' ? null : props.style),
    }, children);

    const tipped = props.title ? tip(track, props.title) : track;
    if (label !== 'outside') return tipped;

    return React.createElement(
        'div',
        { style: Object.assign({ display: 'flex', alignItems: 'center', gap: 6 }, props.style) },
        tipped,
        React.createElement('span', {
            // Mono so the row doesn't jitter sideways as the number ticks up.
            style: { fontSize: S.fs.sm, fontFamily: S.fontMono, minWidth: 32 },
        }, pctLabel + '%'),
    );
}

module.exports = ProgressBar;
module.exports.ProgressBar = ProgressBar;
module.exports.progressToneColor = progressToneColor;
