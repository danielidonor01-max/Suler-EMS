"use client";

import React from 'react';
import { OperationalInsight } from '@/modules/analytics/domain/analytics.model';
import { Shield, Zap, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface OperationalInsightsProps {
  insights: OperationalInsight[];
}

export function OperationalInsights({ insights }: OperationalInsightsProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'SECURITY': return <Shield className="w-4 h-4 text-red-400" />;
      case 'EFFICIENCY': return <Zap className="w-4 h-4 text-amber-400" />;
      case 'COMPLIANCE': return <CheckCircle className="w-4 h-4 text-green-400" />;
      default: return <AlertCircle className="w-4 h-4 text-blue-400" />;
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-400/10 border-red-400/20';
      case 'WARNING': return 'bg-amber-400/10 border-amber-400/20';
      default: return 'bg-zinc-800/50 border-white/5';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-white tracking-tight uppercase tracking-widest">Operational Insights</h3>
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{insights.length} Detected</span>
      </div>

      {insights.map((insight) => (
        <div 
          key={insight.id} 
          className={`p-5 rounded-2xl border transition-all hover:scale-[1.01] ${getSeverityStyles(insight.severity)}`}
        >
          <div className="flex gap-4">
            <div className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${getSeverityStyles(insight.severity)}`}>
              {getIcon(insight.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-bold text-white tracking-tight">{insight.title}</h4>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                  {formatDistanceToNow(new Date(insight.timestamp), { addSuffix: true })}
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                {insight.message}
              </p>
              
              {insight.suggestedAction && (
                <button className="w-full p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between group hover:border-white/10 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Suggested Action</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest group-hover:text-blue-400 transition-colors">
                      {insight.suggestedAction}
                    </span>
                    <ArrowRight className="w-3 h-3 text-zinc-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
