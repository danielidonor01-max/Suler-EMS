import React from 'react';

export interface AnalyticsCardProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function AnalyticsCard({ title, subtitle, action, children, className = '' }: AnalyticsCardProps) {
  return (
    <div className={`card flex flex-col h-full ${className}`}>
      <div className="card-header flex justify-between items-start mb-4">
        <div>
          <h3 className="text-md font-semibold text-text-primary m-0">{title}</h3>
          {subtitle && (
            <p className="text-xs text-text-muted mt-1 m-0">{subtitle}</p>
          )}
        </div>
        {action && (
          <div className="shrink-0 ml-4">
            {action}
          </div>
        )}
      </div>
      <div className="flex-1 min-h-0 relative">
        {/* The consumer will place their charting library here (e.g. Recharts, Chart.js) */}
        {children}
      </div>
    </div>
  );
}
