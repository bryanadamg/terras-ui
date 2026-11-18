'use strict';

// Form/toolbar fields: a recessed text input, a select, and the search box that
// heads a list view, plus the form label and the submit-error banner. Mirrors
// terras-erp's `xpInput` / `xpSelect` / `SearchField` / `FieldLabel` / `FormError`.
//
// A field is RECESSED chrome — blue-gray 1px border, white well — where a button
// is raised. Focus is a 1px accent ring drawn inside that border (chrome.css
// `.terras-field:focus`), not an outer glow: an outer ring would push a toolbar
// row apart by 2px every time the caret lands.
//
// erp grew five different search-box shapes across ~17 list views before this
// existed. Use `SearchField`; don't re-roll icon-inside-input per page.

const React = require('react');
const S = require('./styles');

/** @param {{ style?: object, className?: string }} props — rest passes through. */
function Input(props) {
    const rest = Object.assign({}, props);
    delete rest.style; delete rest.className;
    return React.createElement('input', Object.assign({
        className: 'terras-field' + (props.className ? ' ' + props.className : ''),
        style: S.field(props.style),
    }, rest));
}

/**
 * Select is 22px, not the input's 20px: the native dropdown arrow needs the
 * extra 2px or it clips on Windows.
 */
function Select(props) {
    const rest = Object.assign({}, props);
    delete rest.style; delete rest.className; delete rest.children;
    return React.createElement(
        'select',
        Object.assign({
            className: 'terras-field' + (props.className ? ' ' + props.className : ''),
            style: S.field(Object.assign({ height: 22, padding: '1px 4px' }, props.style)),
        }, rest),
        props.children,
    );
}

function Label(props) {
    return React.createElement(
        'label',
        {
            htmlFor: props.htmlFor,
            style: Object.assign({
                fontFamily: S.font,
                fontSize: S.fs.base,
                display: 'block',
                marginBottom: 2,
                color: S.cssVar('win-text', '#000000'),
            }, props.style),
        },
        props.children,
    );
}

/**
 * Search box for a list toolbar: icon inset on the left, clear "x" on the right
 * once there is a value.
 *
 * @param {{
 *   value: string,
 *   onChange: (v: string) => void,
 *   placeholder?: string,
 *   icon?: React.ReactNode,   // any ReactNode; omit for no icon
 *   width?: number,           // fixed width, or the MAX width when `grow`
 *   grow?: boolean,
 *   style?: object,
 * }} props
 */
function SearchField(props) {
    const width = props.width === undefined ? 200 : props.width;
    const grow = !!props.grow;
    const hasIcon = props.icon !== undefined && props.icon !== null;

    return React.createElement(
        'div',
        {
            style: Object.assign(
                { position: 'relative', display: 'inline-flex', alignItems: 'center', flexShrink: 0 },
                grow ? { flex: '1 1 ' + Math.min(width, 160) + 'px', maxWidth: width } : { width: width },
                props.style,
            ),
        },
        hasIcon
            ? React.createElement(
                'span',
                {
                    style: {
                        position: 'absolute', left: 5, top: '50%', transform: 'translateY(-50%)',
                        display: 'flex', fontSize: S.fs.base, lineHeight: 0,
                        color: S.cssVar('win-text-3', '#666666'), pointerEvents: 'none',
                    },
                },
                props.icon,
            )
            : null,
        React.createElement(Input, {
            type: 'text',
            value: props.value,
            onChange: function (e) { props.onChange(e.target.value); },
            placeholder: props.placeholder === undefined ? 'Search...' : props.placeholder,
            title: props.title,
            autoFocus: props.autoFocus,
            style: { width: '100%', padding: '1px ' + (props.value ? 20 : 6) + 'px 1px ' + (hasIcon ? 20 : 6) + 'px' },
        }),
        props.value
            ? React.createElement(
                'button',
                {
                    type: 'button',
                    onClick: function () { props.onChange(''); },
                    'aria-label': 'Clear search',
                    style: {
                        position: 'absolute', right: 3, top: '50%', transform: 'translateY(-50%)',
                        border: 'none', background: 'none', cursor: 'pointer', padding: 0,
                        lineHeight: 1, fontSize: S.fs.title, fontFamily: S.font,
                        color: S.cssVar('win-text-3', '#666666'),
                    },
                },
                '×',
            )
            : null,
    );
}

/**
 * Form field label: bold, with an optional right-hand adornment and a muted
 * italic `hint` line under it. Mirrors erp xpTheme.tsx FieldLabel. Distinct from
 * `Label`, which is the plain toolbar/inline label.
 *
 * `hint` renders; `title` hovers. A caption earns its line only when the reader
 * needs it every time (an empty-means-X rule, a figure they are correcting); the
 * explanation of WHY a field works the way it does is read once and then costs
 * a line forever, so it goes in `title`. Ten fields with ten captions reads as
 * prose.
 */
function FieldLabel(props) {
    return React.createElement(
        React.Fragment,
        null,
        React.createElement(
            'div',
            { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 } },
            React.createElement('label', {
                htmlFor: props.htmlFor,
                title: props.title,
                style: { fontFamily: S.font, fontSize: S.fs.base, fontWeight: 'bold', color: S.cssVar('field-label', '#2b2822'), margin: 0 },
            }, props.children),
            props.right,
        ),
        props.hint
            ? React.createElement('div', {
                id: props.hintId,
                style: { fontFamily: S.font, fontSize: S.fs.sm, color: S.cssVar('field-hint', '#938c76'), fontStyle: 'italic', marginBottom: 3 },
            }, props.hint)
            : null,
    );
}

/**
 * "What you just submitted was rejected" — the banner at the top of a form or
 * modal body. Mirrors erp xpTheme.tsx FormError. Renders nothing for an empty
 * message, so a call site needs no `&&` guard. `role="alert"` so the rejection
 * is announced.
 *
 * Not for status callouts (a "late" badge, a scanner error) — those carry their
 * own icons and reds — and not for transient outcomes, which are a toast.
 */
function FormError(props) {
    if (!props.children) return null;
    return React.createElement('div', {
        role: 'alert',
        style: Object.assign({
            background: S.cssVar('form-error-bg', '#f5e8e8'),
            border: '1px solid ' + S.cssVar('tone-red-dark', '#8e0000'),
            color: S.cssVar('tone-red-dark', '#8e0000'),
            padding: '4px 8px',
            fontSize: S.fs.base,
            marginBottom: 10,
            fontFamily: S.font,
        }, props.style),
    }, props.children);
}

module.exports = {
    Input: Input,
    Select: Select,
    Label: Label,
    SearchField: SearchField,
    FieldLabel: FieldLabel,
    FormError: FormError,
};
