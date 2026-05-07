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
  icon?: LucideIcon;
  className?: string;
  variant?: 'primary' | 'tonal-success' | 'tonal-info' | 'tonal-warning';
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
      case 'tonal-success': return 'bg-[#ecfdf5] border-[#d1fae5]';
      case 'tonal-info': return 'bg-[#eff6ff] border-[#dbeafe]';
      case 'tonal-warning': return 'bg-[#fffbeb] border-[#fef3c7]';
      default: return 'bg-white border-slate-100 shadow-premium';
    }
  };

  const getIconStyles = () => {
    switch (variant) {
      case 'tonal-success': return 'bg-white text-emerald-600 shadow-sm';
      case 'tonal-info': return 'bg-white text-indigo-600 shadow-sm';
      case 'tonal-warning': return 'bg-white text-amber-600 shadow-sm';
      default: return 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600';
    }
  };

  return (
    <div className={`group rounded-[32px] border transition-all duration-300 overflow-hidden ${getVariantStyles()} ${className}`}>
      <div className="p-7">
        <div className="flex items-start justify-between mb-8">
          <div className="flex flex-col gap-1">
            <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${
              variant.startsWith('tonal') ? 'opacity-60' : 'text-slate-400'
            }`}>
              {label}
            </span>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
              {value}
            </h3>
          </div>
          
          {Icon && (
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${getIconStyles()}`}>
              <Icon className="w-5.5 h-5.5" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {trend && (
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold shadow-sm ${
              trend.direction === 'up' ? 'bg-emerald-500 text-white' : 
              trend.direction === 'down' ? 'bg-rose-500 text-white' : 
              'bg-slate-200 text-slate-600'
            }`}>
              {trend.direction === 'up' && <ArrowUpRight className="w-3.5 h-3.5" />}
              {trend.direction === 'down' && <ArrowDownRight className="w-3.5 h-3.5" />}
              {trend.direction === 'neutral' && <Minus className="w-3.5 h-3.5" />}
              {trend.value}
            </div>
          )}
          <span className={`text-[10px] font-bold uppercase tracking-tighter ${
            variant.startsWith('tonal') ? 'opacity-50' : 'text-slate-400'
          }`}>
            Performance Baseline
          </span>
        </div>
      </div>
    </div>
  );
}
