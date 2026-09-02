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
 * @param {{ title: React.ReactNode, right?: React.ReactNode,
 *           style?: object, bodyStyle?: object, children: React.ReactNode }} props
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
            React.createElement('span', null, props.title),
            props.right || null,
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
