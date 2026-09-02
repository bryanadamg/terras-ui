const tokens = require('./tokens/tokens.json');

module.exports = tokens;
module.exports.tokens = tokens;
module.exports.cssPath = require.resolve('./tokens/tokens.css');
// Companion stylesheet holding the rules inline style objects can't express
// (:hover / :focus, ::placeholder, scrollbars, table th/td). Import BOTH — the
// components assume it is loaded.
module.exports.chromeCssPath = require.resolve('./components/chrome.css');
