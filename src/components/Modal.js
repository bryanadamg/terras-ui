'use strict';

// Classic dialog: dimmed backdrop + a floating bevelled window with a blue
// title bar, a scrolling body, and a footer action strip. Mirrors teras-erp's
// ModalWrapper / ModalFooterActions.
//
// It is the SAME chrome as `Window`, one z-layer up — that is the point. A
// dialog that borrows a different frame from the page behind it reads as a
// second design language on one screen, which is what a rounded white card over
// XP chrome looks like.
//
// Not a portal: it renders where it is mounted and relies on the modal z-index
// tokens instead. Consuming apps mount dialogs at page level, and a portal would
// drag react-dom into a package that currently peer-depends on react alone.

const React = require('react');
const S = require('./styles');

const LAYER_Z = {
    1: S.cssVar('z-modal-1', '20000'),
    2: S.cssVar('z-modal-2', '20100'),
    3: S.cssVar('z-modal-3', '20200'),
};

/**
 * @param {{
 *   title?: React.ReactNode,
 *   icon?: React.ReactNode,
 *   subtitle?: React.ReactNode,      // second line under the title, inside the bar
 *   tone?: 'blue'|'red'|'amber'|'green'|'grey',
 *   onClose?: () => void,            // also wired to the title-bar close button and backdrop click
 *   closeOnBackdrop?: boolean,       // default true; off for forms with unsaved input
 *   width?: number | string,
 *   layer?: 1 | 2 | 3,               // stacking tier for a dialog opened from a dialog
 *   footer?: React.ReactNode,
 *   as?: 'div' | 'form',             // 'form' so a dialog can submit natively
 *   style?: object,
 *   bodyStyle?: object,
 *   children: React.ReactNode,
 * }} props  — extra props (onSubmit, …) pass through to the window element.
 */
function Modal(props) {
    const rest = Object.assign({}, props);
    ['title', 'icon', 'subtitle', 'tone', 'onClose', 'closeOnBackdrop', 'width', 'layer',
        'footer', 'as', 'style', 'bodyStyle', 'children'].forEach(function (k) { delete rest[k]; });

    const closeOnBackdrop = props.closeOnBackdrop !== false;

    return React.createElement(
        'div',
        {
            style: {
                position: 'fixed',
                inset: 0,
                zIndex: LAYER_Z[props.layer || 1],
                background: 'rgba(0,0,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
            },
            onMouseDown: function (e) {
                // mouseDown, not click: a click fires on the backdrop when a drag
                // that STARTED inside the dialog (selecting text in a field)
                // happens to end outside it, which closed the form mid-edit.
                if (closeOnBackdrop && e.target === e.currentTarget && props.onClose) props.onClose();
            },
        },
        React.createElement(
            props.as === 'form' ? 'form' : 'div',
            Object.assign({
                role: 'dialog',
                'aria-modal': 'true',
                style: S.bevel(Object.assign({
                    width: props.width || 460,
                    maxWidth: '100%',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    fontFamily: S.font,
                    fontSize: 11,
                    color: S.cssVar('win-text', '#000000'),
                }, props.style)),
            }, rest),
            React.createElement(
                'div',
                { style: S.titleBar({}, props.tone) },
                React.createElement(
                    'span',
                    { style: { display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 } },
                    props.icon || null,
                    React.createElement(
                        'span',
                        { style: { minWidth: 0 } },
                        React.createElement('span', null, props.title),
                        props.subtitle
                            ? React.createElement(
                                'span',
                                {
                                    style: {
                                        display: 'block', fontWeight: 'normal', fontSize: 10,
                                        opacity: 0.85, overflow: 'hidden', textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    },
                                },
                                props.subtitle,
                            )
                            : null,
                    ),
                ),
                props.onClose
                    ? React.createElement(
                        'button',
                        {
                            type: 'button',
                            onClick: props.onClose,
                            'aria-label': 'Close',
                            className: 'terras-btn',
                            // The XP close box: a small raised button in the bar, not a
                            // bare glyph — it has to look pressable against the gradient.
                            style: S.button({
                                padding: 0, width: 16, height: 14, fontSize: 10,
                                lineHeight: 1, fontWeight: 'bold', flexShrink: 0,
                            }),
                        },
                        '✕',
                    )
                    : null,
            ),
            React.createElement(
                'div',
                {
                    className: 'terras-scroll',
                    style: Object.assign({
                        flex: 1,
                        minHeight: 0,
                        overflow: 'auto',
                        background: S.cssVar('win-face', '#f0f0e8'),
                        padding: 10,
                    }, props.bodyStyle),
                },
                props.children,
            ),
            props.footer
                ? React.createElement(
                    'div',
                    {
                        style: {
                            flexShrink: 0,
                            display: 'flex',
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 8px',
                            background: S.cssVar('win-bg', '#ece9d8'),
                            borderTop: '1px solid ' + S.cssVar('win-border-dark', '#808080'),
                        },
                    },
                    props.footer,
                )
                : null,
        ),
    );
}

module.exports = Modal;
module.exports.Modal = Modal;
