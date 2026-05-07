"use client";

import React from 'react';
import { Users, Clock, CheckCircle2, AlertCircle, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { KPIMetric } from '@/modules/analytics/domain/analytics.model';
import { MetricCard } from '../dashboard/MetricCard';

interface KPIGridProps {
  metrics: Record<string, KPIMetric>;
}

export function KPIGrid({ metrics }: KPIGridProps) {
  const items = [
    { key: 'headcount', icon: Users, label: 'Staffing Level' },
    { key: 'utilization', icon: Activity, label: 'Utilization' },
    { key: 'compliance', icon: CheckCircle2, label: 'Compliance' },
    { key: 'turnaround', icon: Clock, label: 'Avg Approval' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {items.map(({ key, icon, label }) => {
        const metric = metrics[key] || { value: 0, status: 'NORMAL', label };
        const trendDirection = metric.trend !== undefined 
          ? (metric.trend >= 0 ? 'up' : 'down') 
          : 'neutral';
          
        return (
          <MetricCard
            key={key}
            label={metric.label || label}
            value={metric.value.toLocaleString() + (metric.unit || '')}
            trend={metric.trend !== undefined ? {
              value: `${Math.abs(metric.trend)}%`,
              direction: trendDirection as any
            } : undefined}
            icon={icon}
            variant={metric.status === 'CRITICAL' ? 'secondary' : 'primary'}
            className={metric.status === 'CRITICAL' ? 'ring-2 ring-rose-500/10' : ''}
          />
        );
      })}
    </div>
  );
}
