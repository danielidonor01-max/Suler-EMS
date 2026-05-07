'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, LucideIcon } from 'lucide-react';

export interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
  icon?: any; // Accepting lucide string names or components
  className?: string;
  variant?: 'primary' | 'tonal-success' | 'tonal-info' | 'tonal-warning' | 'tonal-danger';
}

export function MetricCard({ 
  label, 
  value, 
  trend, 
  icon: Icon, 
  className = '',
  variant = 'primary'
}: MetricCardProps) {
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'tonal-success': return 'bg-emerald-50/50 border-emerald-100/50';
      case 'tonal-info': return 'bg-indigo-50/50 border-indigo-100/50';
      case 'tonal-warning': return 'bg-amber-50/50 border-amber-100/50';
      case 'tonal-danger': return 'bg-rose-50/50 border-rose-100/50';
      default: return 'bg-white border-slate-100 shadow-sm';
    }
  };

  const getIconStyles = () => {
    switch (variant) {
      case 'tonal-success': return 'bg-white text-emerald-600 shadow-sm';
      case 'tonal-info': return 'bg-white text-indigo-600 shadow-sm';
      case 'tonal-warning': return 'bg-white text-amber-600 shadow-sm';
      case 'tonal-danger': return 'bg-white text-rose-600 shadow-sm';
      default: return 'bg-slate-50 text-slate-400 group-hover:bg-slate-900 group-hover:text-white';
    }
  };

  // Support for lucide icons as components
  const IconComponent = typeof Icon === 'string' ? null : Icon;

  return (
    <div className={`group rounded-[20px] border transition-all duration-300 overflow-hidden ${getVariantStyles()} ${className}`}>
      <div className="p-7">
        <div className="flex items-start justify-between mb-8">
          <div className="flex flex-col gap-1.5">
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${
              variant.startsWith('tonal') ? 'text-slate-500/70' : 'text-slate-400'
            }`}>
              {label}
            </span>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
              {value}
            </h3>
          </div>
          
          {IconComponent && (
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 border border-transparent group-hover:border-slate-200 ${getIconStyles()}`}>
              <IconComponent className="w-5 h-5" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {trend && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black shadow-sm ${
              trend.direction === 'up' ? 'bg-emerald-500 text-white' : 
              trend.direction === 'down' ? 'bg-rose-500 text-white' : 
              'bg-slate-200 text-slate-600'
            }`}>
              {trend.direction === 'up' && <ArrowUpRight className="w-3 h-3" />}
              {trend.direction === 'down' && <ArrowDownRight className="w-3 h-3" />}
              {trend.direction === 'neutral' && <Minus className="w-3 h-3" />}
              {trend.value}
            </div>
          )}
          <span className={`text-[10px] font-bold uppercase tracking-tighter ${
            variant.startsWith('tonal') ? 'text-slate-400/60' : 'text-slate-400'
          }`}>
            Live Sync • 95% Confidence
          </span>
        </div>
      </div>
    </div>
  );
}
