import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'pending' | 'critical' | 'high' | 'medium' | 'low';

export interface StatusBadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  showDot?: boolean;
  className?: string;
}

export function StatusBadge({ variant, children, showDot = true, className = '' }: StatusBadgeProps) {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {showDot && (
        <span className="w-1.5 h-1.5 rounded-full mr-1.5 inline-block bg-current opacity-75"></span>
      )}
      {children}
    </span>
  );
}
