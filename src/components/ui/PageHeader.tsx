'use client';

import React from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className = '' }: PageHeaderProps) {
  return (
    <div className={`flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 ${className}`}>
      <div className="max-w-[720px]">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-none mb-3">
          {title}
        </h1>
        {description && (
          <p className="text-[15px] font-medium text-slate-400 leading-relaxed tracking-tight">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
