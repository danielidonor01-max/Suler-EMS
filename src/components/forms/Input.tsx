'use client';

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: React.ElementType;
}

export const Input: React.FC<InputProps> = ({ error, icon: Icon, className = '', ...props }) => {
  return (
    <div className="relative group">
      {Icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors duration-200">
          <Icon className="w-4.5 h-4.5" />
        </div>
      )}
      <input
        className={`w-full bg-white border rounded-xl py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all duration-200 ${
          Icon ? 'pl-11 pr-4' : 'px-4'
        } ${
          error ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/5' : 'border-slate-200'
        } ${className}`}
        {...props}
      />
      {error && (
        <div className="mt-1.5 ml-1 animate-in fade-in slide-in-from-top-1">
          <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">{error}</span>
        </div>
      )}
    </div>
  );
};
