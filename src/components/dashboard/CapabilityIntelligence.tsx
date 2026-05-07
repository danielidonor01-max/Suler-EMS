"use client";

import React from 'react';
import { Target, Sparkles, TrendingUp, ShieldCheck, Zap } from 'lucide-react';

interface CapabilityData {
  category: string;
  value: number; // 0 to 100
}

interface CapabilityIntelligenceProps {
  title?: string;
  data: CapabilityData[];
  insight: string;
}

export const CapabilityIntelligence: React.FC<CapabilityIntelligenceProps> = ({ 
  title = "Capability Intelligence", 
  data, 
  insight 
}) => {
  // Simple Radar Chart Logic (Custom SVG)
  const centerX = 100;
  const centerY = 100;
  const radius = 70;
  const angleStep = (Math.PI * 2) / data.length;

  // Calculate points for the polygon
  const points = data.map((d, i) => {
    const r = (d.value / 100) * radius;
    const x = centerX + r * Math.sin(i * angleStep);
    const y = centerY - r * Math.cos(i * angleStep);
    return `${x},${y}`;
  }).join(' ');

  // Grid levels
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1];

  return (
    <div className="bg-white p-8 rounded-[24px] border border-slate-200/60 shadow-sm flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 group-hover:scale-110 transition-transform">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">{title}</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Workforce Readiness Index</p>
          </div>
        </div>
        <div className="px-3 py-1 bg-indigo-50 rounded-lg border border-indigo-100">
           <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Optimized</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center relative min-h-[220px]">
        <svg viewBox="0 0 200 200" className="w-full max-w-[240px] drop-shadow-2xl">
          {/* Subtle Grid Circles */}
          {gridLevels.map((level, idx) => (
            <circle
              key={idx}
              cx={centerX}
              cy={centerY}
              r={level * radius}
              fill="none"
              stroke="#F1F5F9"
              strokeWidth="0.5"
            />
          ))}
          
          {/* Axis Lines */}
          {data.map((_, i) => {
            const x = centerX + radius * Math.sin(i * angleStep);
            const y = centerY - radius * Math.cos(i * angleStep);
            return (
              <line
                key={i}
                x1={centerX}
                y1={centerY}
                x2={x}
                y2={y}
                stroke="#F1F5F9"
                strokeWidth="0.5"
              />
            );
          })}

          {/* Labels */}
          {data.map((d, i) => {
            const labelRadius = radius + 20;
            const x = centerX + labelRadius * Math.sin(i * angleStep);
            const y = centerY - labelRadius * Math.cos(i * angleStep);
            return (
              <text
                key={i}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[9px] font-black fill-slate-400 uppercase tracking-[0.1em]"
              >
                {d.category}
              </text>
            );
          })}

          {/* The Data Polygon */}
          <polygon
            points={points}
            fill="rgba(79, 70, 229, 0.1)"
            stroke="#4F46E5"
            strokeWidth="1.5"
            strokeLinejoin="round"
            className="animate-pulse-subtle"
          />
          
          {/* Points */}
          {data.map((d, i) => {
            const r = (d.value / 100) * radius;
            const x = centerX + r * Math.sin(i * angleStep);
            const y = centerY - r * Math.cos(i * angleStep);
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="3"
                className="fill-white stroke-indigo-600 stroke-[1.5px]"
              />
            );
          })}
        </svg>
      </div>

      {/* AI Intelligence Layer */}
      <div className="mt-8 p-5 bg-slate-50 border border-slate-100 rounded-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-100 transition-opacity">
           <Sparkles className="w-4 h-4 text-indigo-600" />
        </div>
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
             <Zap className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="space-y-1">
             <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Capability Intelligence Summary</span>
             <p className="text-[12px] font-medium text-slate-500 leading-relaxed italic">
               "{insight}"
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};
