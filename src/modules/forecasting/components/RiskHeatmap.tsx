"use client";

import React from 'react';
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

interface RiskHeatmapProps {
  data: {
    department: string;
    score: number;
    trend: 'UP' | 'DOWN' | 'STABLE';
    risks: string[];
  }[];
}

export const RiskHeatmap: React.FC<RiskHeatmapProps> = ({ data }) => {
  const getRiskColor = (score: number) => {
    if (score > 0.7) return 'bg-red-500/10 border-red-500/20 text-red-400';
    if (score > 0.4) return 'bg-orange-500/10 border-orange-500/20 text-orange-400';
    return 'bg-green-500/10 border-green-500/20 text-green-400';
  };

  const getIntensity = (score: number) => {
    if (score > 0.7) return 'bg-red-500';
    if (score > 0.4) return 'bg-orange-500';
    return 'bg-green-500';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {data.map((item) => (
        <div 
          key={item.department}
          className={`p-6 rounded-3xl border backdrop-blur-md transition-all hover:scale-[1.02] ${getRiskColor(item.score)}`}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{item.department}</span>
            {item.trend === 'UP' ? <TrendingUp className="w-4 h-4 text-red-500" /> : <TrendingDown className="w-4 h-4 text-green-500" />}
          </div>
          
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-3xl font-black tracking-tighter mb-1">
                {(item.score * 100).toFixed(0)}
              </div>
              <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">Composite Risk Score</p>
            </div>
            
            <div className="flex flex-col gap-1 items-end">
              {item.risks.map((risk, i) => (
                <span key={i} className="text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-black/20 uppercase tracking-tighter">
                  {risk}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 h-1.5 w-full bg-black/10 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${getIntensity(item.score)}`}
              style={{ width: `${item.score * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
