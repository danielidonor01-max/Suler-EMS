"use client";

import React from 'react';
import { Users, Clock, CheckCircle, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { KPIMetric } from '@/modules/analytics/domain/analytics.model';

interface KPIGridProps {
  metrics: Record<string, KPIMetric>;
}

export function KPIGrid({ metrics }: KPIGridProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CRITICAL': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'WARNING': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      default: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    }
  };

  const items = [
    { key: 'headcount', icon: Users, label: 'Staffing Level' },
    { key: 'utilization', icon: TrendingUp, label: 'Utilization' },
    { key: 'compliance', icon: CheckCircle, label: 'Compliance' },
    { key: 'turnaround', icon: Clock, label: 'Avg Approval' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map(({ key, icon: Icon, label }) => {
        const metric = metrics[key] || { value: 0, status: 'NORMAL', label };
        return (
          <div key={key} className="p-5 bg-zinc-900/50 border border-white/5 rounded-2xl backdrop-blur-xl group hover:border-white/10 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-xl ${getStatusColor(metric.status)}`}>
                <Icon className="w-5 h-5" />
              </div>
              {metric.trend !== undefined && (
                <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${metric.trend >= 0 ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>
                  {metric.trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(metric.trend)}%
                </div>
              )}
            </div>
            
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-1">{metric.label || label}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-white tracking-tight">
                  {metric.value.toLocaleString()}
                </span>
                {metric.unit && (
                  <span className="text-sm font-medium text-zinc-600">{metric.unit}</span>
                )}
              </div>
            </div>

            {metric.status !== 'NORMAL' && (
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
                <AlertCircle className={`w-3.5 h-3.5 ${getStatusColor(metric.status).split(' ')[0]}`} />
                <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                  {metric.status} Threshold Reached
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
