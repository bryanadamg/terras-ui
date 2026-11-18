'use client';
'use strict';

// Type-to-search single select. Mirrors terras-erp's `SearchableSelect`, which is
// the source of truth for the shape: a closed trigger with a ▼ well, and a popup
// carrying its own search box above the list.
//
// A native <select> stops working somewhere in the low hundreds of options — you
// cannot type "reg" and land on Regulator, you scroll. A native <datalist> gives
// the filtering but paints the browser's own suggestion list, which is not
// classic chrome and cannot be made so.
//
// The popup is PORTALED to document.body at position:fixed, never nested. It has
// to escape two things an in-flow popup cannot: `overflow: auto` on a Modal body
// (which clips it) and a modeless Modal being dragged (which strands it). That
// second case is why this listens for Modal's reposition event.

const React = require('react');
const ReactDOM = require('react-dom');
const S = require('./styles');
const REPOSITION_EVENT = require('./Modal').REPOSITION_EVENT;
const scale = require('../scale');

const MAX_HEIGHT = 280;

// Cap rendered rows so a 5k-option list does not build 5k nodes. Anything past
// the cap is reachable by typing, and the footer says how many are hidden so
// they are never silently unreachable.
const RENDER_CAP = 100;

const norm = (s) => (s || '').trim().toLowerCase();

// A code shown beside the name it duplicates is noise, not information.
const subIsRedundant = (o) => !o.subLabel || !o.label || norm(o.subLabel) === norm(o.label);

// Screen px -> layout px, so the portaled popup lands on its trigger under an
// interface scale (see ../scale.js). The props stay as an override for a caller
// inside a `.ui-scale-exempt` subtree, which is back at 1:1 and must not be
// corrected twice.
const defaultRectOf = (el) => scale.layoutRectOf(el);
const defaultViewportHeight = () => scale.layoutViewport().height;

/**
 * @param {{
 *   options: Array<{value: string, label: string, subLabel?: string, category?: string}>,
 *   value: string,
 *   onChange: (value: string) => void,
 *   placeholder?: string,
 *   disabled?: boolean,
 *   required?: boolean,
 *   categories?: string[],
 *   onSearch?: (term: string) => void,
 *   size?: 'sm' | 'md',
 *   emptyLabel?: string,
 *   testId?: string,
 *   className?: string,
 *   style?: object,
 *   rectOf?: (el: Element) => {top: number, bottom: number, left: number, width: number},
 *   viewportHeight?: () => number,
 * }} props
 */
