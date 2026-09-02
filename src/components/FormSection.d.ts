import type { CSSProperties, ReactNode } from 'react';

export interface FormSectionProps {
  title: ReactNode;
  /** Trailing adornment in the header bar, e.g. an "Add" button. */
  right?: ReactNode;
  style?: CSSProperties;
  bodyStyle?: CSSProperties;
  children: ReactNode;
}

declare function FormSection(props: FormSectionProps): JSX.Element;

export { FormSection };
export default FormSection;
