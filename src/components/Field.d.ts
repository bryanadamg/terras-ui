import type {
  ReactElement,
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

export declare function Input(props: InputProps): ReactElement;
export declare function Select(props: SelectProps): ReactElement;
export declare function Label(props: LabelProps): ReactElement;
export declare function SearchField(props: SearchFieldProps): ReactElement;

export interface FieldLabelProps {
  children: ReactNode;
  htmlFor?: string;
  /** Muted italic caption under the label — only when it's needed every time. */
  hint?: ReactNode;
  /** id for the hint line, to point an input's aria-describedby at it. */
  hintId?: string;
  /** Hover explanation — for the why, read once. */
  title?: string;
  /** Right-aligned adornment on the label row (a count, a link). */
  right?: ReactNode;
}

export interface FormErrorProps {
  /** Nothing renders when empty. */
  children?: ReactNode;
  style?: CSSProperties;
}

export declare function FieldLabel(props: FieldLabelProps): ReactElement;
export declare function FormError(props: FormErrorProps): ReactElement | null;
