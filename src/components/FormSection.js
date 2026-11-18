'use strict';

// Groups related fields in a form under a labelled bar. Mirrors terras-erp's
// FormSection: a soft-bordered box with an inset highlight and a SOLID blue
// header (not a gradient — erp moved off the left-to-right fade because a long
// title washed out to near-white by its right edge, so each box read as a
// different colour depending on how wide it was).
//
// The middle tier of the radius scale: window 8 > section 6 > control 3. Never
// let an inner radius exceed the frame that clips it — a box nested in a rounder
// frame pinches the gap between the curves and reads as bulging out of it.

const React = require('react');
const S = require('./styles');

/**
 * @param {{ title: React.ReactNode, icon?: React.ReactNode, right?: React.ReactNode,
 *           style?: object, bodyStyle?: object, children: React.ReactNode }} props
 *
 * `icon` is a node, not an icon-font class name — the package carries no icon
 * set, so the app passes whatever it already uses (`<i className="bi bi-gear"/>`,
 * an inline SVG, an emoji). It exists so the header's flex row is declared once
 * here instead of every call site rebuilding it inside `title` (erp needed a
 * separate `SectionTitle` component for exactly that, because its FormSection
 * took only a bare title).
 */
function FormSection(props) {
    return React.createElement(
        'div',
        {
            style: Object.assign({
                border: '1px solid ' + S.cssVar('win-border-soft', '#c0bdb5'),
                boxShadow: 'inset 1px 1px 0 ' + S.cssVar('win-border-light', '#ffffff') + ', 1px 1px 0 ' + S.cssVar('win-border-soft', '#c0bdb5'),
                borderRadius: S.cssVar('radius-section', '6px'),
                // Must clip, or the square header bar pokes out of the corners.
                overflow: 'hidden',
                marginBottom: 10,
            }, props.style),
        },
        React.createElement(
            'div',
            {
                // A plain block, as in erp: a bare `title` (text, or erp's own
                // icon-plus-text fragments) lays out inline exactly as it does there.
                style: {
                    background: S.cssVar('form-section-blue', '#3a6fc4'),
                    color: S.cssVar('on-solid', '#ffffff'),
                    fontFamily: S.font,
                    fontSize: S.fs.sm,
                    fontWeight: 'bold',
                    padding: '3px 8px',
                    letterSpacing: S.trackingCaps,
                    textTransform: 'uppercase',
                },
            },
            // With an icon or a `right`, the row inside is erp's SectionTitle.
            props.icon || props.right
                ? React.createElement(
                    'span',
                    { style: { display: 'flex', alignItems: 'center', width: '100%', gap: 6 } },
                    props.icon || null,
                    props.title,
                    // Normal weight / no letter-spacing: the header's uppercase
                    // tracking is for the label, and a button or count inheriting it
                    // reads as a second title competing with the first.
                    props.right
                        ? React.createElement(
                            'span',
                            { style: { marginLeft: 'auto', fontWeight: 'normal', textTransform: 'none', letterSpacing: 0 } },
                            props.right,
                        )
                        : null,
                )
                : props.title,
        ),
        React.createElement(
            'div',
            { style: Object.assign({ background: S.cssVar('win-well', '#ffffff'), padding: 10 }, props.bodyStyle) },
            props.children,
        ),
    );
}

module.exports = FormSection;
module.exports.FormSection = FormSection;
