// Raw token values, mirroring src/tokens/tokens.json. Typed loosely on purpose:
// the JSON is the source of truth and gains branches often, and a hand-written
// exhaustive interface would be one more thing to keep in sync by hand.
export interface Tokens {
  color: Record<string, Record<string, any>>;
  radius: Record<string, number>;
  /** Family stacks, plus `size` (the fs-* scale, px numbers) and `trackingCaps`. */
  font: Record<string, any>;
  shadow: Record<string, string>;
  layout: Record<string, number>;
  zIndex: Record<string, number>;
  breakpoint: Record<string, number>;
}

declare const tokens: Tokens & {
  tokens: Tokens;
  /** Resolved path to tokens.css — the custom properties. */
  cssPath: string;
  /** Resolved path to chrome.css — the :hover/:focus/table rules the components need. */
  chromeCssPath: string;
  /** Resolved path to scale.css — the opt-in interface scale (root zoom). Inert until an app stamps `data-ui-scale`; drive it from `terras-ui/scale`. */
  scaleCssPath: string;
};

export default tokens;

// The same values, as named exports — index.js hangs them off module.exports.
export declare const color: Tokens['color'];
export declare const radius: Tokens['radius'];
export declare const font: Tokens['font'];
export declare const shadow: Tokens['shadow'];
export declare const layout: Tokens['layout'];
export declare const zIndex: Tokens['zIndex'];
export declare const breakpoint: Tokens['breakpoint'];
export declare const cssPath: string;
export declare const chromeCssPath: string;
export declare const scaleCssPath: string;
export { tokens };
