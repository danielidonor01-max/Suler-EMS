import React, { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`form-input ${error ? 'border-danger focus:ring-danger/10 focus:border-danger' : ''} ${className}`}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
