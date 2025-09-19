
import type { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  htmlFor: string;
  children: ReactNode;
  className?: string;
}

export const FormField = ({ label, htmlFor, children, className = '' }: FormFieldProps) => {
  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      {children}
    </div>
  );
};