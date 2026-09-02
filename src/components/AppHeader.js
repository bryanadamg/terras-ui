'use strict';

// The full-bleed top band of the app — the flat blue bar carrying the current
// page's name on the left and global controls (language, logout, …) on the
// right. Mirrors teras-erp's `.classic-header`.
//
// Two things about its geometry are load-bearing:
//  1. Height comes from `--terras-app-header-h`, the SAME var the Sidebar's
//     brand block reads. They are separate elements sitting side by side, so
//     they only read as one continuous title band while they are the same
//     height — erp's brand block was once 40px against a 30px header and the
//     band visibly stepped down at the sidebar seam. Never re-type the number.
//  2. It stays square. It is chrome pinned to the top of the viewport, not a
//     floating window, so it does not take the 8px window radius.

const React = require('react');
const S = require('./styles');

const headerStyle = (style) => Object.assign({
    height: S.cssVar('app-header-h', '30px'),
    flexShrink: 0,
    background: S.cssVar('title-blue'),
    color: '#ffffff',
    borderBottom: '1px solid ' + S.cssVar('title-blue-border', '#003080'),
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '0 6px',
    fontFamily: S.font,
    fontSize: 11,
    fontWeight: 'bold',
    userSelect: 'none',
}, style);

const titleStyle = {
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    // Same 1px dark shadow erp's `.classic-header h5` carries — white bold text
    // on the mid-blue gradient reads thin without it.
    textShadow: '1px 1px 1px rgba(0,0,0,0.3)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
};

/**
 * @param {{
 *   title?: React.ReactNode,
 *   icon?: React.ReactNode,     // any ReactNode — no icon-set opinion
 *   right?: React.ReactNode,    // global controls, pinned to the right edge
 *   style?: object,
 * }} props
 */
function AppHeader(props) {
    return React.createElement(
        'header',
        { style: headerStyle(props.style) },
        props.icon || null,
        React.createElement('span', { style: titleStyle }, props.title),
        props.right
            ? React.createElement(
                'span',
                { style: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 } },
                props.right,
            )
            : null,
    );
}

module.exports = AppHeader;
module.exports.AppHeader = AppHeader;