function Combobox(props) {
    const options = props.options || [];
    const size = props.size || 'md';
    const rectOf = props.rectOf || defaultRectOf;
    const viewportHeight = props.viewportHeight || defaultViewportHeight;

    // Index access rather than array destructuring, matching the rest of the
    // package: these files ship unbuilt.
    const openState = React.useState(false);
    const isOpen = openState[0];
    const setIsOpen = openState[1];

    const termState = React.useState('');
    const term = termState[0];
    const setTerm = termState[1];

    const categoryState = React.useState(null);
    const activeCategory = categoryState[0];
    const setActiveCategory = categoryState[1];

    const activeState = React.useState(0);
    const activeIndex = activeState[0];
    const setActiveIndex = activeState[1];

    // Keeps the trigger readable when an async `onSearch` has swapped `options`
    // out from under the current selection.
    const cachedState = React.useState(null);
    const cached = cachedState[0];
    const setCached = cachedState[1];

    const posState = React.useState(null);
    const pos = posState[0];
    const setPos = posState[1];

    const triggerRef = React.useRef(null);
    const popupRef = React.useRef(null);
    const searchRef = React.useRef(null);
    const listRef = React.useRef(null);

    const selected = options.find((o) => o.value === props.value) || cached || undefined;
    const height = size === 'sm' ? 18 : 20;

    const place = React.useCallback(function () {
        if (!triggerRef.current) return;
        const rect = rectOf(triggerRef.current);
        const vh = viewportHeight();
        const below = vh - rect.bottom;
        // Flip up only when below is both too small AND worse than above —
        // a field near the bottom of a tall modal otherwise opens off-screen.
        if (below >= MAX_HEIGHT || below >= rect.top) {
            setPos({ top: rect.bottom, left: rect.left, width: rect.width });
        } else {
            setPos({ bottom: vh - rect.top, left: rect.left, width: rect.width });
        }
    }, [rectOf, viewportHeight]);

    React.useEffect(function () {
        function onMouseDown(e) {
            const inTrigger = triggerRef.current && triggerRef.current.contains(e.target);
            const inPopup = popupRef.current && popupRef.current.contains(e.target);
            if (!inTrigger && !inPopup) setIsOpen(false);
        }
        document.addEventListener('mousedown', onMouseDown);
        return function () { document.removeEventListener('mousedown', onMouseDown); };
    }, []);

    React.useEffect(function () {
        if (props.value) return;
        setCached(null);
    }, [props.value]);

    React.useEffect(function () {
        if (!isOpen) {
            setTerm('');
            setPos(null);
            if (props.onSearch) props.onSearch('');
            return;
        }
        place();
        setActiveIndex(0);
        const t = setTimeout(function () {
            if (searchRef.current) searchRef.current.focus();
        }, 0);
        return function () { clearTimeout(t); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    React.useEffect(function () {
        if (!isOpen) return;
        function onScroll(e) {
            // Scrolling the list itself must not close it.
            if (popupRef.current && popupRef.current.contains(e.target)) return;
            setIsOpen(false);
        }
        // Reposition rather than close on resize: a scrollbar toggling from page
        // reflow fires a spurious resize on classic-scrollbar systems, and
        // closing there collapses the popup mid-search.
        window.addEventListener('scroll', onScroll, true);
        window.addEventListener('resize', place);
        window.addEventListener(REPOSITION_EVENT, place);
        return function () {
            window.removeEventListener('scroll', onScroll, true);
            window.removeEventListener('resize', place);
            window.removeEventListener(REPOSITION_EVENT, place);
        };
    }, [isOpen, place]);

    const base = activeCategory ? options.filter(function (o) { return o.category === activeCategory; }) : options;
    const q = term.toLowerCase();
    const matched = q
        ? base.filter(function (o) {
            return (o.label || '').toLowerCase().indexOf(q) !== -1
                || (o.subLabel && o.subLabel.toLowerCase().indexOf(q) !== -1);
        })
        : base;
    const shown = matched.slice(0, RENDER_CAP);
    const hidden = Math.max(0, matched.length - RENDER_CAP);

    React.useEffect(function () { setActiveIndex(0); }, [term, activeCategory]);

    function choose(option) {
        setCached(option);
        props.onChange(option.value);
        setIsOpen(false);
        setTerm('');
    }

    function onSearchKeyDown(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            setIsOpen(false);
            return;
        }
        if (e.key === 'Enter') {
            e.preventDefault();
            if (shown[activeIndex]) choose(shown[activeIndex]);
            return;
        }
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
        e.preventDefault();
        const next = e.key === 'ArrowDown'
            ? Math.min(activeIndex + 1, shown.length - 1)
            : Math.max(activeIndex - 1, 0);
        setActiveIndex(next);
        const list = listRef.current;
        const row = list && list.children[next];
        if (row && row.scrollIntoView) row.scrollIntoView({ block: 'nearest' });
    }

    const popup = pos ? React.createElement(
        'div',
        {
            ref: popupRef,
            role: 'listbox',
            'data-testid': props.testId ? props.testId + '-popup' : undefined,
            onMouseDown: function (e) { e.stopPropagation(); },
            style: {
                position: 'fixed',
                top: pos.top, bottom: pos.bottom, left: pos.left,
                width: pos.width, minWidth: pos.width, maxWidth: 420,
                maxHeight: MAX_HEIGHT,
                display: 'flex', flexDirection: 'column',
                background: S.cssVar('input-bg', '#ffffff'),
                border: '1px solid ' + S.cssVar('input-border', '#7f9db9'),
                boxShadow: '2px 2px 6px rgba(0,0,0,0.28)',
                overflowX: 'hidden',
                zIndex: 99999,
            },
        },
        React.createElement(
            'div',
            {
                style: {
                    display: 'flex', gap: 4, alignItems: 'center',
                    padding: '3px 4px', flexShrink: 0,
                    background: S.cssVar('win-face', '#f0f0e8'),
                    borderBottom: '1px solid ' + S.cssVar('win-border-soft', '#c0bdb5'),
                },
            },
            props.categories && props.categories.length
                ? React.createElement(
                    'select',
                    {
                        className: 'terras-field',
                        value: activeCategory || '',
                        onChange: function (e) { setActiveCategory(e.target.value || null); },
                        style: S.field({ height: 18, fontSize: S.fs.sm, flexShrink: 0, padding: '0 2px' }),
                    },
                    React.createElement('option', { value: '' }, 'All'),
                    props.categories.map(function (c) {
                        return React.createElement('option', { key: c, value: c }, c);
                    }),
                )
                : null,
            React.createElement('input', {
                ref: searchRef,
                type: 'text',
                className: 'terras-field',
                placeholder: 'Search...',
                value: term,
                onChange: function (e) {
                    setTerm(e.target.value);
                    if (props.onSearch) props.onSearch(e.target.value);
                },
                onKeyDown: onSearchKeyDown,
                'data-testid': props.testId ? props.testId + '-search' : undefined,
                style: S.field({ height: 18, flex: 1, minWidth: 0 }),
            }),
        ),
        React.createElement(
            'div',
            { ref: listRef, className: 'terras-scroll', style: { overflowY: 'auto', overflowX: 'hidden', flex: 1 } },
            shown.length === 0
                ? React.createElement(
                    'div',
                    {
                        style: {
                            padding: '5px 8px', fontFamily: S.font, fontSize: S.fs.sm,
                            fontStyle: 'italic', color: S.cssVar('win-text-3', '#666666'),
                        },
                    },
                    props.emptyLabel || 'No matches found',
                )
                : shown.map(function (option, index) {
                    const isSelected = option.value === props.value;
                    const isActive = index === activeIndex;
                    const label = option.label || option.subLabel || '';
                    const sub = subIsRedundant(option) ? undefined : option.subLabel;
                    const background = isSelected
                        ? S.cssVar('row-selected', '#316ac5')
                        : isActive
                            ? S.cssVar('win-highlight-tint', '#dce4f5')
                            : 'transparent';
                    return React.createElement(
                        'div',
                        {
                            key: option.value,
                            role: 'option',
                            'aria-selected': isSelected,
                            onClick: function () { choose(option); },
                            onMouseEnter: function () { setActiveIndex(index); },
                            'data-testid': props.testId ? props.testId + '-option-' + option.value : undefined,
                            style: {
                                display: 'flex', alignItems: 'baseline', gap: 6,
                                padding: '2px 6px', minHeight: 20, cursor: 'pointer',
                                fontFamily: S.font, fontSize: S.fs.base,
                                background: background,
                                color: isSelected ? S.cssVar('on-solid', '#ffffff') : S.cssVar('win-text', '#000000'),
                                borderBottom: '1px solid ' + S.cssVar('win-face-alt', '#ece9df'),
                            },
                        },
                        React.createElement(
                            'span',
                            { style: { flex: '1 1 auto', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } },
                            label,
                        ),
                        // The option's code, one tier down beside the name it
                        // belongs to. Shrinkable and capped so a long code trims
                        // itself rather than pushing the name out of the row.
                        sub
                            ? React.createElement(
                                'span',
                                {
                                    style: {
                                        fontFamily: S.fontMono, fontSize: S.fs.sm,
                                        color: isSelected ? 'rgba(255,255,255,0.75)' : S.cssVar('win-text-3', '#666666'),
                                        flex: '0 1 auto', minWidth: 0, maxWidth: '45%',
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    },
                                },
                                sub,
                            )
                            : null,
                        option.category
                            ? React.createElement(
                                'span',
                                {
                                    style: {
                                        fontSize: S.fs.sm, padding: '0 4px', flexShrink: 0,
                                        background: isSelected ? 'rgba(255,255,255,0.2)' : S.cssVar('win-face-alt', '#ece9df'),
                                        color: isSelected ? S.cssVar('on-solid', '#ffffff') : S.cssVar('win-text-2', '#333333'),
                                    },
                                },
                                option.category,
                            )
                            : null,
                    );
                }),
            hidden > 0
                ? React.createElement(
                    'div',
                    {
                        style: {
                            position: 'sticky', bottom: 0, textAlign: 'center',
                            padding: '3px 8px', fontFamily: S.font, fontSize: S.fs.sm,
                            fontStyle: 'italic', color: S.cssVar('win-text-3', '#666666'),
                            background: S.cssVar('win-face', '#f0f0e8'),
                            borderTop: '1px solid ' + S.cssVar('win-border-soft', '#c0bdb5'),
                        },
                    },
                    hidden + ' more — type to narrow',
                )
                : null,
        ),
    ) : null;

    return React.createElement(
        'div',
        {
            ref: triggerRef,
            className: props.className,
            'data-testid': props.testId,
            style: Object.assign({ position: 'relative', width: '100%' }, props.style),
        },
        React.createElement(
            'div',
            {
                role: 'combobox',
                'aria-expanded': isOpen,
                'aria-haspopup': 'listbox',
                tabIndex: props.disabled ? -1 : 0,
                title: selected ? selected.label : (props.placeholder || 'Select...'),
                onClick: function () { if (!props.disabled) setIsOpen(!isOpen); },
                onKeyDown: function (e) {
                    if (props.disabled) return;
                    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                        e.preventDefault();
                        setIsOpen(true);
                    }
                },
                'data-testid': props.testId ? props.testId + '-trigger' : undefined,
                style: S.field({
                    position: 'relative',
                    display: 'flex', alignItems: 'center',
                    height: height,
                    padding: '0 18px 0 4px',
                    cursor: props.disabled ? 'not-allowed' : 'pointer',
                    userSelect: 'none',
                    overflow: 'hidden',
                    background: props.disabled ? S.cssVar('win-face', '#f0f0e8') : S.cssVar('input-bg', '#ffffff'),
                    color: selected ? S.cssVar('win-text', '#000000') : S.cssVar('win-text-3', '#666666'),
                    outline: isOpen ? '1px dotted ' + S.cssVar('win-highlight', '#316ac5') : 'none',
                    outlineOffset: -2,
                }),
            },
            React.createElement(
                'span',
                { style: { flex: '1 1 auto', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } },
                selected ? (selected.label || selected.subLabel) : (props.placeholder || 'Select...'),
            ),
            selected && !subIsRedundant(selected)
                ? React.createElement(
                    'span',
                    {
                        style: {
                            fontFamily: S.fontMono, fontSize: S.fs.sm, marginLeft: 5,
                            color: S.cssVar('win-text-3', '#666666'),
                            flexShrink: 0, maxWidth: 80,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        },
                    },
                    selected.subLabel,
                )
                : null,
            React.createElement(
                'div',
                {
                    style: {
                        position: 'absolute', right: 0, top: 0, bottom: 0, width: 17,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'linear-gradient(to bottom, ' + S.cssVar('win-face', '#f0f0e8') + ', ' + S.cssVar('win-face-alt', '#ece9df') + ')',
                        borderLeft: '1px solid ' + S.cssVar('input-border', '#7f9db9'),
                        fontSize: S.fs.sm, color: S.cssVar('win-text-2', '#333333'),
                        pointerEvents: 'none', flexShrink: 0,
                    },
                },
                '▼',
            ),
        ),
        // Carries HTML5 `required` for the surrounding form: the trigger is a
        // div, so validation has nothing to hang off otherwise.
        React.createElement('input', {
            tabIndex: -1,
            'aria-hidden': true,
            value: props.value || '',
            onChange: function () {},
            required: props.required,
            style: { position: 'absolute', bottom: 0, left: 0, width: '100%', height: 0, opacity: 0, pointerEvents: 'none' },
        }),
        isOpen && popup && typeof document !== 'undefined'
            ? ReactDOM.createPortal(popup, document.body)
            : null,
    );
}

module.exports = Combobox;
module.exports.Combobox = Combobox;
module.exports.default = Combobox;
