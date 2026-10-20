import type { ReactElement, CSSProperties, ReactNode } from 'react';

export interface FormSectionProps {
  title: ReactNode;
  /** Leading adornment in the header bar. Any ReactNode — this package has no
   *  icon-set opinion. */
  icon?: ReactNode;
  /** Trailing adornment in the header bar, e.g. an "Add" button. */
  right?: ReactNode;
  style?: CSSProperties;
  bodyStyle?: CSSProperties;
  children: ReactNode;
}

declare function FormSection(props: FormSectionProps): ReactElement;

export { FormSection };
export default FormSection;
