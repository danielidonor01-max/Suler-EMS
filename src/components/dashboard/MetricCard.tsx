'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
  icon?: React.ElementType;
  className?: string;
  variant?: 'primary' | 'secondary';
}

export function MetricCard({ 
  label, 
  value, 
  trend, 
  icon: Icon, 
  className = '',
  variant = 'primary'
}: MetricCardProps) {
  return (
    <div className={`group p-6 rounded-[28px] transition-all duration-300 ${
      variant === 'primary' 
        ? 'bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.05),0_12px_24px_rgba(0,0,0,0.05)] hover:shadow-[0_0_0_1px_rgba(79,70,229,0.1),0_4px_8px_rgba(0,0,0,0.05),0_20px_40px_rgba(0,0,0,0.08)]' 
        : 'bg-slate-50 border border-slate-100 hover:border-slate-200'
    } ${className}`}>
      <div className="flex items-start justify-between mb-8">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">{label}</span>
          <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">{value}</h3>
        </div>
        
        {Icon && (
          <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:border-indigo-100 group-hover:bg-indigo-50 transition-all duration-300">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {trend && (
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${
            trend.direction === 'up' ? 'bg-emerald-50 text-emerald-600' : 
            trend.direction === 'down' ? 'bg-rose-50 text-rose-600' : 
            'bg-slate-50 text-slate-500'
          }`}>
            {trend.direction === 'up' && <ArrowUpRight className="w-3.5 h-3.5" />}
            {trend.direction === 'down' && <ArrowDownRight className="w-3.5 h-3.5" />}
            {trend.direction === 'neutral' && <Minus className="w-3.5 h-3.5" />}
            {trend.value}
          </div>
        )}
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Vs. Previous Month</span>
      </div>
    </div>
  );
}
