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
};

export default tokens;
