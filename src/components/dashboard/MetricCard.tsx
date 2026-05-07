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
  statusLabel?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ 
  label, 
  value, 
  trend, 
  icon: Icon,
  variant = 'tonal-info',
  statusLabel
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'tonal-success': return { accent: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50/50', border: 'border-emerald-100/50' };
      case 'tonal-warning': return { accent: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50/50', border: 'border-amber-100/50' };
      case 'tonal-danger': return { accent: 'bg-rose-500', text: 'text-rose-600', bg: 'bg-rose-50/50', border: 'border-rose-100/50' };
      default: return { accent: 'bg-indigo-600', text: 'text-indigo-600', bg: 'bg-indigo-50/50', border: 'border-indigo-100/50' };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="bg-white border border-slate-200/60 rounded-[20px] px-6 py-5 shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col justify-between min-h-[160px]">
      {/* Structural Density: Reduced height and wider horizontal intent */}
      
      {/* TOP: Icon & Status Chip */}
      <div className="flex justify-between items-start">
        <div className={`w-9 h-9 rounded-lg ${styles.bg} border ${styles.border} flex items-center justify-center text-slate-400 group-hover:text-slate-900 transition-colors`}>
          {Icon && <Icon className="w-4.5 h-4.5 stroke-[1.5px]" />}
        </div>
        
        {(trend || statusLabel) && (
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
            trend?.direction === 'up' ? 'bg-emerald-50 text-emerald-600' : 
            trend?.direction === 'down' ? 'bg-rose-50 text-rose-600' : 
            'bg-slate-50 text-slate-400'
          }`}>
            {trend?.direction === 'up' && <TrendingUp className="w-2.5 h-2.5" />}
            {trend?.direction === 'down' && <TrendingDown className="w-2.5 h-2.5" />}
            {trend?.direction === 'neutral' && <Minus className="w-2.5 h-2.5" />}
            {trend ? trend.value : statusLabel}
          </div>
        )}
      </div>

      {/* CENTER: Metric & Label */}
      <div className="mt-4 space-y-0.5">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{value}</span>
          <div className="w-1 h-1 rounded-full bg-slate-200" />
        </div>
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</h4>
      </div>
      
      {/* BOTTOM: Metadata & Sync State */}
      <div className="mt-5 pt-4 border-t border-slate-100/60 flex items-center justify-between">
         <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Live Sync</span>
         </div>
         <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest opacity-60">Verified</span>
      </div>
    </div>
  );
};
