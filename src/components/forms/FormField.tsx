import React from 'react';

export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  description?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({ label, htmlFor, description, error, children, className = '' }: FormFieldProps) {
  return (
    <div className={`form-group ${className}`}>
      <label htmlFor={htmlFor} className="form-label">
        {label}
      </label>
      {description && (
        <p className="text-xs text-text-muted mb-2">{description}</p>
      )}
      {children}
      {error && (
        <p className="text-xs text-danger mt-1 font-medium">{error}</p>
      )}
    </div>
  );
}
