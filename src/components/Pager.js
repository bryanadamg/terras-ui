'use strict';

// Prev/next paginator footer. Mirrors terras-erp's `shared/Pager.tsx` — the same
// props (`page` / `total` / `pageSize` / `onPageChange`, plus `hideWhenEmpty`
// and `leftContent`), the same two halves: a "from-to of total" summary on the
// left, and Prev / "Page x / y" / Next on the right.
//
// Paging state stays with the caller (erp's is server-side, out of
// `DataContext.pagination`). This owns arithmetic and chrome only: the page
// count, the row window, which end is reached — the three lines every one of
// erp's ~20 hand-rolled pagers re-derived, two of them off by one at total 0.
//
// There is no rows-per-page picker because erp has none: every view fixes its
// own `PAGE_SIZE` const. Don't add one here before it exists there.
//
// Two shapes, one face:
//   default        — paints the strip, i.e. renders as a `Window.StatusBar`.
//                    Drop it under a `Window.Body`, which is erp's usage.
//   `inline`       — no strip; stretches to fill a `Window.StatusBar` you are
//                    already rendering, so a bar that also carries other status
//                    text doesn't end up with a second bevelled floor under it.
//
// Prev/Next are plain `Button`s — same button family as the toolbar above, so
// the pager reads as part of the same system rather than a one-off. Their
// disabled face is `.terras-btn:disabled` in chrome.css (the 0.5 opacity erp
// writes inline at the call site), so nothing here dims them by hand.

const React = require('react');
const S = require('./styles');
const Button = require('./Button');
const Window = require('./Window');

/**
 * @param {{
 *   page: number,
 *   total: number,
 *   pageSize: number,
 *   onPageChange: (page: number) => void,
 *   hideWhenEmpty?: boolean,
 *   leftContent?: React.ReactNode,
 *   inline?: boolean,
 *   prevLabel?: React.ReactNode,
 *   nextLabel?: React.ReactNode,
 *   ariaLabel?: string,
 *   style?: object,
 *   className?: string,
 * }} props
 */
function Pager(props) {
    const pageSize = props.pageSize > 0 ? props.pageSize : 1;
    const total = props.total || 0;
    if (props.hideWhenEmpty && !total) return null;

    const pages = Math.max(1, Math.ceil(total / pageSize));
    // Clamp rather than trust: a filter that shrinks `total` leaves the caller
    // holding a page number past the end until its own effect catches up.
    const page = Math.min(Math.max(props.page || 1, 1), pages);
    const from = total ? (page - 1) * pageSize + 1 : 0;
    const to = Math.min(page * pageSize, total);

    const go = (target) => () => {
        if (props.onPageChange) props.onPageChange(Math.min(Math.max(target, 1), pages));
    };

    const summary = React.createElement(
        'span',
        { style: { color: S.cssVar('win-text-2', '#333333'), fontFamily: S.fontData } },
        props.leftContent != null ? props.leftContent : from + '-' + to + ' of ' + total,
    );

    const nav = React.createElement(
        'nav',
        {
            'aria-label': props.ariaLabel || 'Pagination',
            style: { display: 'flex', alignItems: 'center', gap: 8 },
        },
        React.createElement(
            Button,
            { onClick: go(page - 1), disabled: page <= 1, title: 'Previous page' },
            props.prevLabel != null ? props.prevLabel : '‹ Prev',
        ),
        React.createElement(
            'span',
            { style: { color: S.cssVar('win-text-2', '#333333'), whiteSpace: 'nowrap' } },
            'Page ' + page + ' / ' + pages,
        ),
        React.createElement(
            Button,
            { onClick: go(page + 1), disabled: page >= pages, title: 'Next page' },
            props.nextLabel != null ? props.nextLabel : 'Next ›',
        ),
    );

    if (props.inline) {
        return React.createElement(
            'div',
            {
                className: props.className,
                style: Object.assign({
                    // `flex: 1` is what lets it sit as a StatusBar child and
                    // still push the nav to the far right — the bar's own
                    // `right` slot stays free for the app's other status.
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    minWidth: 0,
                }, props.style),
            },
            summary,
            nav,
        );
    }

    // The strip itself is Window.StatusBar — same sunken floor, same padding and
    // type. Re-declaring that face here is exactly the drift this package exists
    // to stop.
    return React.createElement(
        Window.StatusBar,
        { style: props.style, className: props.className, right: nav },
        summary,
    );
}

module.exports = Pager;
module.exports.Pager = Pager;
