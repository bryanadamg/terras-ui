import type { CSSProperties } from 'react';

export interface ComboboxOption {
  value: string;
  label: string;
  /** The option's code, shown one tier down beside the name. Hidden when it duplicates the label. */
  subLabel?: string;
  /** Groups the option; pair with `categories` to get the filter select in the search row. */
  category?: string;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  /** Selected option's `value`, or '' for none. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Wired to a hidden input, so the surrounding form validates natively. */
  required?: boolean;
  /** Shows a category filter select at the head of the popup. */
  categories?: string[];
  /** Called with the typed term (and '' on close) — for server-side search. */
  onSearch?: (term: string) => void;
  /** 18px or the default 20px, matching `Input`. */
  size?: 'sm' | 'md';
  emptyLabel?: string;
  testId?: string;
  className?: string;
  style?: CSSProperties;
  /**
   * Override how the trigger is measured. Only needed by an app that scales its
   * UI (teras-erp), where a screen-px rect would misplace a fixed-position popup.
   */
  rectOf?: (el: Element) => { top: number; bottom: number; left: number; width: number };
  viewportHeight?: () => number;
}

declare function Combobox(props: ComboboxProps): JSX.Element;

export { Combobox };
export default Combobox;
