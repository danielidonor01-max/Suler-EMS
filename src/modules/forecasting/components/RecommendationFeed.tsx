"use client";

import React from 'react';
import { AlertTriangle, ShieldCheck, Activity, Users, Clock, ArrowRight, BrainCircuit } from 'lucide-react';
import { RecommendationModel } from '../domain/forecasting.model';

interface RecommendationFeedProps {
  recommendations: RecommendationModel[];
}

export const RecommendationFeed: React.FC<RecommendationFeedProps> = ({ recommendations }) => {
  if (recommendations.length === 0) {
    return (
      <div className="p-16 rounded-[32px] bg-white border border-slate-100 shadow-premium flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-[22px] bg-emerald-50 flex items-center justify-center text-emerald-600 mb-6">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <p className="text-slate-900 text-[14px] font-black uppercase tracking-widest mb-2">Systems Nominal</p>
        <p className="text-slate-400 text-xs font-medium max-w-[240px]">No operational risks detected. All organizational parameters are within optimal thresholds.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {recommendations.map((rec) => (
        <div 
          key={rec.id}
          className="group relative overflow-hidden p-8 rounded-[32px] bg-white border border-slate-100 shadow-premium hover:border-indigo-200 transition-all hover:shadow-xl hover:shadow-indigo-100/20"
        >
          <div className="relative flex flex-col gap-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 ${
                  rec.category === 'STAFFING' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                  rec.category === 'EFFICIENCY' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' :
                  'bg-slate-50 border-slate-100 text-slate-600'
                }`}>
                  {rec.category === 'STAFFING' ? <Users className="w-7 h-7" /> : <Activity className="w-7 h-7" />}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-black text-slate-900 tracking-tight leading-none">{rec.title}</h3>
                    <div className="px-2.5 py-1 rounded-full bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-widest border border-slate-100">
                      Impact: {(rec.impactScore * 100).toFixed(0)}%
                    </div>
                  </div>
                  <p className="text-[13px] text-slate-500 font-medium leading-relaxed max-w-xl">{rec.message}</p>
                </div>
              </div>

              <button className="hidden md:flex items-center gap-2 px-6 py-3 rounded-full bg-slate-50 hover:bg-indigo-600 hover:text-white text-slate-600 transition-all text-[11px] font-black uppercase tracking-wider active:scale-95 shadow-sm">
                Review Action
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Explainability / Reasoning Surface */}
            <div className="p-5 rounded-[22px] bg-slate-50/50 border border-slate-100 relative overflow-hidden">
              <div className="relative z-10 flex gap-3">
                <BrainCircuit className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-500 leading-relaxed font-bold">
                  <span className="text-indigo-600 uppercase tracking-widest mr-2">Reasoning:</span>
                  {rec.reasoning.replace('Explainability: ', '')}
                </p>
              </div>
              <div className="absolute top-0 right-0 p-2 opacity-5">
                <Activity className="w-12 h-12" />
              </div>
            </div>

            <button className="md:hidden w-full py-4 rounded-2xl bg-indigo-600 text-white text-[11px] font-black uppercase tracking-wider">
              Execute Action
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
