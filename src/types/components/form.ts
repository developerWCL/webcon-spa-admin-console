/**
 * Form and Input Component Props Types
 *
 * Props for form-related components like inputs, selects, etc.
 */

import type { ReactNode } from "react";

/**
 * Form field props - wrapper for individual form controls
 */
export interface FormFieldProps {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}

/**
 * Text input props
 */
export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  placeholder?: string;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
}

/**
 * Textarea props
 */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  rows?: number;
  showCharCount?: boolean;
  maxChars?: number;
}

/**
 * Select option item
 */
export interface SelectOption<T = string | number> {
  label: string;
  value: T;
  disabled?: boolean;
  group?: string;
}

/**
 * Select component props
 */
export interface SelectProps<T = string | number> {
  label?: string;
  options: SelectOption<T>[];
  value?: T;
  onChange?: (value: T) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  placeholder?: string;
  multiple?: boolean;
  disabled?: boolean;
  clearable?: boolean;
  searchable?: boolean;
}

/**
 * Checkbox props
 */
export interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label?: string;
  description?: string;
  error?: string;
}

/**
 * Radio button props
 */
export interface RadioProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label?: string;
  description?: string;
}

/**
 * Date picker props
 */
export interface DatePickerProps {
  label?: string;
  value?: Date | string;
  onChange?: (date: Date | string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  dateFormat?: string;
}

/**
 * Date range picker props
 */
export interface DateRangePickerProps {
  label?: string;
  value?: { from?: Date | string; to?: Date | string };
  onChange?: (range: { from?: Date | string; to?: Date | string }) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
}

/**
 * Time picker props
 */
export interface TimePickerProps {
  label?: string;
  value?: string;
  onChange?: (time: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  format?: "12h" | "24h";
  step?: number;
}

/**
 * File input props
 */
export interface FileInputProps {
  label?: string;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  error?: string;
  hint?: string;
  required?: boolean;
  onChange?: (files: File[]) => void;
}

/**
 * Form button props
 */
export interface FormButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}
