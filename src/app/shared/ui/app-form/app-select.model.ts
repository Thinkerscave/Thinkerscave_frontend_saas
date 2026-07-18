export interface AppSelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}
