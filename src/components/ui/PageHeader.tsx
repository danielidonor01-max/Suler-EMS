import React from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className = '' }: PageHeaderProps) {
  return (
    <div className={`module-header ${className}`}>
      <div>
        <h2 className="text-[var(--text-2xl)] font-semibold mb-1 text-text-primary">{title}</h2>
        {description && (
          <p className="text-[var(--text-sm)] text-secondary m-0">{description}</p>
        )}
      </div>
      {actions && (
        <div className="module-header-actions">
          {actions}
        </div>
      )}
    </div>
  );
}
