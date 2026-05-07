"use client";

import React from 'react';
import { Layout, Search, Sparkles, Activity } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: any;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  title, 
  description, 
  icon: Icon = Layout, 
  actionLabel, 
  onAction 
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-in">
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-[24px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 relative z-10">
          <Icon className="w-10 h-10" />
        </div>
        {/* Subtle decorative glow */}
        <div className="absolute inset-0 blur-3xl bg-slate-200/40 -z-10 rounded-full" />
      </div>

      <div className="max-w-[360px] space-y-2">
        <h3 className="text-lg font-black text-slate-900 tracking-tight">{title}</h3>
        <p className="text-[13px] font-medium text-slate-400 leading-relaxed">
          {description}
        </p>
      </div>

      {actionLabel && (
        <button 
          onClick={onAction}
          className="mt-8 bg-slate-900 hover:bg-black text-white px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-md active:scale-[0.95]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
