'use strict';

// Groups related fields in a form under a labelled bar. Mirrors teras-erp's
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
                boxShadow: 'inset 1px 1px 0 #fff, 1px 1px 0 ' + S.cssVar('win-border-soft', '#c0bdb5'),
                borderRadius: S.cssVar('radius-section', '6px'),
                // Must clip, or the square header bar pokes out of the corners.
                overflow: 'hidden',
                marginBottom: 10,
            }, props.style),
        },
        React.createElement(
            'div',
            {
                style: {
                    background: S.cssVar('form-section-blue', '#3a6fc4'),
                    color: '#ffffff',
                    fontFamily: S.font,
                    fontSize: 10,
                    fontWeight: 'bold',
                    padding: '3px 8px',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 6,
                },
            },
            React.createElement(
                'span',
                { style: { display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 } },
                props.icon || null,
                props.title,
            ),
            // Normal weight / no letter-spacing: the header's uppercase tracking is
            // for the label, and a button or count inheriting it reads as a second
            // title competing with the first.
            props.right
                ? React.createElement(
                    'span',
                    {
                        style: {
                            marginLeft: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            flexShrink: 0,
                            fontWeight: 'normal',
                            letterSpacing: 0,
                            textTransform: 'none',
                        },
                    },
                    props.right,
                )
                : null,
        ),
        React.createElement(
            'div',
            { style: Object.assign({ background: '#ffffff', padding: 10 }, props.bodyStyle) },
            props.children,
        ),
    );
}

module.exports = FormSection;
module.exports.FormSection = FormSection;
