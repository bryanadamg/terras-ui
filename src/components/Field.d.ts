import type {
  CSSProperties,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from 'react';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;
export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;
export type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & { style?: CSSProperties };

export interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Any ReactNode; omit for no icon. */
  icon?: ReactNode;
  /** Fixed width, or the MAX width when `grow` is set. */
  width?: number;
  grow?: boolean;
  title?: string;
  autoFocus?: boolean;
  style?: CSSProperties;
}

export declare function Input(props: InputProps): JSX.Element;
export declare function Select(props: SelectProps): JSX.Element;
export declare function Label(props: LabelProps): JSX.Element;
export declare function SearchField(props: SearchFieldProps): JSX.Element;
