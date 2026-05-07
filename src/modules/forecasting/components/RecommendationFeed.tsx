"use client";

import React from 'react';
import { AlertTriangle, ShieldCheck, Activity, Users, Clock } from 'lucide-react';
import { RecommendationModel } from '../domain/forecasting.model';

interface RecommendationFeedProps {
  recommendations: RecommendationModel[];
}

export const RecommendationFeed: React.FC<RecommendationFeedProps> = ({ recommendations }) => {
  if (recommendations.length === 0) {
    return (
      <div className="p-12 rounded-3xl bg-zinc-900/40 border border-white/5 flex flex-col items-center justify-center text-center">
        <ShieldCheck className="w-12 h-12 text-zinc-700 mb-4" />
        <p className="text-zinc-500 text-sm italic font-medium">No operational risks detected. All systems within normal parameters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recommendations.map((rec) => (
        <div 
          key={rec.id}
          className="group relative overflow-hidden p-6 rounded-3xl bg-zinc-900/40 border border-white/5 backdrop-blur-md hover:border-blue-500/30 transition-all"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent pointer-events-none" />
          
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                rec.category === 'STAFFING' ? 'bg-orange-500/10 text-orange-400' :
                rec.category === 'EFFICIENCY' ? 'bg-blue-500/10 text-blue-400' :
                'bg-indigo-500/10 text-indigo-400'
              }`}>
                {rec.category === 'STAFFING' ? <Users className="w-6 h-6" /> : <Activity className="w-6 h-6" />}
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-tight">{rec.title}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/5 text-zinc-500 uppercase tracking-widest">
                    Impact: {(rec.impactScore * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">{rec.message}</p>
                
                {/* Explainability Section */}
                <div className="mt-3 p-3 rounded-xl bg-zinc-950/50 border border-white/5">
                  <p className="text-[10px] text-zinc-500 leading-relaxed italic">
                    <span className="font-bold text-blue-400/70 uppercase tracking-tighter mr-2">Explainability:</span>
                    {rec.reasoning.replace('Explainability: ', '')}
                  </p>
                </div>
              </div>
            </div>

            <button className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:border-white/20 transition-all text-[10px] font-bold uppercase tracking-widest active:scale-95">
              Review Action
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
