import React from 'react';

export interface ActionBarProps {
  children: React.ReactNode;
  className?: string;
}

export function ActionBar({ children, className = '' }: ActionBarProps) {
  return (
    <div className={`p-4 border-b border-border ${className}`}>
      <div className="filter-bar p-0 items-center">
        {children}
      </div>
    </div>
  );
}

export function ActionBarLeft({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2 items-center flex-1">{children}</div>;
}

export function ActionBarRight({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-3 shrink-0">{children}</div>;
}
