const tokens = require('./tokens/tokens.json');

module.exports = tokens;
module.exports.tokens = tokens;
module.exports.cssPath = require.resolve('./tokens/tokens.css');
// Companion stylesheet holding the rules inline style objects can't express
// (:hover / :focus, ::placeholder, scrollbars, table th/td). Import BOTH — the
// components assume it is loaded.
module.exports.chromeCssPath = require.resolve('./components/chrome.css');
// Opt-in interface scale (root zoom). Import this THIRD and drive it from
// `terras-ui/scale`; without that the sheet is inert. See src/tokens/scale.css.
module.exports.scaleCssPath = require.resolve('./tokens/scale.css');
