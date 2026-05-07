'use client';

import React from 'react';

interface FormFieldProps {
  label: string;
  description?: string;
  children: React.ReactNode;
  required?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({ label, description, children, required }) => {
  return (
    <div className="space-y-2.5">
      <div className="flex flex-col gap-0.5 ml-1">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] flex items-center gap-1.5">
          {label}
          {required && <span className="text-rose-400 font-black">*</span>}
        </label>
        {description && (
          <p className="text-[11px] font-medium text-slate-400 tracking-tight">
            {description}
          </p>
        )}
      </div>
      <div className="relative">
        {children}
      </div>
    </div>
  );
};
