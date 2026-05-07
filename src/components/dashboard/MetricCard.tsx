"use client";

import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
  };
  icon?: LucideIcon;
  variant?: 'tonal-success' | 'tonal-info' | 'tonal-warning' | 'tonal-danger';
}

export const MetricCard: React.FC<MetricCardProps> = ({ 
  label, 
  value, 
  trend, 
  icon: Icon,
  variant = 'tonal-info'
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'tonal-success': return { accent: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50/50' };
      case 'tonal-warning': return { accent: 'bg-rose-500', text: 'text-rose-600', bg: 'bg-rose-50/50' };
      case 'tonal-danger': return { accent: 'bg-rose-600', text: 'text-rose-600', bg: 'bg-rose-50/50' };
      default: return { accent: 'bg-indigo-600', text: 'text-indigo-600', bg: 'bg-indigo-50/50' };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="bg-white border border-slate-200/60 rounded-[20px] p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
      {/* Tiny Colored Metric Indicator (Maturity Accent) */}
      <div className={`absolute top-0 left-0 w-1 h-full ${styles.accent} opacity-10 group-hover:opacity-100 transition-opacity`} />
      
      <div className="flex justify-between items-start mb-6">
        <div className={`w-10 h-10 rounded-xl ${styles.bg} flex items-center justify-center text-slate-400 group-hover:text-slate-900 transition-colors`}>
          {Icon && <Icon className="w-5 h-5 stroke-[1.5px]" />}
        </div>
        
        {trend && (
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
            trend.direction === 'up' ? 'bg-emerald-50 text-emerald-600' : 
            trend.direction === 'down' ? 'bg-rose-50 text-rose-600' : 
            'bg-slate-50 text-slate-400'
          }`}>
            {trend.direction === 'up' ? <TrendingUp className="w-3 h-3" /> : 
             trend.direction === 'down' ? <TrendingDown className="w-3 h-3" /> : 
             <Minus className="w-3 h-3" />}
            {trend.value}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</h4>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{value}</span>
          <div className="w-1 h-1 rounded-full bg-slate-200" />
        </div>
      </div>
      
      {/* Operational Sync Metadata */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
         <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Real-time Sync</span>
         <div className="flex gap-0.5">
            {[1,2,3,4].map(i => <div key={i} className="w-3 h-1 rounded-full bg-slate-100" />)}
         </div>
      </div>
    </div>
  );
};
