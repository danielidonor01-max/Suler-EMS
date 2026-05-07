import React from 'react';

export interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: {
    value: string;
    direction: 'up' | 'down';
  };
  icon?: React.ReactNode;
  iconBgColor?: string;
  iconTextColor?: string;
  className?: string;
}

export function MetricCard({ 
  label, 
  value, 
  trend, 
  icon, 
  iconBgColor = 'bg-blue-50', 
  iconTextColor = 'text-blue-600',
  className = ''
}: MetricCardProps) {
  return (
    <div className={`dashboard-card ${className}`}>
      {icon && (
        <div className={`dashboard-card-icon ${iconBgColor} ${iconTextColor}`}>
          {icon}
        </div>
      )}
      <div className="dashboard-card-label">{label}</div>
      <div className="dashboard-card-value">{value}</div>
      {trend && (
        <div className={`dashboard-card-trend ${trend.direction === 'up' ? 'trend-up' : 'trend-down'}`}>
          {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
        </div>
      )}
    </div>
  );
}
