"use client";

import React from 'react';
import { OperationalInsight } from '@/modules/analytics/domain/analytics.model';
import { Shield, Zap, CheckCircle, AlertCircle, ArrowRight, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface OperationalInsightsProps {
  insights: OperationalInsight[];
}

export function OperationalInsights({ insights }: OperationalInsightsProps) {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'SECURITY': return <Shield className="w-4 h-4 text-rose-600" />;
      case 'EFFICIENCY': return <Zap className="w-4 h-4 text-amber-600" />;
      case 'COMPLIANCE': return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      default: return <Activity className="w-4 h-4 text-indigo-600" />;
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-rose-50 border-rose-100';
      case 'WARNING': return 'bg-amber-50 border-amber-100';
      default: return 'bg-slate-50 border-slate-100';
    }
  };

  return (
    <div className="space-y-6">
      {insights.map((insight) => (
        <div 
          key={insight.id} 
          className={`p-6 rounded-[28px] border transition-all hover:shadow-md ${getSeverityStyles(insight.severity)} group relative overflow-hidden`}
        >
          <div className="flex gap-5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-current/10 ${getSeverityStyles(insight.severity)}`}>
              {getIcon(insight.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col mb-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-900 tracking-tight">{insight.title}</h4>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    {isMounted ? formatDistanceToNow(new Date(insight.timestamp), { addSuffix: true }) : '...'}
                  </span>
                </div>
              </div>
              <p className="text-[12px] font-medium text-slate-500 leading-relaxed mb-6">
                {insight.message}
              </p>
              
              {insight.suggestedAction && (
                <button className="w-full p-4 rounded-2xl bg-white border border-slate-100 flex items-center justify-between group/btn hover:border-indigo-200 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recommendation</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest group-hover/btn:text-indigo-700 transition-colors">
                      {insight.suggestedAction}
                    </span>
                    <ArrowRight className="w-4 h-4 text-indigo-300 group-hover/btn:text-indigo-600 group-hover/btn:translate-x-1 transition-all" />
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
