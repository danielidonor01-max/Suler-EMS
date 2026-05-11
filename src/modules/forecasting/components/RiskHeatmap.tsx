"use client";

import React from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Activity, Shield } from 'lucide-react';

interface RiskHeatmapProps {
  data: {
    department: string;
    score: number;
    trend: 'UP' | 'DOWN' | 'STABLE';
    risks: string[];
  }[];
}

export const RiskHeatmap: React.FC<RiskHeatmapProps> = ({ data }) => {
  const getRiskStyles = (score: number) => {
    if (score > 0.7) return {
      bg: 'bg-rose-50',
      border: 'border-rose-100',
      text: 'text-rose-600',
      bar: 'bg-rose-500',
      tag: 'bg-rose-100 text-rose-700'
    };
    if (score > 0.4) return {
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      text: 'text-amber-600',
      bar: 'bg-amber-500',
      tag: 'bg-amber-100 text-amber-700'
    };
    return {
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      text: 'text-emerald-600',
      bar: 'bg-emerald-500',
      tag: 'bg-emerald-100 text-emerald-700'
    };
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {data.map((item) => {
        const styles = getRiskStyles(item.score);
        return (
          <div 
            key={item.department}
            className={`p-8 rounded-[24px] border-2 transition-all hover:shadow-raised hover:-translate-y-1 ${styles.bg} ${styles.border} group relative overflow-hidden`}
          >
            {/* Background pattern */}
            <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
              <Shield className="w-16 h-16" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">{item.department}</span>
                {item.trend === 'UP' ? (
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <TrendingUp className="w-4 h-4 text-rose-500" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <TrendingDown className="w-4 h-4 text-emerald-500" />
                  </div>
                )}
              </div>
              
              <div className="flex items-end justify-between gap-4 mb-8">
                <div>
                  <div className={`text-4xl font-bold tracking-tighter leading-none mb-2 ${styles.text}`}>
                    {(item.score * 100).toFixed(0)}
                  </div>
                  <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400 opacity-80">Composite Risk</p>
                </div>
                
                <div className="flex flex-col gap-2 items-end">
                  {item.risks.slice(0, 2).map((risk, i) => (
                    <span key={i} className={`text-[9px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-tight shadow-sm ${styles.tag}`}>
                      {risk}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px] font-medium uppercase tracking-widest text-slate-400">
                  <span>Intensity</span>
                  <span className={styles.text}>{(item.score * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2.5 w-full bg-white border border-slate-200 rounded-full overflow-hidden p-0.5">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${styles.bar} shadow-sm`}
                    style={{ width: `${item.score * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
