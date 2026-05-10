"use client";

import React, { useEffect } from 'react';
import { X, ArrowLeft } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  children 
}) => {
  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Prevent scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end transition-all duration-500 ease-in-out">
      {/* Backdrop — solid overlay, no blur */}
      <div 
        className="absolute inset-0 bg-slate-900/30 animate-in fade-in duration-500"
        onClick={onClose}
      />
      
      {/* Drawer Surface */}
      <div 
        className="relative w-full max-w-[580px] h-full bg-white shadow-premium border-l border-slate-200 animate-in slide-in-from-right duration-500 flex flex-col"
      >
        {/* Header - Mature Operational Control */}
        <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-1">
               <button onClick={onClose} className="p-1.5 -ml-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-900 transition-all">
                  <ArrowLeft className="w-4 h-4" />
               </button>
               <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
            </div>
            {subtitle && <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest pl-7">{subtitle}</p>}
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
          {children}
        </div>

        {/* Footer Actions (Optional) */}
        <div className="px-10 py-6 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0 bg-slate-50">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-[11px] font-bold text-slate-500 hover:text-slate-900 transition-all uppercase tracking-wider"
          >
            Close Panel
          </button>
          <button className="bg-slate-900 hover:bg-black text-white px-8 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-md">
            Execute Actions
          </button>
        </div>
      </div>
    </div>
  );
};
